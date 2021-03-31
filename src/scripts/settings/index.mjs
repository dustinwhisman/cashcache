import { addToDb, bulkAddToDb, getAllFromObjectStore, getAllFromCloud, deleteAllRecords } from '../db/index.mjs';
import { sanitize, uid, isPayingUser } from '../helpers/index.mjs';

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
      <a href="/overview">overview page</a> now.
    </p>
  `;
};

// utility function for converting CSVs to array of objects
// https://gist.github.com/plbowers/7560ae793613ee839151624182133159
const csvStringToArray = (strData, header = true) => {
  const objPattern = new RegExp(("(\\,|\\r?\\n|\\r|^)(?:\"((?:\\\\.|\"\"|[^\\\\\"])*)\"|([^\\,\"\\r\\n]*))"),"gi");
  let arrMatches = null;
  let arrData = [[]];
  while (arrMatches = objPattern.exec(strData)) {
    if (arrMatches[1].length && arrMatches[1] !== ",") {
      arrData.push([]);
    }

    arrData[arrData.length - 1].push(arrMatches[2]
      ? arrMatches[2].replace(new RegExp( "[\\\\\"](.)", "g" ), '$1')
      : arrMatches[3]);
  }

  if (header) {
    let hData = arrData.shift();
    let hashData = arrData.map(row => {
      let i = 0;
      return hData.reduce((acc, key) => {
        acc[key] = row[i++];
        return acc;
      }, {});
    });

    return hashData;
  }

  return arrData;
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
            <button type="button" class="tiny" data-copy-link-button>
              Copy
            </button>
          </p>
        `;
      }
    };
    reader.readAsText(file);
  }

  if (event.target.matches('[data-import-expenses-data]')) {
    const userId = uid();
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = async (e) => {
      const importProgressIndicator = document.querySelector('[data-import-expenses-progress]');
      importProgressIndicator.innerHTML = '<p>Loading file...</p>';
      try {
        const expensesData = csvStringToArray(e.target.result);
        importProgressIndicator.innerHTML = '<p>Uploading Expenses...</p>';

        const expensesToImport = expensesData.map((expense) => {
          const date = new Date(expense['Date']);
          return {
            uid: userId,
            year: date.getFullYear(),
            month: date.getMonth(),
            day: date.getDate(),
            category: expense['Category'],
            description: expense['Description'],
            amount: sanitize(expense['Amount']),
            key: null,
          };
        });
        await Promise.all(expensesToImport.map(async (expense) => {
          await addToDb('expenses', expense, true);
          Promise.resolve();
        }));

        if (userId && isPayingUser()) {
          const allExpenses = await getAllFromObjectStore('expenses', userId);
          await bulkAddToDb('expenses', allExpenses);
        }

        importProgressIndicator.innerHTML = `
          <p>
            All done! You should see all your data on the
            <a href="/overview">overview page</a> now.
          </p>
        `;
      } catch (error) {
        importProgressIndicator.innerHTML = `
          <p>
            There was a problem importing data from that file. Please double
            check the file and try again. If you continue to have problems,
            contact us at
            <a href="mailto:help@cashcache.io">
              help@cashcache.io
            </a>
            <button type="button" class="tiny" data-copy-link-button>
              Copy
            </button>
          </p>
        `;
      }
    };
    reader.readAsText(file);
  }

  if (event.target.matches('[data-import-income-data]')) {
    const userId = uid();
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = async (e) => {
      const importProgressIndicator = document.querySelector('[data-import-income-progress]');
      importProgressIndicator.innerHTML = '<p>Loading file...</p>';
      try {
        const incomeData = csvStringToArray(e.target.result);
        importProgressIndicator.innerHTML = '<p>Uploading Income...</p>';

        const incomeToImport = incomeData.map((income) => {
          const date = new Date(income['Date']);
          return {
            uid: userId,
            year: date.getFullYear(),
            month: date.getMonth(),
            day: date.getDate(),
            category: income['Category'],
            description: income['Description'],
            amount: sanitize(income['Amount']),
            key: null,
          };
        });
        await Promise.all(incomeToImport.map(async (income) => {
          await addToDb('income', income, true);
          Promise.resolve();
        }));

        if (userId && isPayingUser()) {
          const allIncome = await getAllFromObjectStore('income', userId);
          await bulkAddToDb('income', allIncome);
        }

        importProgressIndicator.innerHTML = `
          <p>
            All done! You should see all your data on the
            <a href="/overview">overview page</a> now.
          </p>
        `;
      } catch (error) {
        importProgressIndicator.innerHTML = `
          <p>
            There was a problem importing data from that file. Please double
            check the file and try again. If you continue to have problems,
            contact us at
            <a href="mailto:help@cashcache.io">
              help@cashcache.io
            </a>
            <button type="button" class="tiny" data-copy-link-button>
              Copy
            </button>
          </p>
        `;
      }
    };
    reader.readAsText(file);
  }

  if (event.target.matches('[data-import-savings-data]')) {
    const userId = uid();
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = async (e) => {
      const importProgressIndicator = document.querySelector('[data-import-savings-progress]');
      importProgressIndicator.innerHTML = '<p>Loading file...</p>';
      try {
        const savingsData = csvStringToArray(e.target.result);
        importProgressIndicator.innerHTML = '<p>Uploading Savings...</p>';

        const savingsToImport = savingsData.map((savings) => {
          const date = new Date(savings['Date']);
          return {
            uid: userId,
            year: date.getFullYear(),
            month: date.getMonth(),
            category: savings['Category'],
            description: savings['Description'],
            amount: sanitize(savings['Balance']),
            key: null,
          };
        });
        await Promise.all(savingsToImport.map(async (savings) => {
          await addToDb('savings', savings, true);
          Promise.resolve();
        }));

        if (userId && isPayingUser()) {
          const allSavings = await getAllFromObjectStore('savings', userId);
          await bulkAddToDb('savings', allSavings);
        }

        importProgressIndicator.innerHTML = `
          <p>
            All done! You should see all your data on the
            <a href="/overview">overview page</a> now.
          </p>
        `;
      } catch (error) {
        importProgressIndicator.innerHTML = `
          <p>
            There was a problem importing data from that file. Please double
            check the file and try again. If you continue to have problems,
            contact us at
            <a href="mailto:help@cashcache.io">
              help@cashcache.io
            </a>
            <button type="button" class="tiny" data-copy-link-button>
              Copy
            </button>
          </p>
        `;
      }
    };
    reader.readAsText(file);
  }

  if (event.target.matches('[data-import-debt-data]')) {
    const userId = uid();
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = async (e) => {
      const importProgressIndicator = document.querySelector('[data-import-debt-progress]');
      importProgressIndicator.innerHTML = '<p>Loading file...</p>';
      try {
        const debtData = csvStringToArray(e.target.result);
        importProgressIndicator.innerHTML = '<p>Uploading Debt...</p>';

        const debtToImport = debtData.map((debt) => {
          const date = new Date(debt['Date']);
          return {
            uid: userId,
            year: date.getFullYear(),
            month: date.getMonth(),
            description: debt['Description'],
            amount: sanitize(debt['Balance']),
            minimumPayment: sanitize(debt['Minimum Payment']),
            interestRate: sanitize(debt['Interest Rate']),
            key: null,
          };
        });
        await Promise.all(debtToImport.map(async (debt) => {
          await addToDb('debt', debt, true);
          Promise.resolve();
        }));

        if (userId && isPayingUser()) {
          const allDebt = await getAllFromObjectStore('debt', userId);
          await bulkAddToDb('debt', allDebt);
        }

        importProgressIndicator.innerHTML = `
          <p>
            All done! You should see all your data on the
            <a href="/overview">overview page</a> now.
          </p>
        `;
      } catch (error) {
        importProgressIndicator.innerHTML = `
          <p>
            There was a problem importing data from that file. Please double
            check the file and try again. If you continue to have problems,
            contact us at
            <a href="mailto:help@cashcache.io">
              help@cashcache.io
            </a>
            <button type="button" class="tiny" data-copy-link-button>
              Copy
            </button>
          </p>
        `;
      }
    };
    reader.readAsText(file);
  }
});

// export data
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

document.addEventListener('click', async (event) => {
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
          <a href="/overview">overview page</a> now.
        </p>
      `;
    }
  }
});
