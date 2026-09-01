import emailjs from '@emailjs/browser';

const EMAILJS_SERVICE_ID = 'service_pr29eyp';
const EMAILJS_TEMPLATE_ID = 'template_kj7tsl5';
const EMAILJS_PUBLIC_KEY = 'lsoKTqwO_n1zjzxdp';

const ERROR_MESSAGE =
  'Something went wrong sending this. Please call us at 080 4132 7770 or email hr@pristiness.in directly.';

export function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  const button = form.querySelector('[type="submit"]');
  const labelEl = button.querySelector('.btn__label');
  const spinnerEl = button.querySelector('.btn__spinner');
  const errorEl = document.getElementById('contact-error');
  const successEl = document.getElementById('contact-success');

  const setSending = (sending) => {
    button.disabled = sending;
    if (labelEl) labelEl.textContent = sending ? 'Sending...' : 'Send message';
    if (spinnerEl) spinnerEl.hidden = !sending;
  };

  const hideAfter = (el, ms) => {
    if (!el) return;
    window.clearTimeout(el._timer);
    el._timer = window.setTimeout(() => {
      el.classList.remove('is-visible');
      setTimeout(() => {
        el.hidden = true;
      }, 300);
    }, ms);
  };

  if (errorEl) {
    errorEl.hidden = true;
    errorEl.classList.add('notice');
  }
  if (successEl) {
    successEl.hidden = true;
    successEl.classList.add('notice');
  }

  emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    if (errorEl) {
      errorEl.hidden = true;
      errorEl.classList.remove('is-visible');
    }
    if (successEl) {
      window.clearTimeout(successEl._timer);
      successEl.hidden = true;
      successEl.classList.remove('is-visible');
    }

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    setSending(true);

    emailjs
      .sendForm(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, form)
      .then(() => {
        form.reset();
        setSending(false);

        if (successEl) {
          successEl.hidden = false;
          requestAnimationFrame(() => successEl.classList.add('is-visible'));
        }
        hideAfter(successEl, 4500);
      })
      .catch(() => {
        setSending(false);

        if (errorEl) {
          errorEl.textContent = ERROR_MESSAGE;
          errorEl.hidden = false;
          requestAnimationFrame(() => errorEl.classList.add('is-visible'));
        }
      });
  });
}