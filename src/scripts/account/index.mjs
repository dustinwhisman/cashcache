import { token } from '../helpers/index.mjs';

const createCheckoutSession = (priceId) => {
  return fetch('/api/create-checkout-session', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token()}`,
    },
    body: JSON.stringify({ priceId }),
  })
    .then((result) => {
      return result.json();
    })
    .catch(console.error);
};

document.addEventListener('user-logged-in', ({ detail }) => {
  const signedInAs = document.querySelector('[data-signed-in-as]');
  signedInAs.innerHTML = `
    <p>
      Signed in as ${detail.email}.
    </p>
  `;

  const isSignedInBlock = document.querySelector('[data-is-signed-in]');
  const notSignedInBlock = document.querySelector('[data-not-signed-in]');
  isSignedInBlock.removeAttribute('hidden');
  notSignedInBlock.setAttribute('hidden', true);
});

document.addEventListener('is-paying-customer', ({ detail }) => {
  const subscriptionDetails = document.querySelector('[data-subscription-details]');
  const customerIdInput = document.querySelector('[name="customer-id"]');
  customerIdInput.value = detail;
  subscriptionDetails.removeAttribute('hidden');
});

document.addEventListener('not-paying-customer', () => {
  const subscriptionForm = document.querySelector('[data-not-subscribed]');
  subscriptionForm.removeAttribute('hidden');
});

document.addEventListener('click', async (event) => {
  if (event.target.matches('[data-log-out]')) {
    firebase.auth().signOut()
      .then(() => {
        localStorage.removeItem('user');
        localStorage.removeItem('customerId');
        window.location.href = '/';
      })
      .catch(console.error);
  }

  if (event.target.matches('[data-change-email-button]')) {
    const user = firebase.auth().currentUser;
    if (user) {
      firebase.auth().sendSignInLinkToEmail(user.email, {
        url: `${window.location.origin}/account/change-email-address`,
        handleCodeInApp: true,
      })
        .then(() => {
          event.target.innerHTML = 'Email Sent';
        })
        .catch(console.error);
    } else {
      console.error('There was no logged in user with which to change their email.');
    }
  }

  if (event.target.matches('[data-delete-account-button]')) {
    const user = firebase.auth().currentUser;
    firebase.auth().sendSignInLinkToEmail(user.email, {
      url: `${window.location.origin}/account/delete-account`,
      handleCodeInApp: true,
    })
      .then(() => {
        event.target.innerHTML = 'Email Sent';
      })
      .catch(console.error);
  }
});

document.addEventListener('submit', async (event) => {
  event.preventDefault();

  if (event.target.matches('[data-subscription-form]')) {
    const priceId = event.target.elements['price-id'].value;
    createCheckoutSession(priceId).then((data) => {
      stripe.redirectToCheckout({
        sessionId: data.sessionId,
      });
    })
      .catch(console.error);
  }

  if (event.target.matches('[data-manage-subscription-form]')) {
    fetch('/api/customer-portal', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token()}`,
      },
      body: JSON.stringify({
        customerId: event.target.elements['customer-id'].value,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        window.location.href = data.url;
      })
      .catch(console.error);
  }
});
