let isPayingUser = !!localStorage.getItem('isPayingUser');
const getCustomerId = (uid, token) => {
  fetch('/api/get-is-paying-user', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  })
    .then((response) => response.json())
    .then((data) => {
      if (data?.isPayingUser) {
        isPayingUser = true;
        localStorage.setItem('isPayingUser', 'true');
        const isPayingCustomerEvent = new CustomEvent('is-paying-customer', { detail: data?.customerId });
        document.dispatchEvent(isPayingCustomerEvent);
      } else {
        isPayingUser = false;
        localStorage.removeItem('isPayingUser');
        const notPayingCustomerEvent = new CustomEvent('not-paying-customer');
        document.dispatchEvent(notPayingCustomerEvent);
      }
    })
    .catch(console.error);
};

const loginLink = document.querySelector('[data-login-link]');
const accountLink = document.querySelector('[data-account-link]');
let appUser;
let appUserData = localStorage.getItem('user');
let token = localStorage.getItem('token');
if (appUserData) {
  appUser = JSON.parse(appUserData);
  loginLink.setAttribute('hidden', true);
  accountLink.removeAttribute('hidden');
} else {
  loginLink.removeAttribute('hidden');
  accountLink.setAttribute('hidden', true);
}

firebase.auth().onAuthStateChanged((user) => {
  if (user) {
    user.getIdToken(true).then((idToken) => {
      token = idToken;
      localStorage.setItem('token', token);
      getCustomerId(user.uid, token);
      const tokenConfirmedEvent = new CustomEvent('token-confirmed');
      document.dispatchEvent(tokenConfirmedEvent);
    });
    appUser = user;
    loginLink.setAttribute('hidden', true);
    accountLink.removeAttribute('hidden');
    const loggedInEvent = new CustomEvent('user-logged-in', { detail: user });
    document.dispatchEvent(loggedInEvent);
    localStorage.setItem('user', JSON.stringify(user));
  } else {
    loginLink.removeAttribute('hidden');
    accountLink.setAttribute('hidden', true);
    const notLoggedInEvent = new CustomEvent('not-logged-in');
    document.dispatchEvent(notLoggedInEvent);
    localStorage.removeItem('user');
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
