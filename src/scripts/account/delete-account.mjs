import { getAllFromObjectStore, addToDb, deleteAllCloudRecords } from '../db/index.mjs';
import { uid, token } from '../helpers/index.mjs';

firebase.auth().onAuthStateChanged((user) => {
  if (user) {
    const credential = firebase.auth.EmailAuthProvider.credentialWithLink(user.email, window.location.href);
    user.reauthenticateWithCredential(credential)
      .then(() => {
        const deleteAccountBlock = document.querySelector('[data-delete-account]');
        deleteAccountBlock.removeAttribute('hidden');
      })
      .catch(() => {
        const errorMessage = document.querySelector('[data-credentials-invalid]');
        errorMessage.removeAttribute('hidden');
      });
  }
});

const disassociateRecords = async (storeName, records) => {
  await Promise.all(records.map(async (record) => {
    try {
      await addToDb(storeName, {
        ...record,
        uid: null,
      }, true);
      return Promise.resolve();
    } catch (error) {
      console.error(error);
      return Promise.reject();
    }
  }));
};

const disassociateDataFromAccount = async (uid) => {
  const statusUpdate = document.querySelector('[data-status-update]');

  statusUpdate.innerHTML = '<p>Removing expenses associations from your account...</p>';
  const expensesRecords = await getAllFromObjectStore('expenses', uid);
  await disassociateRecords('expenses', expensesRecords);

  statusUpdate.innerHTML = '<p>Removing income associations from your account...</p>';
  const incomeRecords = await getAllFromObjectStore('income', uid);
  await disassociateRecords('income', incomeRecords);

  statusUpdate.innerHTML = '<p>Removing savings associations from your account...</p>';
  const savingsRecords = await getAllFromObjectStore('savings', uid);
  await disassociateRecords('savings', savingsRecords);

  statusUpdate.innerHTML = '<p>Removing debt associations from your account...</p>';
  const debtRecords = await getAllFromObjectStore('debt', uid);
  await disassociateRecords('debt', debtRecords);

  statusUpdate.innerHTML = '<p>Removing recurring expenses associations from your account...</p>';
  const recurringExpensesRecords = await getAllFromObjectStore('recurring-expenses', uid);
  await disassociateRecords('recurring-expenses', recurringExpensesRecords);

  statusUpdate.innerHTML = '<p>Removing recurring income associations from your account...</p>';
  const recurringIncomeRecords = await getAllFromObjectStore('recurring-income', uid);
  await disassociateRecords('recurring-income', recurringIncomeRecords);

  statusUpdate.innerHTML = `<p>Deleting all of your data from the cloud...</p>`;
  await deleteAllCloudRecords('expenses', uid);
  await deleteAllCloudRecords('income', uid);
  await deleteAllCloudRecords('savings', uid);
  await deleteAllCloudRecords('debt', uid);
  await deleteAllCloudRecords('recurring-expenses', uid);
  await deleteAllCloudRecords('recurring-income', uid);

  statusUpdate.innerHTML = `
    <p>
      All done. Your account has been deleted.
    </p>
  `;
  window.location.href = '/';
};

document.addEventListener('submit', async (event) => {
  event.preventDefault();

  if (event.target.matches('[data-delete-account-form]')) {
    try {
      const request = await fetch('/api/delete-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token()}`,
        },
      });
      const result = await request.json();
    } catch (error) {
      console.error(error);
    }

    const user = firebase.auth().currentUser;
    if (user) {
      user.delete()
        .then(async () => {
          await disassociateDataFromAccount(uid());
        })
        .catch(console.error);
    } else {
      console.error('There was no logged in user with which to delete their account.');
    }
  }
});
