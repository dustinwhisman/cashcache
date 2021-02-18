import { addToDb } from '../db/index.mjs';
import { updateBackLink, sanitize, initializeYearMonthInputs } from '../helpers/index.mjs';

initializeYearMonthInputs(new URLSearchParams(window.location.search));

updateBackLink();
document.addEventListener('submit', async (event) => {
  event.preventDefault();

  const { elements } = event.target;
  const debt = {
    uid: appUser?.uid,
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
