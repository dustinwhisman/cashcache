(() => {
  const preferences = localStorage.getItem('debt-preferences') || '{}';
  const {
    method = 'avalanche'
  } = JSON.parse(preferences);

  const methodInput = document.querySelector(`[name=debt-method][value=${method}]`);
  methodInput.checked = true;
})();

document.addEventListener('change', (event) => {
  if (event.target.matches('[data-debt-preferences-form] *')) {
    const savePreferencesButton = document.querySelector('[data-save-debt-preferences]');
    savePreferencesButton.innerHTML = 'Save Preferences';
  }
});

document.addEventListener('submit', (event) => {
  event.preventDefault();
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
