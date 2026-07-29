/* main.js — nav toggle, lazy-load, skip link */
(function () {
  'use strict';

  function initSiteMenus() {
    const services = [
      ['AI Management', 'ai-security.html'], ['Cloud & Network Solutions', 'cloud-solutions.html'],
      ['Cybersecurity + Compliance', 'cybersecurity.html'], ['IT Support Services', 'it-support.html'],
      ['Small Business', 'it-solutions-small-business.html'], ['Structured Cabling', 'structured-cabling.html']
    ];
    const industries = [
      ['Architecture + Construction', 'construction-firms.html'], ['Financial Services', 'financial-services.html'],
      ['Healthcare', 'healthcare.html'], ['Insurance + Real Estate', 'insurance.html'],
      ['Legal Services', 'legal.html'], ['Professional Services', 'professional-services.html']
    ];
    const footerServices = [
      ['AI Management', 'ai-security.html'], ['Backup and Data Recovery', 'backup-data-recovery.html'],
      ['Business Continuity', 'business-continuity.html'], ['Cloud Migration', 'cloud-migration.html'],
      ['Cloud Solutions', 'cloud-solutions.html'], ['Compliance', 'compliance.html'],
      ['Cybersecurity', 'cybersecurity.html'], ['Data Compliance', 'data-compliance.html'],
      ['IT Support', 'it-support.html'], ['Managed IT Services', 'managed-it-services.html'],
      ['Managed Security', 'managed-security.html'], ['Microsoft 365 Support', 'microsoft-365-support.html'],
      ['Network Security', 'network-security.html'], ['Penetration & Vulnerability Testing', 'penetration-vulnerability-testing.html'],
      ['Small Business IT', 'it-solutions-small-business.html'], ['Structured Cabling', 'structured-cabling.html']
    ];
    const footerIndustries = [
      ['Architecture + Construction', 'construction-firms.html'], ['Family Offices', 'family-offices.html'],
      ['Financial Services', 'financial-services.html'], ['Healthcare', 'healthcare.html'],
      ['Insurance', 'insurance.html'], ['Legal', 'legal.html'], ['Owner Operator Businesses', 'owner-operator-businesses.html'],
      ['Professional Services', 'professional-services.html'], ['Real Estate', 'real-estate.html']
    ];
    const base = /\/(services|industries|resources)\//.test(window.location.pathname) ? '../' : '';
    const footerResources = [
      ['What Is an IT MSP?', `${base}resources/what-is-it-msp.html`], ['IT FAQ', `${base}faq.html`],
      ['About Us', `${base}about.html`], ['Contact', `${base}contact.html`]
    ];
    const links = (items, section) => `<li><a class="nav__dropdown-lead" href="${base}${section}/index.html">All ${section[0].toUpperCase() + section.slice(1)}</a></li>` + items.map(([label, file]) => `<li><a href="${base}${section}/${file}">${label}</a></li>`).join('');
    document.querySelectorAll('.nav__dropdown-toggle').forEach((toggle) => {
      const name = toggle.textContent.trim().toLowerCase();
      if (name.startsWith('services')) toggle.nextElementSibling.innerHTML = links(services, 'services');
      if (name.startsWith('industries')) toggle.nextElementSibling.innerHTML = links(industries, 'industries');
    });
    const menu = document.querySelector('.nav__links');
    if (menu) {
      const order = ['about', 'industries', 'services', 'resources', 'contact'];
      [...menu.querySelectorAll(':scope > .nav__item')]
        .sort((a, b) => {
          const label = (item) => ((item.querySelector('.nav__dropdown-toggle') || item.querySelector(':scope > a'))?.textContent.trim().split(/\s+/)[0] || '').toLowerCase();
          return order.indexOf(label(a)) - order.indexOf(label(b));
        })
        .forEach((item) => menu.appendChild(item));
    }
    document.querySelectorAll('.nav__cta .btn, .nav__cta-mobile .btn').forEach((button) => {
      button.textContent = 'REMOTE SUPPORT';
      button.href = `${base}remote-support.html`;
    });
    const grid = document.querySelector('.footer__grid');
    if (grid) {
      const brand = grid.querySelector('.footer__brand');
      const cols = [...grid.querySelectorAll('.footer__col')];
      const contact = cols.find((col) => col.querySelector('.footer__title')?.textContent.trim() === 'Contact');
      const servicesCol = cols.find((col) => col.querySelector('.footer__title')?.textContent.trim() === 'Services');
      const industriesCol = cols.find((col) => col.querySelector('.footer__title')?.textContent.trim() === 'Industries');
      [brand, contact, servicesCol, industriesCol].filter(Boolean).forEach((item) => grid.appendChild(item));
      const setList = (column, items, section) => {
        if (!column) return null;
        const list = column.querySelector('ul') || column.appendChild(document.createElement('ul'));
        const prefix = section ? `${base}${section}/` : '';
        list.innerHTML = items.map(([label, href]) => `<li><a href="${prefix}${href}">${label}</a></li>`).join('');
        return list;
      };
      setList(servicesCol, [['All Services', 'index.html'], ...footerServices], 'services');
      setList(industriesCol, [['All Industries', 'index.html'], ...footerIndustries], 'industries');
      const resourceLists = industriesCol ? industriesCol.querySelectorAll('ul') : [];
      const resourcesList = resourceLists[1] || (industriesCol ? industriesCol.appendChild(document.createElement('ul')) : null);
      if (resourcesList) {
        resourcesList.innerHTML = footerResources.map(([label, href]) => `<li><a href="${href}">${label}</a></li>`).join('');
      }
      grid.querySelectorAll('.footer__remote-support-link').forEach((link) => link.closest('li')?.remove());
      const remoteCol = industriesCol || servicesCol || contact;
      if (remoteCol) {
        const remoteItem = document.createElement('li');
        const remoteLink = document.createElement('a');
        remoteLink.className = 'btn btn--ghost btn--sm footer__remote-support-link';
        remoteLink.href = /\/(services|industries|resources)\//.test(window.location.pathname) ? '../remote-support.html' : 'remote-support.html';
        remoteLink.textContent = 'Remote Support';
        remoteItem.appendChild(remoteLink);
        const list = remoteCol.querySelector('ul:last-of-type') || remoteCol.appendChild(document.createElement('ul'));
        list.appendChild(remoteItem);
      }
      const bottom = document.querySelector('.footer__bottom');
      if (bottom) {
        const paragraphs = bottom.querySelectorAll('p');
        if (paragraphs[0]) paragraphs[0].textContent = '© 2026 Corstar Communications. All rights reserved.';
        if (paragraphs[1]) paragraphs[1].textContent = 'Website made in part by Logistics Consulting Services';
      }
    }
  }

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
    initSiteMenus();
    initNav();
    initLazyLoad();
    initCounters();
  });
})();
