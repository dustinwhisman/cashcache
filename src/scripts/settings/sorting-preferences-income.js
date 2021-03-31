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

document.addEventListener('change', (event) => {
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
});

document.addEventListener('submit', (event) => {
  event.preventDefault();
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
});
