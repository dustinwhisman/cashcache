if (brightnessMode) {
  const brightnessInput = document.querySelector(`[name=brightness-mode][value=${brightnessMode}]`);
  brightnessInput.checked = true;
}

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
});
