import { addToDb, bulkAddToDb, getAllFromObjectStore, deleteAllRecords } from '../db/index.mjs';
import { sanitize, uid, isPayingUser } from '../helpers/index.mjs';

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

document.addEventListener('change', (event) => {
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
          <a href="/overview">overview page</a> now.
        </p>
      `;
    }
  }
});
