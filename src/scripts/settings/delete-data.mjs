import { getAllFromObjectStore, deleteAllRecords } from '../db/index.mjs';
import { uid } from '../helpers/index.mjs';

document.addEventListener('click', async (event) => {
  const userId = uid();

  if (event.target.matches('[data-delete-data]')) {
    if (window.confirm('Are you sure you want to delete all of your data? This action is irreversible.')) {
      const deleteDataProgressBlock = document.querySelector('[data-delete-progress]');

      deleteDataProgressBlock.innerHTML = '<p>Deleting all expenses...</p>';
      const expensesRecords = await getAllFromObjectStore('expenses', userId);
      await deleteAllRecords('expenses', expensesRecords, userId);

      deleteDataProgressBlock.innerHTML = '<p>Deleting all income...</p>';
      const incomeRecords = await getAllFromObjectStore('income', userId);
      await deleteAllRecords('income', incomeRecords, userId);

      deleteDataProgressBlock.innerHTML = '<p>Deleting all savings...</p>';
      const savingsRecords = await getAllFromObjectStore('savings', userId);
      await deleteAllRecords('savings', savingsRecords, userId);

      deleteDataProgressBlock.innerHTML = '<p>Deleting all debt...</p>';
      const debtRecords = await getAllFromObjectStore('debt', userId);
      await deleteAllRecords('debt', debtRecords, userId);

      deleteDataProgressBlock.innerHTML = '<p>Deleting all recurring expenses...</p>';
      const recurringExpensesRecords = await getAllFromObjectStore('recurring-expenses', userId);
      await deleteAllRecords('recurring-expenses', recurringExpensesRecords, userId);

      deleteDataProgressBlock.innerHTML = '<p>Deleting all recurring income...</p>';
      const recurringIncomeRecords = await getAllFromObjectStore('recurring-income', userId);
      await deleteAllRecords('recurring-income', recurringIncomeRecords, userId);

      deleteDataProgressBlock.innerHTML = `
        <p>
          All done. You should have a clean slate on the
          <a href="/overview/">overview page</a> now.
        </p>
      `;
    }
  }
});
