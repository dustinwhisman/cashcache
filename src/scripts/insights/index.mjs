import { uid, isPayingUser } from '../helpers/index.mjs';

const userId = uid();
if (!userId || !isPayingUser()) {
  const insights = document.querySelector('[data-insights]');
  const paywallMessage = document.querySelector('[data-paywall-message]');

  insights.setAttribute('hidden', true);
  paywallMessage.removeAttribute('hidden');

  if (!userId) {
    const ctaLogIn = document.querySelector('[data-cta-log-in]');
    ctaLogIn.removeAttribute('hidden');
  } else {
    const ctaSubscribe = document.querySelector('[data-cta-subscribe]');
    ctaSubscribe.removeAttribute('hidden');
  }
}
