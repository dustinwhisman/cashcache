import { getAllFromObjectStore, getAllFromCloud, addToDb, bulkAddToDb } from '../db/index.mjs';

const checkIsPayingUser = async (idToken) => {
  if (!idToken) {
    return false;
  }

  try {
    const response = await fetch('/api/get-is-paying-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`,
      },
    });

    const data = await response.json();
    return !!data?.isPayingUser;
  } catch (error) {
    console.error(error);
    return false;
  }
};

const createCheckoutSession = (priceId) => {
  return fetch('/api/create-checkout-session', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ priceId }),
  })
    .then((result) => {
      return result.json();
    })
    .catch(console.error);
};

const associateRecords = async (storeName, records) => {
  const recordsToUpdate = records.map((record) => ({
    ...record,
    uid: appUser?.uid,
  }));

  await Promise.all(recordsToUpdate.map(async (record) => {
    try {
      await addToDb(storeName, record, true);
      return Promise.resolve();
    } catch (error) {
      console.error(error);
      return Promise.reject();
    }
  }));

  await bulkAddToDb(storeName, recordsToUpdate);
};

const associateDataToAccount = async (idToken) => {
  const statusUpdate = document.querySelector('[data-status-update]');

  statusUpdate.innerHTML += '<p>Associating existing expenses to your account...</p>';
  const expensesRecords = await getAllFromObjectStore('expenses');
  await associateRecords('expenses', expensesRecords);

  statusUpdate.innerHTML += '<p>Associating existing income to your account...</p>';
  const incomeRecords = await getAllFromObjectStore('income');
  await associateRecords('income', incomeRecords);

  statusUpdate.innerHTML += '<p>Associating existing savings to your account...</p>';
  const savingsRecords = await getAllFromObjectStore('savings');
  await associateRecords('savings', savingsRecords);

  statusUpdate.innerHTML += '<p>Associating existing debt to your account...</p>';
  const debtRecords = await getAllFromObjectStore('debt');
  await associateRecords('debt', debtRecords);

  statusUpdate.innerHTML += '<p>Associating existing recurring expenses to your account...</p>';
  const recurringExpensesRecords = await getAllFromObjectStore('recurring-expenses');
  await associateRecords('recurring-expenses', recurringExpensesRecords);

  statusUpdate.innerHTML += '<p>Associating existing recurring income to your account...</p>';
  const recurringIncomeRecords = await getAllFromObjectStore('recurring-income');
  await associateRecords('recurring-income', recurringIncomeRecords);

  if (await checkIsPayingUser(idToken)) {
    statusUpdate.innerHTML += '<p>Caching data to make things extra fast...</p>';

    Promise.all([
      getAllFromCloud('expenses'),
      getAllFromCloud('income'),
      getAllFromCloud('savings'),
      getAllFromCloud('debt'),
      getAllFromCloud('recurring-expenses'),
      getAllFromCloud('recurring-income'),
    ])
      .catch(console.error)
      .then(() => {
        statusUpdate.innerHTML += `
          <p>
            All done! Redirecting you to the <a href="/overview">overview page</a>
            now.
          </p>
        `;
        window.location.href = '/overview';
      });
  } else {
    saveCustomerId(idToken);
    statusUpdate.setAttribute('hidden', true);
    const subscriptionBlock = document.querySelector('[data-subscription]');
    subscriptionBlock.removeAttribute('hidden');
  }
};

const saveCustomerId = (idToken) => {
  if (idToken) {
    fetch('/api/save-customer-id', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`,
      },
      body: JSON.stringify({
        customerId: null,
      }),
    })
      .then(response => response.json())
      .then(() => {
        console.log('Customer ID saved');
      })
      .catch((error) => {
        console.error(error);
      });
  }
};

(async () => {
  if (firebase.auth().isSignInWithEmailLink(window.location.href)) {
    const email = localStorage.getItem('emailForSignIn');
    if (!email) {
      const differentDeviceBlock = document.querySelector('[data-different-device]');
      differentDeviceBlock.removeAttribute('hidden');
      return;
    }

    firebase.auth().signInWithEmailLink(email, window.location.href)
      .then(async (result) => {
        localStorage.removeItem('emailForSignIn');
        result.user.getIdToken(true).then(async (idToken) => {
          await associateDataToAccount(idToken);
        });
      })
      .catch((error) => {
        const errorMessage = document.querySelector('[data-login-error]');
        errorMessage.removeAttribute('hidden');
      });
  }
})();

document.addEventListener('submit', (event) => {
  event.preventDefault();

  if (event.target.matches('[data-confirm-email-form]')) {
    if (firebase.auth().isSignInWithEmailLink(window.location.href)) {
      const email = event.target.elements.email.value;

      firebase.auth().signInWithEmailLink(email, window.location.href)
        .then(async (result) => {
          result.user.getIdToken(true)
            .then(async (idToken) => {
              await associateDataToAccount(idToken);
            });
        })
        .catch((error) => {
          const errorMessage = document.querySelector('[data-login-error]');
          errorMessage.removeAttribute('hidden');
        });
    }
  }

  if (event.target.matches('[data-subscription-form]')) {
    const priceId = event.target.elements['price-id'].value;
    createCheckoutSession(priceId)
      .then((data) => {
        stripe.redirectToCheckout({
          sessionId: data.sessionId,
        });
      })
      .catch(console.error);
  }
});
