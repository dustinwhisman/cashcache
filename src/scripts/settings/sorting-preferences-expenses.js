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

document.addEventListener('change', (event) => {
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
});
