import { getAllCategories, getAllCategoriesFromCloud, addToDb } from '../db.mjs';
import { updateBackLink, addCategoryEventListener, initializeComplexDates, sanitize, radioSvg } from '../helpers/index.mjs';

updateBackLink();
addCategoryEventListener();
initializeComplexDates();

if (!appUser?.uid || !isPayingUser) {
  window.location.href = '/recurring-expenses';
}

const storeName = 'expenses';
let networkCategoriesLoaded = false;
let cachedCategoriesLoaded = false;
const renderCategories = (categories) => {
  const categoriesDiv = document.querySelector('[data-category]');
  let categoryTemplate = `
    <label class="custom-checkbox">
      <input type="radio" name="category" value="new-category" required>
      ${radioSvg}
      <span>
        New Category
      </span>
    </label>
  `;
  categories?.sort().forEach((category) => {
    categoryTemplate += `
      <label class="custom-checkbox">
        <input type="radio" name="category" value="${category}" required>
        ${radioSvg}
        <span>
          ${category}
        </span>
      </label>
    `;

  });
  categoriesDiv.innerHTML = categoryTemplate;
};

document.addEventListener('submit', async (event) => {
  event.preventDefault();

  const { elements } = event.target;
  const expense = {
    uid: appUser?.uid,
    key: elements['key'].value || null,
    category: elements['category'].value === 'new-category' ? elements['new-category'].value : elements['category'].value,
    description: elements['expense-description'].value,
    amount: sanitize(elements['amount'].value),
    year: Number(elements['year'].value),
    month: Number(elements['month'].value) - 1,
    day: Number(elements['day'].value),
    frequency: elements['frequency'].value,
    daysOfMonth: Array.from(elements['days-of-month']).filter(checkbox => checkbox.checked).map(checkbox => Number(checkbox.value)),
    active: elements['active'].checked,
  };

  const statusElement = document.querySelector('[data-submit-status]');
  const button = event.target.querySelector('button[type=submit]');
  const savingMessage = button.dataset.labelSaving;
  const savedMessage = button.dataset.labelSaved;
  const failedMessage = button.dataset.labelFailed;

  try {
    button.innerHTML = savingMessage;
    statusElement.innerHTML = savingMessage;

    await addToDb('recurring-expenses', expense);

    button.innerHTML = savedMessage;
    statusElement.innerHTML = savedMessage;

    window.location.href = `/recurring-expenses`;
  } catch (error) {
    button.innerHTML = failedMessage;
    statusElement.innerHTML = failedMessage;
    console.error(error);
  }
});

(async () => {
  const categories = await getAllCategories(storeName);
  cachedCategoriesLoaded = true;

  if (!networkCategoriesLoaded) {
    renderCategories(categories);
  }
})();

document.addEventListener('token-confirmed', async () => {
  if (appUser?.uid && isPayingUser) {
    const categories = await getAllCategoriesFromCloud(storeName, appUser?.uid);
    networkCategoriesLoaded = true;

    if (!cachedCategoriesLoaded) {
      renderCategories(categories);
    } else {
      const form = document.querySelector('form');
      const category = form.elements['category'].value;

      let categoryInput = document.querySelector(`[name=category][value="${category}"]`);
      const isFocused = categoryInput === document.activeElement;
      renderCategories(categories);
      categoryInput = document.querySelector(`[name=category][value="${category}"]`);
      if (categoryInput) {
        categoryInput.checked = true;
        if (isFocused) {
          categoryInput.focus();
        }
      }
    }
  }
});
