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

document.addEventListener('change', (event) => {
  if (event.target.matches('[data-savings-preferences-form] *')) {
    const savePreferencesButton = document.querySelector('[data-save-savings-preferences]');
    savePreferencesButton.innerHTML = 'Save Preferences';
  }
});

document.addEventListener('submit', (event) => {
  event.preventDefault();
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
});
