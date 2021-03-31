import { getAllFromCloud, getAllFromObjectStore } from '../db/index.mjs';
import { uid, isPayingUser } from '../helpers/index.mjs';

const triggerDownload = (event, data) => {
  const today = new Date();
  const dataStr = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`;
  const anchor = document.createElement('a');
  anchor.setAttribute('href', dataStr);
  anchor.setAttribute('download', `cash-cache.${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}.json`);
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  event.target.innerHTML = 'Export Data';
};

document.addEventListener('click', (event) => {
  const userId = uid();
  if (event.target.matches('[data-export-data]')) {
    event.target.innerHTML = 'Exporting...';
    if (userId && isPayingUser()) {
      Promise.all([
        getAllFromCloud('expenses'),
        getAllFromCloud('income'),
        getAllFromCloud('savings'),
        getAllFromCloud('debt'),
        getAllFromCloud('recurring-expenses'),
        getAllFromCloud('recurring-income'),
      ])
        .then((values) => {
          const [ expenses, income, savings, debt, recurringExpenses, recurringIncome ] = values;
          const data = {
            expenses,
            income,
            savings,
            debt,
            recurringExpenses,
            recurringIncome,
          };

          triggerDownload(event, data);
        })
        .catch(console.error);
    } else {
      Promise.all([
        getAllFromObjectStore('expenses', userId),
        getAllFromObjectStore('income', userId),
        getAllFromObjectStore('savings', userId),
        getAllFromObjectStore('debt', userId),
        getAllFromObjectStore('recurring-expenses', userId),
        getAllFromObjectStore('recurring-income', userId),
      ])
        .then((values) => {
          const [ expenses, income, savings, debt, recurringExpenses, recurringIncome ] = values;
          const data = {
            expenses,
            income,
            savings,
            debt,
            recurringExpenses,
            recurringIncome,
          };

          triggerDownload(event, data);
        })
        .catch(console.error);
    }
  }
});
