import { getCustomerId, uid } from './index.mjs';

(() => {
  const loginLink = document.querySelector('[data-login-link]');
  const accountLink = document.querySelector('[data-account-link]');

  if (uid() != null) {
    loginLink.setAttribute('hidden', true);
    accountLink.removeAttribute('hidden');
  } else {
    loginLink.removeAttribute('hidden');
    accountLink.setAttribute('hidden', true);
  }

  firebase.auth().onAuthStateChanged((user) => {
    if (user) {
      user.getIdToken(true).then((idToken) => {
        localStorage.setItem('uid', user.uid);
        localStorage.setItem('token', idToken);
        getCustomerId(idToken);
        const tokenConfirmedEvent = new CustomEvent('token-confirmed');
        document.dispatchEvent(tokenConfirmedEvent);
      });
      loginLink.setAttribute('hidden', true);
      accountLink.removeAttribute('hidden');
      const loggedInEvent = new CustomEvent('user-logged-in', { detail: user });
      document.dispatchEvent(loggedInEvent);
    } else {
      loginLink.removeAttribute('hidden');
      accountLink.setAttribute('hidden', true);
      const notLoggedInEvent = new CustomEvent('not-logged-in');
      document.dispatchEvent(notLoggedInEvent);
      localStorage.removeItem('uid');
      localStorage.removeItem('token');
      localStorage.removeItem('isPayingUser');
    }
  });

  document.addEventListener('click', (event) => {
    if (event.target.matches('[data-copy-link-button]')) {
      const textarea = document.createElement('textarea');
      textarea.textContent = 'help@cashcache.io';
      textarea.style.position = 'fixed';
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
        event.target.innerHTML = 'Copied';
      } catch (error) {
        console.error(error);
      } finally {
        document.body.removeChild(textarea);
      }
    }
  });
})();
