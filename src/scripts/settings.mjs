import { addToDb, getAllFromObjectStore, deleteAllRecords } from './db.mjs';

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
  await Promise.all(expenses.map(async (e) => {
    await addToDb('expenses', e);
    return Promise.resolve();
  }));

  importProgressIndicator.innerHTML = '<p>Importing income...</p>';
  await Promise.all(income.map(async (i) => {
    await addToDb('income', i);
    return Promise.resolve();
  }));

  importProgressIndicator.innerHTML = '<p>Importing savings...</p>';
  await Promise.all(savings.map(async (s) => {
    await addToDb('savings', s);
    return Promise.resolve();
  }));

  importProgressIndicator.innerHTML = '<p>Importing debt...</p>';
  await Promise.all(debt.map(async (d) => {
    await addToDb('debt', d);
    return Promise.resolve();
  }));

  importProgressIndicator.innerHTML = '<p>Importing recurring expenses...</p>';
  await Promise.all(recurringExpenses.map(async (r) => {
    await addToDb('recurring-expenses', r);
    return Promise.resolve();
  }));

  importProgressIndicator.innerHTML = '<p>Importing recurring income...</p>';
  await Promise.all(recurringIncome.map(async (r) => {
    await addToDb('recurring-income', r);
    return Promise.resolve();
  }));

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

        await Promise.all(expensesData.map(async (expense) => {
          const date = new Date(expense['Date']);
          const newExpense = {
            year: date.getFullYear(),
            month: date.getMonth(),
            day: date.getDate(),
            category: expense['Category'],
            description: expense['Description'],
            amount: sanitize(expense['Amount']),
            key: null,
          };

          await addToDb('expenses', newExpense);
          Promise.resolve();
        }));

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

        await Promise.all(incomeData.map(async (income) => {
          const date = new Date(income['Date']);
          const newIncome = {
            year: date.getFullYear(),
            month: date.getMonth(),
            day: date.getDate(),
            category: income['Category'],
            description: income['Description'],
            amount: sanitize(income['Amount']),
            key: null,
          };

          await addToDb('income', newIncome);
          Promise.resolve();
        }));

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

        await Promise.all(savingsData.map(async (savings) => {
          const date = new Date(savings['Date']);
          const newSavings = {
            year: date.getFullYear(),
            month: date.getMonth(),
            category: savings['Category'],
            description: savings['Description'],
            amount: sanitize(savings['Balance']),
            key: null,
          };

          await addToDb('savings', newSavings);
          Promise.resolve();
        }));

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

        await Promise.all(debtData.map(async (debt) => {
          const date = new Date(debt['Date']);
          const newDebt = {
            year: date.getFullYear(),
            month: date.getMonth(),
            description: debt['Description'],
            amount: sanitize(debt['Balance']),
            minimumPayment: sanitize(debt['Minimum Payment']),
            interestRate: sanitize(debt['Interest Rate']),
            key: null,
          };

          await addToDb('debt', newDebt);
          Promise.resolve();
        }));

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
      expenses: await getAllFromObjectStore('expenses'),
      income: await getAllFromObjectStore('income'),
      savings: await getAllFromObjectStore('savings'),
      debt: await getAllFromObjectStore('debt'),
      recurringExpenses: await getAllFromObjectStore('recurring-expenses'),
      recurringIncome: await getAllFromObjectStore('recurring-income'),
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
      deleteDataProgressBlock.innerHTML = '<p>Deleting all records...</p>';
      await deleteAllRecords('expenses');
      await deleteAllRecords('income');
      await deleteAllRecords('savings');
      await deleteAllRecords('debt');
      await deleteAllRecords('recurring-expenses');
      await deleteAllRecords('recurring-income');

      deleteDataProgressBlock.innerHTML = `
        <p>
          All done. You should have a clean slate on the
          <a href="/overview">overview page</a> now.
        </p>
      `;
    }
  }
});
