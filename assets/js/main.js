/* main.js — nav toggle, lazy-load, skip link */
(function () {
  'use strict';

  /* ── Mobile nav ── */
  function initNav() {
    const toggle = document.querySelector('.nav__toggle');
    const nav    = document.querySelector('.nav');
    if (!toggle || !nav) return;

    toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('nav--open');
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!nav.contains(e.target) && nav.classList.contains('nav--open')) {
        nav.classList.remove('nav--open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });

    // Close on Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && nav.classList.contains('nav--open')) {
        nav.classList.remove('nav--open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.focus();
      }
    });

    // Dropdown menus (click + keyboard accessible; hover is handled in CSS)
    const dropdownToggles = nav.querySelectorAll('.nav__dropdown-toggle');
    function closeDropdowns(except) {
      dropdownToggles.forEach((t) => {
        if (t === except) return;
        t.setAttribute('aria-expanded', 'false');
        const panel = t.nextElementSibling;
        if (panel) panel.classList.remove('is-open');
      });
    }
    dropdownToggles.forEach((toggleBtn) => {
      const panel = toggleBtn.nextElementSibling;
      toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const open = toggleBtn.getAttribute('aria-expanded') === 'true';
        closeDropdowns(toggleBtn);
        toggleBtn.setAttribute('aria-expanded', String(!open));
        if (panel) panel.classList.toggle('is-open', !open);
      });
    });
    // Close dropdowns on outside click or Escape
    document.addEventListener('click', (e) => {
      if (!nav.contains(e.target)) closeDropdowns(null);
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeDropdowns(null);
    });

    // Mark active page link (leaf links + their parent dropdown trigger)
    const here = window.location.pathname.replace(/index\.html$/, '').replace(/\/$/, '');
    const links = nav.querySelectorAll('.nav__links a');
    links.forEach((link) => {
      const href = link.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('tel:')) return;
      const linkPath = new URL(link.href).pathname.replace(/index\.html$/, '').replace(/\/$/, '');
      if (linkPath && linkPath === here) {
        link.setAttribute('aria-current', 'page');
        // Reflect active state on the parent dropdown trigger, if any
        const parentItem = link.closest('.nav__item--has-dropdown');
        if (parentItem) {
          const trigger = parentItem.querySelector('.nav__dropdown-toggle');
          if (trigger) trigger.setAttribute('aria-current', 'true');
        }
      }
    });
  }

  /* ── Lazy-load images ── */
  function initLazyLoad() {
    const imgs = document.querySelectorAll('img[data-src]');
    if (!imgs.length) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          if (img.dataset.srcset) img.srcset = img.dataset.srcset;
          img.removeAttribute('data-src');
          io.unobserve(img);
        }
      });
    }, { rootMargin: '200px' });
    imgs.forEach((img) => io.observe(img));
  }

  /* ── Stats counter ── */
  function initCounters() {
    const stats = document.querySelectorAll('.trust-stat__number[data-target]');
    if (!stats.length) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el     = entry.target;
        const target = parseInt(el.dataset.target, 10);
        const suffix = el.dataset.suffix || '';
        const dur    = 1200;
        const start  = performance.now();
        function step(now) {
          const elapsed = Math.min((now - start) / dur, 1);
          const ease    = 1 - Math.pow(1 - elapsed, 3);
          el.textContent = Math.round(ease * target) + suffix;
          if (elapsed < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
        io.unobserve(el);
      });
    }, { threshold: 0.3 });
    stats.forEach((el) => io.observe(el));
  }

  document.addEventListener('DOMContentLoaded', () => {
    initNav();
    initLazyLoad();
    initCounters();
  });
})();
