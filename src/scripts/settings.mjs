import { addToDb, bulkAddToDb, getAllFromObjectStore, deleteAllRecords } from './db.mjs';

const importData = async (data) => {
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
    uid: appUser?.uid,
  }));
  await Promise.all(expensesToUpdate.map(async (expense) => {
    await addToDb('expenses', expense, true);
    return Promise.resolve();
  }));

  if (appUser?.uid) {
    await bulkAddToDb('expenses', expensesToUpdate);
  }

  importProgressIndicator.innerHTML = '<p>Importing income...</p>';
  const incomeToUpdate = income.map((income) => ({
    ...income,
    uid: appUser?.uid,
  }));
  await Promise.all(incomeToUpdate.map(async (income) => {
    await addToDb('income', income, true);
    return Promise.resolve();
  }));

  if (appUser?.uid) {
    await bulkAddToDb('income', incomeToUpdate);
  }

  importProgressIndicator.innerHTML = '<p>Importing savings...</p>';
  const savingsToUpdate = savings.map((savings) => ({
    ...savings,
    uid: appUser?.uid,
  }));
  await Promise.all(savingsToUpdate.map(async (savings) => {
    await addToDb('savings', savings, true);
    return Promise.resolve();
  }));

  if (appUser?.uid) {
    await bulkAddToDb('savings', savingsToUpdate);
  }

  importProgressIndicator.innerHTML = '<p>Importing debt...</p>';
  const debtToUpdate = debt.map((debt) => ({
    ...debt,
    uid: appUser?.uid,
  }));
  await Promise.all(debtToUpdate.map(async (debt) => {
    await addToDb('debt', debt, true);
    return Promise.resolve();
  }));

  if (appUser?.uid) {
    await bulkAddToDb('debt', debtToUpdate);
  }

  importProgressIndicator.innerHTML = '<p>Importing recurring expenses...</p>';
  const recurringExpensesToUpdate = recurringExpenses.map((expense) => ({
    ...expense,
    uid: appUser?.uid,
  }));
  await Promise.all(recurringExpensesToUpdate.map(async (expense) => {
    await addToDb('recurring-expenses', expense, true);
    return Promise.resolve();
  }));

  if (appUser?.uid) {
    await bulkAddToDb('recurring-expenses', recurringExpensesToUpdate);
  }

  importProgressIndicator.innerHTML = '<p>Importing recurring income...</p>';
  const recurringIncomeToUpdate = recurringIncome.map((income) => ({
    ...income,
    uid: appUser?.uid,
  }));
  await Promise.all(recurringIncomeToUpdate.map(async (income) => {
    await addToDb('recurring-income', income, true);
    return Promise.resolve();
  }));

  if (appUser?.uid) {
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

if (brightnessMode) {
  const brightnessInput = document.querySelector(`[name=brightness-mode][value=${brightnessMode}]`);
  brightnessInput.checked = true;
}

const currentDateSpan = document.querySelector('[data-current-date]');
const today = new Date();
currentDateSpan.innerHTML = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;

(() => {
  const preferences = localStorage.getItem('expenses-preferences') || '{}';
  const {
    groupByCategory = true,
    sortBy = 'amount',
    order = 'descending'
  } = JSON.parse(preferences);

  if (groupByCategory) {
    const groupByCategoryInput = document.querySelector('[name=group-expenses-by-category]');
    groupByCategoryInput.checked = true;
  }

  const sortByInput = document.querySelector(`[name=sort-expenses-by][value=${sortBy}]`);
  const orderInput = document.querySelector(`[name=expenses-sort-order][value=${order}]`);
  sortByInput.checked = true;
  orderInput.checked = true;

  const descendingLabel = document.querySelector('[data-expenses-descending-label]');
  const ascendingLabel = document.querySelector('[data-expenses-ascending-label]');
  if (sortBy === 'amount') {
    descendingLabel.innerHTML = 'Largest to Smallest';
    ascendingLabel.innerHTML = 'Smallest to Largest';
  } else {
    descendingLabel.innerHTML = 'Newest to Oldest';
    ascendingLabel.innerHTML = 'Oldest to Newest';
  }
})();

(() => {
  const preferences = localStorage.getItem('income-preferences') || '{}';
  const {
    groupByCategory = true,
    sortBy = 'amount',
    order = 'descending'
  } = JSON.parse(preferences);

  if (groupByCategory) {
    const groupByCategoryInput = document.querySelector('[name=group-income-by-category]');
    groupByCategoryInput.checked = true;
  }

  const sortByInput = document.querySelector(`[name=sort-income-by][value=${sortBy}]`);
  const orderInput = document.querySelector(`[name=income-sort-order][value=${order}]`);
  sortByInput.checked = true;
  orderInput.checked = true;

  const descendingLabel = document.querySelector('[data-income-descending-label]');
  const ascendingLabel = document.querySelector('[data-income-ascending-label]');
  if (sortBy === 'amount') {
    descendingLabel.innerHTML = 'Largest to Smallest';
    ascendingLabel.innerHTML = 'Smallest to Largest';
  } else {
    descendingLabel.innerHTML = 'Newest to Oldest';
    ascendingLabel.innerHTML = 'Oldest to Newest';
  }
})();

(() => {
  const preferences = localStorage.getItem('savings-preferences') || '{}';
  const {
    groupByCategory = true,
    order = 'descending'
  } = JSON.parse(preferences);

  if (groupByCategory) {
    const groupByCategoryInput = document.querySelector('[name=group-savings-by-category]');
    groupByCategoryInput.checked = true;
  }

  const orderInput = document.querySelector(`[name=savings-sort-order][value=${order}]`);
  orderInput.checked = true;
})();

(() => {
  const preferences = localStorage.getItem('debt-preferences') || '{}';
  const {
    method = 'avalanche'
  } = JSON.parse(preferences);

  const methodInput = document.querySelector(`[name=debt-method][value=${method}]`);
  methodInput.checked = true;
})();

document.addEventListener('change', (event) => {
  if (event.target.matches('[name=brightness-mode]')) {
    const rootElement = document.documentElement;
    const preference = event.target.value;
    rootElement.classList.remove(...rootElement.classList);
    if (preference) {
      rootElement.classList.add(preference);
      localStorage.setItem('brightness-mode', preference);
    } else {
      localStorage.removeItem('brightness-mode');
    }
  }

  if (event.target.matches('[name=sort-expenses-by]')) {
    const descendingLabel = document.querySelector('[data-expenses-descending-label]');
    const ascendingLabel = document.querySelector('[data-expenses-ascending-label]');
    if (event.target.value === 'amount') {
      descendingLabel.innerHTML = 'Largest to Smallest';
      ascendingLabel.innerHTML = 'Smallest to Largest';
    } else {
      descendingLabel.innerHTML = 'Newest to Oldest';
      ascendingLabel.innerHTML = 'Oldest to Newest';
    }
  }

  if (event.target.matches('[data-expenses-preferences-form] *')) {
    const savePreferencesButton = document.querySelector('[data-save-expenses-preferences]');
    savePreferencesButton.innerHTML = 'Save Preferences';
  }

  if (event.target.matches('[name=sort-income-by]')) {
    const descendingLabel = document.querySelector('[data-income-descending-label]');
    const ascendingLabel = document.querySelector('[data-income-ascending-label]');
    if (event.target.value === 'amount') {
      descendingLabel.innerHTML = 'Largest to Smallest';
      ascendingLabel.innerHTML = 'Smallest to Largest';
    } else {
      descendingLabel.innerHTML = 'Newest to Oldest';
      ascendingLabel.innerHTML = 'Oldest to Newest';
    }
  }

  if (event.target.matches('[data-income-preferences-form] *')) {
    const savePreferencesButton = document.querySelector('[data-save-income-preferences]');
    savePreferencesButton.innerHTML = 'Save Preferences';
  }

  if (event.target.matches('[data-savings-preferences-form] *')) {
    const savePreferencesButton = document.querySelector('[data-save-savings-preferences]');
    savePreferencesButton.innerHTML = 'Save Preferences';
  }

  if (event.target.matches('[data-debt-preferences-form] *')) {
    const savePreferencesButton = document.querySelector('[data-save-debt-preferences]');
    savePreferencesButton.innerHTML = 'Save Preferences';
  }

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
            <a href="mailto:help@cashcache.io">help@cashcache.io</a>.
          </p>
        `;
      }
    };
    reader.readAsText(file);
  }

  if (event.target.matches('[data-import-expenses-data]')) {
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
            uid: appUser?.uid,
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

        if (appUser?.uid) {
          const allExpenses = await getAllFromObjectStore('expenses', appUser?.uid);
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
            <a href="mailto:help@cashcache.io">help@cashcache.io</a>.
          </p>
        `;
      }
    };
    reader.readAsText(file);
  }

  if (event.target.matches('[data-import-income-data]')) {
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
            uid: appUser?.uid,
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

        if (appUser?.uid) {
          const allIncome = await getAllFromObjectStore('income', appUser?.uid);
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
            <a href="mailto:help@cashcache.io">help@cashcache.io</a>.
          </p>
        `;
      }
    };
    reader.readAsText(file);
  }

  if (event.target.matches('[data-import-savings-data]')) {
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
            uid: appUser?.uid,
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

        if (appUser?.uid) {
          const allSavings = await getAllFromObjectStore('savings', appUser?.uid);
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
            <a href="mailto:help@cashcache.io">help@cashcache.io</a>.
          </p>
        `;
      }
    };
    reader.readAsText(file);
  }

  if (event.target.matches('[data-import-debt-data]')) {
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
            uid: appUser?.uid,
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

        if (appUser?.uid) {
          const allDebt = await getAllFromObjectStore('debt', appUser?.uid);
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
            <a href="mailto:help@cashcache.io">help@cashcache.io</a>.
          </p>
        `;
      }
    };
    reader.readAsText(file);
  }
});

document.addEventListener('submit', (event) => {
  event.preventDefault();
  if (event.target.matches('[data-expenses-preferences-form]')) {
    const { elements } = event.target;
    const preferences = {
      groupByCategory: elements['group-expenses-by-category'].checked,
      sortBy: elements['sort-expenses-by'].value,
      order: elements['expenses-sort-order'].value,
    };

    localStorage.setItem('expenses-preferences', JSON.stringify(preferences));
    const savePreferencesButton = document.querySelector('[data-save-expenses-preferences]');
    savePreferencesButton.innerHTML = 'Saved!';
  }

  if (event.target.matches('[data-income-preferences-form]')) {
    const { elements } = event.target;
    const preferences = {
      groupByCategory: elements['group-income-by-category'].checked,
      sortBy: elements['sort-income-by'].value,
      order: elements['income-sort-order'].value,
    };

    localStorage.setItem('income-preferences', JSON.stringify(preferences));
    const savePreferencesButton = document.querySelector('[data-save-income-preferences]');
    savePreferencesButton.innerHTML = 'Saved!';
  }

  if (event.target.matches('[data-savings-preferences-form]')) {
    const { elements } = event.target;
    const preferences = {
      groupByCategory: elements['group-savings-by-category'].checked,
      order: elements['savings-sort-order'].value,
    };

    localStorage.setItem('savings-preferences', JSON.stringify(preferences));
    const savePreferencesButton = document.querySelector('[data-save-savings-preferences]');
    savePreferencesButton.innerHTML = 'Saved!';
  }

  if (event.target.matches('[data-debt-preferences-form]')) {
    const { elements } = event.target;
    const preferences = {
      method: elements['debt-method'].value,
    };

    localStorage.setItem('debt-preferences', JSON.stringify(preferences));
    const savePreferencesButton = document.querySelector('[data-save-debt-preferences]');
    savePreferencesButton.innerHTML = 'Saved!';
  }
});

document.addEventListener('click', async (event) => {
  if (event.target.matches('[data-export-data]')) {
    const data = {
      expenses: await getAllFromObjectStore('expenses', appUser?.uid),
      income: await getAllFromObjectStore('income', appUser?.uid),
      savings: await getAllFromObjectStore('savings', appUser?.uid),
      debt: await getAllFromObjectStore('debt', appUser?.uid),
      recurringExpenses: await getAllFromObjectStore('recurring-expenses', appUser?.uid),
      recurringIncome: await getAllFromObjectStore('recurring-income', appUser?.uid),
    };

    const today = new Date();
    const dataStr = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`;
    const anchor = document.createElement('a');
    anchor.setAttribute('href', dataStr);
    anchor.setAttribute('download', `cash-cache.${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}.json`);
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  }

  if (event.target.matches('[data-delete-data]')) {
    if (window.confirm('Are you sure you want to delete all of your data? This action is irreversible.')) {
      const deleteDataProgressBlock = document.querySelector('[data-delete-progress]');

      deleteDataProgressBlock.innerHTML = '<p>Deleting all expenses...</p>';
      const expensesRecords = await getAllFromObjectStore('expenses', appUser?.uid);
      await deleteAllRecords('expenses', expensesRecords);

      deleteDataProgressBlock.innerHTML = '<p>Deleting all income...</p>';
      const incomeRecords = await getAllFromObjectStore('income', appUser?.uid);
      await deleteAllRecords('income', incomeRecords);

      deleteDataProgressBlock.innerHTML = '<p>Deleting all savings...</p>';
      const savingsRecords = await getAllFromObjectStore('savings', appUser?.uid);
      await deleteAllRecords('savings', savingsRecords);

      deleteDataProgressBlock.innerHTML = '<p>Deleting all debt...</p>';
      const debtRecords = await getAllFromObjectStore('debt', appUser?.uid);
      await deleteAllRecords('debt', debtRecords);

      deleteDataProgressBlock.innerHTML = '<p>Deleting all recurring expenses...</p>';
      const recurringExpensesRecords = await getAllFromObjectStore('recurring-expenses', appUser?.uid);
      await deleteAllRecords('recurring-expenses', recurringExpensesRecords);

      deleteDataProgressBlock.innerHTML = '<p>Deleting all recurring income...</p>';
      const recurringIncomeRecords = await getAllFromObjectStore('recurring-income', appUser?.uid);
      await deleteAllRecords('recurring-income', recurringIncomeRecords);

      deleteDataProgressBlock.innerHTML = `
        <p>
          All done. You should have a clean slate on the
          <a href="/overview">overview page</a> now.
        </p>
      `;
    }
  }
});
