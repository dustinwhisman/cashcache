import { getAllCategories, getAllCategoriesFromCloud, addToDb } from '../db/index.mjs';
import { addCategoryEventListener, sanitize, radioSvg, getCurrentSpecifiedDate, updateDateInputs, initializeDateChangeListeners, uid, isPayingUser } from '../helpers/index.mjs';

const { year, month, day } = getCurrentSpecifiedDate(new URLSearchParams(window.location.search));
updateDateInputs(year, month, day);
initializeDateChangeListeners();

addCategoryEventListener();

const storeName = 'income';
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
  const income = {
    uid: uid(),
    key: elements['key'].value || null,
    year: Number(elements['year'].value),
    month: Number(elements['month'].value) - 1,
    day: Number(elements['day'].value),
    category: elements['category'].value === 'new-category' ? elements['new-category'].value : elements['category'].value,
    description: elements['income-description'].value,
    amount: sanitize(elements['amount'].value),
  };

  const statusElement = document.querySelector('[data-submit-status]');
  const button = event.target.querySelector('button[type=submit]');
  const savingMessage = button.dataset.labelSaving;
  const savedMessage = button.dataset.labelSaved;
  const failedMessage = button.dataset.labelFailed;

  try {
    button.innerHTML = savingMessage;
    statusElement.innerHTML = savingMessage;

    await addToDb('income', income);

    button.innerHTML = savedMessage;
    statusElement.innerHTML = savedMessage;

    const month = Number(elements['month'].value) - 1;
    const year = Number(elements['year'].value);
    window.location.href = `/overview/?m=${month}&y=${year}`;
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
  const userId = uid();
  if (userId && isPayingUser()) {
    const categories = await getAllCategoriesFromCloud(storeName, userId);
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
