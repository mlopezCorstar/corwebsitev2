/* consent.js — cookie/consent controller for the Corstar site.
 *
 * Owns the whole consent lifecycle: reading and validating the stored record,
 * rendering the first-visit banner and the preference dialog, and gating every
 * optional third party behind an explicit decision.
 *
 * Two optional categories exist today:
 *
 *   analytics             Google Analytics 4 (G-KRHBHXTBMJ)
 *   appointmentScheduling Microsoft Bookings iframe on consultation.html
 *
 * Nothing in either category may touch the network before the visitor says so.
 * Necessary technology — the preference record itself — is always active and is
 * not presented as a choice, because the site cannot remember a rejection
 * without storing that rejection.
 *
 * Other scripts can react to decisions via the `corstar:consent` event:
 *
 *   document.addEventListener('corstar:consent', (e) => e.detail.analytics);
 *
 * Adding a category later means bumping CONSENT_VERSION, which asks every
 * visitor again. Raising the version never turns an old rejection into an
 * acceptance — see normalise().
 */
(function () {
  'use strict';

  var CONSENT_VERSION = 1;
  var STORAGE_KEY = 'corstar_consent_v1';
  var MAX_AGE_DAYS = 180;                 // re-ask after roughly six months
  var GA_MEASUREMENT_ID = 'G-KRHBHXTBMJ';

  var CATEGORIES = [
    {
      key: 'analytics',
      label: 'Analytics',
      description: 'Lets us count visits and see which pages are useful, using ' +
                   'Google Analytics. It sets cookies in your browser. We use ' +
                   'it only to improve the site.'
    },
    {
      key: 'appointmentScheduling',
      label: 'Appointment scheduling',
      description: 'Loads the booking calendar provided by Microsoft so you can ' +
                   'pick a time without leaving the site. Microsoft may set ' +
                   'cookies or similar technology when it loads.'
    }
  ];

  /* ────────────────────────────────────────────────────────────
     Paths — pages live at the root and one level down, and the
     site may be served from a subfolder on GitHub Pages, so links
     are built relative to the current page rather than absolute.
     ──────────────────────────────────────────────────────────── */
  function prefix() {
    return /\/(services|industries|resources)\//.test(window.location.pathname)
      ? '../' : '';
  }
  function url(page) { return prefix() + page; }

  /* ────────────────────────────────────────────────────────────
     Storage. Every read and write is guarded: Safari in private
     mode and browsers with storage disabled throw on access, and
     that must degrade to "no stored choice", never to a crash.
     ──────────────────────────────────────────────────────────── */
  function safeGet() {
    try { return window.localStorage.getItem(STORAGE_KEY); }
    catch (e) { return null; }
  }
  function safeSet(value) {
    try { window.localStorage.setItem(STORAGE_KEY, value); return true; }
    catch (e) { return false; }
  }

  function expired(record) {
    var then = Date.parse(record.updatedAt);
    if (isNaN(then)) return true;
    return (Date.now() - then) > MAX_AGE_DAYS * 864e5;
  }

  /* A record is only usable if it is well formed, current, and unexpired.
     Anything else — corrupted JSON, an older consent version, a stale
     decision — means we have no answer and must ask again. */
  function normalise(raw) {
    if (!raw) return null;
    var record;
    try { record = JSON.parse(raw); } catch (e) { return null; }
    if (!record || typeof record !== 'object') return null;
    if (record.version !== CONSENT_VERSION) return null;
    if (expired(record)) return null;

    var clean = { version: CONSENT_VERSION, updatedAt: record.updatedAt };
    for (var i = 0; i < CATEGORIES.length; i++) {
      // Anything not explicitly true counts as a rejection, so a malformed or
      // partial record can never be read as permission.
      clean[CATEGORIES[i].key] = record[CATEGORIES[i].key] === true;
    }
    return clean;
  }

  var state = normalise(safeGet());

  function granted(key) { return !!(state && state[key] === true); }
  function hasDecision() { return state !== null; }

  function persist(choices) {
    // A deliberate decision overrides any one-time exception still in force, so
    // withdrawing a category takes down an embed the visitor had loaded just
    // for this visit rather than leaving it running.
    Array.prototype.forEach.call(embeds(), function (host) {
      host.removeAttribute('data-one-time');
    });
    var record = { version: CONSENT_VERSION, updatedAt: new Date().toISOString() };
    for (var i = 0; i < CATEGORIES.length; i++) {
      var key = CATEGORIES[i].key;
      record[key] = choices[key] === true;
    }
    state = record;
    safeSet(JSON.stringify(record));    // a failed write still applies this visit
    apply();
    document.dispatchEvent(new CustomEvent('corstar:consent', {
      detail: { analytics: record.analytics,
                appointmentScheduling: record.appointmentScheduling }
    }));
  }

  function setAll(value) {
    var choices = {};
    for (var i = 0; i < CATEGORIES.length; i++) choices[CATEGORIES[i].key] = value;
    persist(choices);
  }

  /* ────────────────────────────────────────────────────────────
     Google Analytics. The gtag.js tag is never in the markup; it
     is injected here and only after consent, so a visitor who has
     not agreed makes no request to Google at all. The inline stub
     in each page has already set Consent Mode defaults to denied.
     ──────────────────────────────────────────────────────────── */
  var analyticsLoaded = false;

  function gtag() {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(arguments);
  }

  function loadAnalytics() {
    if (analyticsLoaded) {
      gtag('consent', 'update', { analytics_storage: 'granted' });
      return;
    }
    analyticsLoaded = true;
    gtag('consent', 'update', { analytics_storage: 'granted' });

    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_MEASUREMENT_ID;
    document.head.appendChild(s);

    gtag('js', new Date());
    gtag('config', GA_MEASUREMENT_ID);
  }

  /* Withdrawal cannot un-send what was already collected, and we do not claim
     otherwise. It does stop further collection and clears the cookies GA set on
     this domain so the next visit starts without an identifier. */
  function unloadAnalytics() {
    gtag('consent', 'update', { analytics_storage: 'denied' });
    var host = window.location.hostname;
    document.cookie.split(';').forEach(function (entry) {
      var name = entry.split('=')[0].trim();
      if (!/^_ga/.test(name)) return;
      ['/', window.location.pathname].forEach(function (path) {
        [host, '.' + host, ''].forEach(function (domain) {
          document.cookie = name + '=; Max-Age=0; path=' + path +
            (domain ? '; domain=' + domain : '');
        });
      });
    });
  }

  /* ────────────────────────────────────────────────────────────
     Consent-gated embeds. Markup carries the third-party URL in
     data-src so the browser cannot request it on parse.
     ──────────────────────────────────────────────────────────── */
  function embeds() {
    return document.querySelectorAll('[data-consent-embed]');
  }

  function loadEmbed(host) {
    if (host.querySelector('iframe')) return;
    var frame = host.querySelector('.consent-embed__frame');
    var src = host.getAttribute('data-src');
    if (!frame || !src) return;

    var iframe = document.createElement('iframe');
    iframe.src = src;
    iframe.title = host.getAttribute('data-title') || 'Embedded content';
    iframe.setAttribute('width', '100%');
    iframe.setAttribute('height', '100%');
    iframe.setAttribute('scrolling', 'yes');
    iframe.style.border = '0';
    frame.appendChild(iframe);

    host.classList.add('is-loaded');
    var placeholder = host.querySelector('.consent-embed__placeholder');
    if (placeholder) placeholder.hidden = true;
  }

  function unloadEmbed(host) {
    var frame = host.querySelector('.consent-embed__frame');
    if (frame) frame.innerHTML = '';
    host.classList.remove('is-loaded');
    var placeholder = host.querySelector('.consent-embed__placeholder');
    if (placeholder) placeholder.hidden = false;
  }

  /* Reconcile every gated thing on the page with the current record. */
  function apply() {
    if (granted('analytics')) loadAnalytics();
    else if (analyticsLoaded) unloadAnalytics();

    Array.prototype.forEach.call(embeds(), function (host) {
      var category = host.getAttribute('data-consent-embed');
      if (granted(category)) loadEmbed(host);
      // A one-time load is a deliberate exception to the stored preference and
      // is left alone until the visitor navigates away.
      else if (!host.hasAttribute('data-one-time')) unloadEmbed(host);
    });
  }

  /* ────────────────────────────────────────────────────────────
     Banner — non-modal by design. It sits at the bottom, does not
     trap focus, and does not stop anyone reading or navigating.
     ──────────────────────────────────────────────────────────── */
  var banner = null;

  function measureBanner() {
    if (!banner) return;
    document.documentElement.style.setProperty(
      '--consent-banner-height', banner.offsetHeight + 'px');
  }

  function showBanner() {
    if (banner) return;
    banner = document.createElement('div');
    banner.className = 'consent-banner';
    banner.setAttribute('role', 'region');
    banner.setAttribute('aria-label', 'Cookie choices');
    banner.innerHTML =
      '<div class="consent-banner__inner">' +
        '<div class="consent-banner__copy">' +
          '<p class="consent-banner__title">Cookie choices</p>' +
          '<p class="consent-banner__text">We use necessary technology to operate ' +
          'this website and remember your choices. With your permission, we also ' +
          'use analytics and load third-party features such as appointment ' +
          'scheduling. Read our <a href="' + url('cookie-policy.html') + '">Cookie Policy</a>.</p>' +
        '</div>' +
        '<div class="consent-banner__actions">' +
          '<button type="button" class="btn btn--primary btn--sm" data-consent="accept">Accept Optional</button>' +
          '<button type="button" class="btn btn--primary btn--sm" data-consent="reject">Reject Optional</button>' +
          '<button type="button" class="btn btn--ghost btn--sm" data-consent="settings">Choose Settings</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(banner);
    document.body.classList.add('has-consent-banner');
    measureBanner();
    window.addEventListener('resize', measureBanner);

    banner.addEventListener('click', function (e) {
      var action = e.target.getAttribute && e.target.getAttribute('data-consent');
      if (action === 'accept') { setAll(true); hideBanner(); }
      if (action === 'reject') { setAll(false); hideBanner(); }
      if (action === 'settings') openDialog(e.target);
    });
  }

  function hideBanner() {
    if (!banner) return;
    window.removeEventListener('resize', measureBanner);
    banner.remove();
    banner = null;
    document.body.classList.remove('has-consent-banner');
    document.documentElement.style.removeProperty('--consent-banner-height');
  }

  /* ────────────────────────────────────────────────────────────
     Preference dialog — modal, focus-trapped, Escape-closable.
     ──────────────────────────────────────────────────────────── */
  var dialog = null;
  var lastFocused = null;

  function focusable() {
    return dialog.querySelectorAll(
      'button, [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])');
  }

  function trap(e) {
    if (e.key === 'Escape') { e.preventDefault(); closeDialog(); return; }
    if (e.key !== 'Tab') return;
    var items = focusable();
    if (!items.length) return;
    var first = items[0], last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault(); last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault(); first.focus();
    }
  }

  function openDialog(opener) {
    if (dialog) return;
    lastFocused = opener || document.activeElement;

    var rows = CATEGORIES.map(function (c) {
      var on = granted(c.key) ? ' checked' : '';
      return '' +
        '<div class="consent-category">' +
          '<div class="consent-category__head">' +
            '<label class="consent-toggle" for="consent-' + c.key + '">' +
              '<input type="checkbox" id="consent-' + c.key + '" name="' + c.key + '"' + on + '>' +
              '<span class="consent-toggle__label">' + c.label + '</span>' +
              '<span class="consent-toggle__state" data-state-for="' + c.key + '">' +
                (on ? 'Allowed' : 'Not allowed') + '</span>' +
            '</label>' +
          '</div>' +
          '<p class="consent-category__desc">' + c.description + '</p>' +
        '</div>';
    }).join('');

    dialog = document.createElement('div');
    dialog.className = 'consent-dialog';
    dialog.innerHTML =
      '<div class="consent-dialog__backdrop" data-consent="close"></div>' +
      '<div class="consent-dialog__panel" role="dialog" aria-modal="true" ' +
           'aria-labelledby="consent-dialog-title" aria-describedby="consent-dialog-desc">' +
        '<h2 class="consent-dialog__title" id="consent-dialog-title" tabindex="-1">Cookie settings</h2>' +
        '<p class="consent-dialog__desc" id="consent-dialog-desc">Choose which optional ' +
          'technology this site may use. You can change this at any time from the ' +
          '“Cookie Settings” link in the footer. Read our ' +
          '<a href="' + url('privacy-policy.html#cookies') + '">Cookie Policy</a>.</p>' +
        '<div class="consent-category consent-category--locked">' +
          '<div class="consent-category__head">' +
            '<label class="consent-toggle" for="consent-necessary">' +
              '<input type="checkbox" id="consent-necessary" checked disabled>' +
              '<span class="consent-toggle__label">Necessary</span>' +
              '<span class="consent-toggle__state">Always active</span>' +
            '</label>' +
          '</div>' +
          '<p class="consent-category__desc">Required for the site to work and to ' +
            'remember the choice you make here. This is a single first-party record ' +
            'in your browser and does not identify you. It cannot be switched off.</p>' +
        '</div>' +
        rows +
        '<div class="consent-dialog__actions">' +
          '<button type="button" class="btn btn--primary btn--sm" data-consent="save">Save Choices</button>' +
          '<button type="button" class="btn btn--secondary btn--sm" data-consent="accept">Accept Optional</button>' +
          '<button type="button" class="btn btn--secondary btn--sm" data-consent="reject">Reject Optional</button>' +
        '</div>' +
        '<button type="button" class="consent-dialog__close" data-consent="close" aria-label="Close cookie settings">&times;</button>' +
      '</div>';
    document.body.appendChild(dialog);

    // Keep each toggle's state readable as text, so the setting is never
    // communicated by colour or position alone.
    dialog.addEventListener('change', function (e) {
      var box = e.target;
      if (!box.name) return;
      var out = dialog.querySelector('[data-state-for="' + box.name + '"]');
      if (out) out.textContent = box.checked ? 'Allowed' : 'Not allowed';
    });

    dialog.addEventListener('click', function (e) {
      var action = e.target.getAttribute && e.target.getAttribute('data-consent');
      if (action === 'close') { closeDialog(); return; }
      if (action === 'save') {
        var choices = {};
        CATEGORIES.forEach(function (c) {
          var box = dialog.querySelector('#consent-' + c.key);
          choices[c.key] = !!(box && box.checked);
        });
        persist(choices); closeDialog(); hideBanner();
      }
      if (action === 'accept') { setAll(true); closeDialog(); hideBanner(); }
      if (action === 'reject') { setAll(false); closeDialog(); hideBanner(); }
    });

    document.addEventListener('keydown', trap, true);
    dialog.querySelector('#consent-dialog-title').focus();
  }

  function closeDialog() {
    if (!dialog) return;
    document.removeEventListener('keydown', trap, true);
    dialog.remove();
    dialog = null;
    if (lastFocused && document.contains(lastFocused)) lastFocused.focus();
    lastFocused = null;
  }

  /* ────────────────────────────────────────────────────────────
     Wiring
     ──────────────────────────────────────────────────────────── */
  function initFooterControl() {
    var buttons = document.querySelectorAll('[data-consent-settings]');
    Array.prototype.forEach.call(buttons, function (button) {
      button.hidden = false;                  // markup ships hidden for no-JS
      button.addEventListener('click', function () { openDialog(button); });
    });
  }

  /* The placeholder that stands in for a gated embed. Its "load for this visit"
     button is a one-time exception: it shows the third party now and leaves the
     stored site-wide preference untouched, in either direction. */
  function initEmbeds() {
    Array.prototype.forEach.call(embeds(), function (host) {
      host.addEventListener('click', function (e) {
        var action = e.target.getAttribute && e.target.getAttribute('data-consent');
        if (action === 'load-once') {
          host.setAttribute('data-one-time', '');
          loadEmbed(host);
        }
        if (action === 'settings') openDialog(e.target);
      });
    });
  }

  function init() {
    initFooterControl();
    initEmbeds();
    apply();
    if (!hasDecision()) showBanner();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /* Small public surface, for the Cookie Policy page's settings button and for
     anything added later that needs to ask before acting. */
  window.CorstarConsent = {
    open: function (opener) { openDialog(opener); },
    get: function (key) { return granted(key); },
    version: CONSENT_VERSION
  };
})();
