import { getFromDb, getFromCloudDb, addToDb, deleteFromDb } from '../db/index.mjs';
import { formatCurrency, sanitize, initializeYearMonthInputs, uid, isPayingUser } from '../helpers/index.mjs';

initializeYearMonthInputs(new URLSearchParams(window.location.search));

let key;
let networkDataLoaded = false;
let cachedDataLoaded = false;
document.addEventListener('submit', async (event) => {
  event.preventDefault();

  const { elements } = event.target;
  const debt = {
    uid: uid(),
    key: elements['key'].value || null,
    year: Number(elements['year'].value),
    month: Number(elements['month'].value) - 1,
    description: elements['debt-description'].value,
    amount: sanitize(elements['amount'].value),
    minimumPayment: sanitize(elements['minimum-payment'].value),
    interestRate: sanitize(elements['interest-rate'].value),
  };

  const statusElement = document.querySelector('[data-submit-status]');
  const button = event.target.querySelector('button[type=submit]');
  const savingMessage = button.dataset.labelSaving;
  const savedMessage = button.dataset.labelSaved;
  const failedMessage = button.dataset.labelFailed;

  try {
    button.innerHTML = savingMessage;
    statusElement.innerHTML = savingMessage;

    await addToDb('debt', debt);

    button.innerHTML = savedMessage;
    statusElement.innerHTML = savedMessage;

    const month = Number(elements['month'].value) - 1;
    const year = Number(elements['year'].value);
    window.location.href = `/overview?m=${month}&y=${year}`;
  } catch (error) {
    button.innerHTML = failedMessage;
    statusElement.innerHTML = failedMessage;
    console.error(error);
  }
});

const populateForm = (debt) => {
  const form = document.querySelector('form');
  const { elements } = form;
  elements['key'].value = debt.key;

  if (elements['year'] !== document.activeElement) {
    elements['year'].value = `${debt.year}`;
  }

  if (elements['month'] !== document.activeElement) {
    elements['month'].value = `${debt.month + 1}`;
  }

  if (elements['debt-description'] !== document.activeElement) {
    elements['debt-description'].value = `${debt.description}`;
  }

  if (elements['amount'] !== document.activeElement) {
    elements['amount'].value = `${formatCurrency(debt.amount)}`;
  }

  if (elements['minimum-payment'] !== document.activeElement) {
    elements['minimum-payment'].value = `${formatCurrency(debt.minimumPayment)}`;
  }

  if (elements['interest-rate'] !== document.activeElement) {
    elements['interest-rate'].value = `${debt.interestRate}%`;
  }
};

(async () => {
  const params = new URLSearchParams(window.location.search);

  if (params?.has('key')) {
    key = params.get('key');
  }

  const deleteButton = document.querySelector('[data-delete]');
  deleteButton.dataset.key = key;

  try {
    const debt = await getFromDb('debt', key, uid());
    cachedDataLoaded = true;

    if (!networkDataLoaded) {
      populateForm(debt);
    }
  } catch (error) {
    console.error(error);
    const typicalState = document.querySelector('[data-typical-state]');
    const accessDenied = document.querySelector('[data-access-denied]');
    if (uid()) {
      const belongsToNobody = document.querySelector('[data-belongs-to-nobody]');
      belongsToNobody.removeAttribute('hidden');
    } else {
      const belongsToUser = document.querySelector('[data-belongs-to-user]');
      belongsToUser.removeAttribute('hidden');
    }

    typicalState.setAttribute('hidden', true);
    accessDenied.removeAttribute('hidden');
  }
})();

document.addEventListener('click', async (event) => {
  if (event.target.matches('[data-delete]')) {
    if (window.confirm('Are you sure you want to delete this debt?')) {
      try {
        await deleteFromDb('debt', event.target.dataset.key, uid());
        if (document.referrer) {
          window.location.href = document.referrer;
        } else {
          window.location.href = `/overview`;
        }
      } catch (error) {
        window.alert(error.message);
      }
    }
  }
});

document.addEventListener('token-confirmed', async () => {
  const userId = uid();
  if (userId && isPayingUser()) {
    const debt = await getFromCloudDb('debt', key, userId);
    networkDataLoaded = true;

    populateForm(debt);
  }
});
