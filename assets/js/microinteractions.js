/* microinteractions.js — button feedback, accordion, form validation */
(function () {
  'use strict';

  /* ── Accordion ── */
  function initAccordion() {
    const triggers = document.querySelectorAll('.accordion__trigger');
    triggers.forEach((trigger) => {
      trigger.addEventListener('click', () => {
        const panel   = trigger.nextElementSibling;
        const isOpen  = trigger.getAttribute('aria-expanded') === 'true';
        const icon    = trigger.querySelector('.accordion__icon');

        // Close all siblings
        const accordion = trigger.closest('.accordion');
        if (accordion) {
          accordion.querySelectorAll('.accordion__trigger').forEach((t) => {
            if (t !== trigger) {
              t.setAttribute('aria-expanded', 'false');
              const p = t.nextElementSibling;
              if (p) p.classList.remove('is-open');
            }
          });
        }

        if (isOpen) {
          trigger.setAttribute('aria-expanded', 'false');
          panel.classList.remove('is-open');
        } else {
          trigger.setAttribute('aria-expanded', 'true');
          panel.classList.add('is-open');
        }
      });
    });
  }

  /* ── Contact form validation ── */
  function initFormValidation() {
    const form = document.querySelector('.contact-form');
    if (!form) return;

    const fields = form.querySelectorAll('[required]');
    const submitButton = form.querySelector('button[type="submit"]');
    const status = form.querySelector('.form__status');

    fields.forEach((field) => {
      field.addEventListener('blur', () => validateField(field));
      field.addEventListener('input', () => {
        if (field.parentElement.classList.contains('has-error')) {
          validateField(field);
        }
      });
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      let valid = true;
      fields.forEach((field) => {
        if (!validateField(field)) valid = false;
      });
      if (!valid) {
        fields[0].focus();
        return;
      }

      setFormStatus(status, 'Sending your message…');
      if (submitButton) submitButton.disabled = true;

      try {
        const response = await fetch(form.action, {
          method: 'POST',
          body: new FormData(form),
          headers: { Accept: 'application/json' }
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok || result.success === false) {
          throw new Error(result.message || 'The form could not be submitted.');
        }

        form.reset();
        clearValidationState(fields);
        setFormStatus(status, 'Thanks — your message has been sent. We’ll follow up within one business day.', 'success');
      } catch (error) {
        setFormStatus(status, 'We could not send your message. Please try again or call us at (914) 347-2700.', 'error');
      } finally {
        if (submitButton) submitButton.disabled = false;
      }
    });
  }

  function clearValidationState(fields) {
    fields.forEach((field) => {
      const group = field.closest('.form__group');
      const error = group && group.querySelector('.form__error');
      if (group) group.classList.remove('has-error');
      field.removeAttribute('aria-invalid');
      if (error) error.textContent = '';
    });
  }

  function setFormStatus(status, message, type) {
    if (!status) return;
    status.hidden = !message;
    status.textContent = message;
    status.classList.toggle('is-success', type === 'success');
    status.classList.toggle('is-error', type === 'error');
  }

  function validateField(field) {
    const group = field.closest('.form__group');
    const error = group && group.querySelector('.form__error');
    let ok = field.value.trim() !== '';

    if (ok && field.type === 'email') {
      ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value.trim());
    }

    if (group) {
      group.classList.toggle('has-error', !ok);
      field.setAttribute('aria-invalid', String(!ok));
      if (error) {
        error.textContent = ok ? '' : (field.dataset.errorMsg || 'This field is required.');
      }
    }
    return ok;
  }

  document.addEventListener('DOMContentLoaded', () => {
    initAccordion();
    initFormValidation();
  });
})();
