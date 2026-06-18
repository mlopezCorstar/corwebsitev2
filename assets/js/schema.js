/* schema.js — inject JSON-LD structured data */
(function () {
  'use strict';

  const isSubdirectory = window.location.pathname.startsWith('/corwebsitev2');
  const baseFolder = isSubdirectory ? '/corwebsitev2' : '';
  const siteUrl = window.location.origin + baseFolder;

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

  /* ── Dispatch based on data attributes on <body> ── */
  document.addEventListener('DOMContentLoaded', () => {
    const body = document.body;
    const page = body.dataset.page || 'default';

    // Always inject LocalBusiness
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

    // FAQ schema built from DOM
    const accordion = document.querySelector('.accordion[data-schema="faq"]');
    if (accordion) {
      const items = [];
      accordion.querySelectorAll('.accordion__item').forEach((item) => {
        const q = item.querySelector('.accordion__trigger')?.textContent.trim();
        const a = item.querySelector('.accordion__panel')?.textContent.trim();
        if (q && a) items.push({ q, a });
      });
      if (items.length) inject(faqSchema(items));
    }
  });
})();
