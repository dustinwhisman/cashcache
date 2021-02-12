export const updateBackLink = () => {
  if (document.referrer) {
    const backLink = document.querySelector('[data-back-link]');
    backLink.href = document.referrer;
  }
}

export const addCategoryEventListener = () => {
  document.addEventListener('change', (event) => {
    if (event.target.matches('[name=category]')) {
      const newCategoryDiv = document.querySelector('[data-new-category]');
      const newCategoryInput = document.querySelector('#new-category');
      if (event.target.value === 'new-category') {
        newCategoryDiv.removeAttribute('hidden');
        newCategoryInput.setAttribute('required', true);
      } else {
        newCategoryDiv.setAttribute('hidden', true);
        newCategoryInput.removeAttribute('required');
      }
    }
  });
};
