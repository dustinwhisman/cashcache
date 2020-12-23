import { addToDb } from './db.mjs';

const importData = async (data) => {
  const importProgressIndicator = document.querySelector('[data-import-progress]');
  const {
    expenses = [],
    income = [],
    savings = [],
    debt = []
  } = data;

  importProgressIndicator.innerHTML = '<p>Importing expenses...</p>';
  expenses.forEach(async (e) => {
    await addToDb('expenses', e);
  });

  importProgressIndicator.innerHTML = '<p>Importing income...</p>';
  income.forEach(async (i) => {
    await addToDb('income', i);
  });

  importProgressIndicator.innerHTML = '<p>Importing savings...</p>';
  savings.forEach(async (s) => {
    await addToDb('savings', s);
  });

  importProgressIndicator.innerHTML = '<p>Importing debt...</p>';
  debt.forEach(async (d) => {
    await addToDb('debt', d);
  });

  importProgressIndicator.innerHTML = `
    <p>
      All done! You should see all your data on the
      <a href="/overview">overview page</a> now.
    </p>
  `;
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
