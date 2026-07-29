/* schema.js — inject JSON-LD structured data */
(function () {
  'use strict';

  const siteUrl = window.location.origin;

  const NAP = {
    name:      'Corstar Communications',
    street:    '22 Saw Mill River Road, Suite 303',
    city:      'Hawthorne',
    region:    'NY',
    zip:       '10532',
    country:   'US',
    phone:     '+19143472700',
    url:       siteUrl,
    founded:   '1970',
    areaServed:'Westchester County, NY',
    email:     'info@corstar.com'
  };

  function inject(obj) {
    const s = document.createElement('script');
    s.type = 'application/ld+json';
    s.textContent = JSON.stringify(obj, null, 2);
    document.head.appendChild(s);
  }

  const localBusiness = {
    '@context': 'https://schema.org',
    '@type': ['LocalBusiness', 'ProfessionalService'],
    name:        NAP.name,
    url:         NAP.url,
    logo:        NAP.url + '/assets/images/corstar%20logo%20transparent.png',
    image:       NAP.url + '/assets/images/corstar%20logo%20transparent.png',
    telephone:   NAP.phone,
    email:       NAP.email,
    foundingDate:NAP.founded,
    priceRange:  '$$',
    areaServed:  NAP.areaServed,
    address: {
      '@type':           'PostalAddress',
      streetAddress:     NAP.street,
      addressLocality:   NAP.city,
      addressRegion:     NAP.region,
      postalCode:        NAP.zip,
      addressCountry:    NAP.country
    },
    description: 'Corstar Communications is a Westchester, NY IT Managed Service Provider (MSP) delivering network security, cloud solutions, structured cabling, and IT support since 1970.',
    sameAs: []
  };

  function serviceSchema(name, description, url) {
    return {
      '@context': 'https://schema.org',
      '@type': 'Service',
      serviceType: name,
      name: name,
      description: description,
      url: url,
      provider: { '@type': 'LocalBusiness', name: NAP.name, url: NAP.url },
      areaServed: NAP.areaServed
    };
  }

  function faqSchema(items) {
    return {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: items.map(({ q, a }) => ({
        '@type': 'Question',
        name: q,
        acceptedAnswer: { '@type': 'Answer', text: a }
      }))
    };
  }

  function websiteSchema() {
    return {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: NAP.name,
      url: NAP.url,
      potentialAction: {
        '@type': 'SearchAction',
        target: NAP.url + '/?s={search_term_string}',
        'query-input': 'required name=search_term_string'
      }
    };
  }

  function organizationSchema() {
    return {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: NAP.name,
      url: NAP.url,
      foundingDate: NAP.founded,
      description: localBusiness.description
    };
  }

  /* Pages now ship a static JSON-LD @graph in <head> — see gen_schema.py's
     output — which covers Organization, LocalBusiness, WebSite, WebPage,
     BreadcrumbList and Service. Injecting those again from here would hand
     crawlers two copies of the same entities, so this only fills the gap on a
     page that has no static graph. */
  function hasStaticGraph() {
    return [...document.querySelectorAll('script[type="application/ld+json"]')]
      .some((s) => s.textContent.includes('"@graph"'));
  }

  /* ── Dispatch based on data attributes on <body> ── */
  document.addEventListener('DOMContentLoaded', () => {
    const body = document.body;
    const page = body.dataset.page || 'default';

    if (!hasStaticGraph()) {
      inject(localBusiness);

      if (page === 'home') {
        inject(organizationSchema());
        inject(websiteSchema());
      }

      if (page === 'service') {
        const name = body.dataset.serviceName || '';
        const desc = body.dataset.serviceDesc || '';
        const url  = window.location.href;
        if (name) inject(serviceSchema(name, desc, url));
      }
    }

    /* FAQ schema built from the DOM. Pages group their questions into several
       accordions (faq.html runs one per category), so every marked accordion
       contributes to a single FAQPage — reading only the first would publish a
       fraction of the page's questions. */
    const accordions = document.querySelectorAll('.accordion[data-schema="faq"]');
    if (accordions.length) {
      const items = [];
      accordions.forEach((accordion) => {
        accordion.querySelectorAll('.accordion__item').forEach((item) => {
          const trigger = item.querySelector('.accordion__trigger');
          const panel   = item.querySelector('.accordion__panel');
          if (!trigger || !panel) return;
          // The trigger carries a decorative +/- glyph that is not part of the
          // question, so read the trigger's text without its icon element.
          const q = [...trigger.childNodes]
            .filter((n) => !(n.nodeType === 1 && n.classList.contains('accordion__icon')))
            .map((n) => n.textContent)
            .join(' ')
            .replace(/\s+/g, ' ')
            .trim();
          const a = panel.textContent.replace(/\s+/g, ' ').trim();
          if (q && a) items.push({ q, a });
        });
      });
      if (items.length) inject(faqSchema(items));
    }
  });
})();
