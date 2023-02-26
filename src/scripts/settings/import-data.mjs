import { addToDb, bulkAddToDb } from '../db/index.mjs';
import { uid, isPayingUser } from '../helpers/index.mjs';

const importData = async (data) => {
  const userId = uid();
  const importProgressIndicator = document.querySelector('[data-import-progress]');
  const {
    expenses = [],
    income = [],
    savings = [],
    debt = [],
    recurringExpenses = [],
    recurringIncome = []
  } = data;

  importProgressIndicator.innerHTML = '<p>Importing expenses...</p>';
  const expensesToUpdate = expenses.map((expense) => ({
    ...expense,
    uid: userId,
  }));
  await Promise.all(expensesToUpdate.map(async (expense) => {
    await addToDb('expenses', expense, true);
    return Promise.resolve();
  }));

  if (userId && isPayingUser()) {
    await bulkAddToDb('expenses', expensesToUpdate);
  }

  importProgressIndicator.innerHTML = '<p>Importing income...</p>';
  const incomeToUpdate = income.map((income) => ({
    ...income,
    uid: userId,
  }));
  await Promise.all(incomeToUpdate.map(async (income) => {
    await addToDb('income', income, true);
    return Promise.resolve();
  }));

  if (userId && isPayingUser()) {
    await bulkAddToDb('income', incomeToUpdate);
  }

  importProgressIndicator.innerHTML = '<p>Importing savings...</p>';
  const savingsToUpdate = savings.map((savings) => ({
    ...savings,
    uid: userId,
  }));
  await Promise.all(savingsToUpdate.map(async (savings) => {
    await addToDb('savings', savings, true);
    return Promise.resolve();
  }));

  if (userId && isPayingUser()) {
    await bulkAddToDb('savings', savingsToUpdate);
  }

  importProgressIndicator.innerHTML = '<p>Importing debt...</p>';
  const debtToUpdate = debt.map((debt) => ({
    ...debt,
    uid: userId,
  }));
  await Promise.all(debtToUpdate.map(async (debt) => {
    await addToDb('debt', debt, true);
    return Promise.resolve();
  }));

  if (userId && isPayingUser()) {
    await bulkAddToDb('debt', debtToUpdate);
  }

  importProgressIndicator.innerHTML = '<p>Importing recurring expenses...</p>';
  const recurringExpensesToUpdate = recurringExpenses.map((expense) => ({
    ...expense,
    uid: userId,
  }));
  await Promise.all(recurringExpensesToUpdate.map(async (expense) => {
    await addToDb('recurring-expenses', expense, true);
    return Promise.resolve();
  }));

  if (userId && isPayingUser()) {
    await bulkAddToDb('recurring-expenses', recurringExpensesToUpdate);
  }

  importProgressIndicator.innerHTML = '<p>Importing recurring income...</p>';
  const recurringIncomeToUpdate = recurringIncome.map((income) => ({
    ...income,
    uid: userId,
  }));
  await Promise.all(recurringIncomeToUpdate.map(async (income) => {
    await addToDb('recurring-income', income, true);
    return Promise.resolve();
  }));

  if (userId && isPayingUser()) {
    await bulkAddToDb('recurring-income', recurringIncomeToUpdate);
  }

  importProgressIndicator.innerHTML = `
    <p>
      All done! You should see all your data on the
      <a href="/overview/">overview page</a> now.
    </p>
  `;
};

const currentDateSpan = document.querySelector('[data-current-date]');
const today = new Date();
currentDateSpan.innerHTML = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;

document.addEventListener('change', (event) => {
  if (event.target.matches('[data-import-data]')) {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      const importProgressIndicator = document.querySelector('[data-import-progress]');
      importProgressIndicator.innerHTML = '<p>Loading file...</p>';
      try {
        const importedData = JSON.parse(e.target.result);
        importData(importedData);
      } catch (error) {
        importProgressIndicator.innerHTML = `
          <p>
            There was a problem importing data from that file. Please double
            check the file or try exporting a new one from your other device or
            browser. If you continue to have problems, contact us at
            <a href="mailto:help@cashcache.io">
              help@cashcache.io
            </a>
          </p>
        `;
      }
    };
    reader.readAsText(file);
  }
});
