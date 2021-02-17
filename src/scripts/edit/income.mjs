import { getAllCategories, getAllCategoriesFromCloud, getFromDb, getFromCloudDb, addToDb, deleteFromDb } from '../db.mjs';
import { updateBackLink, addCategoryEventListener, formatCurrency, sanitize, radioSvg } from '../helpers/index.mjs';

updateBackLink();
addCategoryEventListener();

let key;
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
    uid: appUser?.uid,
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
    window.location.href = `/overview?m=${month}&y=${year}`;
  } catch (error) {
    button.innerHTML = failedMessage;
    statusElement.innerHTML = failedMessage;
    console.error(error);
  }
});

const populateForm = (income) => {
  const form = document.querySelector('form');
  const { elements } = form;
  elements['key'].value = income.key;

  if (elements['year'] !== document.activeElement) {
    elements['year'].value = `${income.year}`;
  }

  if (elements['month'] !== document.activeElement) {
    elements['month'].value = `${income.month + 1}`;
  }

  if (elements['day'] !== document.activeElement) {
    elements['day'].value = `${income.day}`;
  }

  if (elements['income-description'] !== document.activeElement) {
    elements['income-description'].value = `${income.description}`;
  }

  if (elements['amount'] !== document.activeElement) {
    elements['amount'].value = `${formatCurrency(income.amount)}`;
  }

  if (document.activeElement.name !== 'category') {
    const categoryInput = document.querySelector(`[name=category][value="${income.category}"]`);
    if (categoryInput) {
      categoryInput.checked = true;
    }
  }
};

(async () => {
  const params = new URLSearchParams(window.location.search);

  if (params?.has('key')) {
    key = params.get('key');
  }

  const deleteButton = document.querySelector('[data-delete]');
  deleteButton.dataset.key = key;

  try {
    Promise.all([
      getFromDb(storeName, key, appUser?.uid),
      getAllCategories(storeName),
    ])
      .then((values) => {
        const [ income, categories ] = values;
        cachedCategoriesLoaded = true;

        if (!networkCategoriesLoaded) {
          renderCategories(categories);
          populateForm(income);
        }
      });
  } catch (error) {
    const typicalState = document.querySelector('[data-typical-state]');
    const accessDenied = document.querySelector('[data-access-denied]');
    if (appUser) {
      const belongsToNobody = document.querySelector('[data-belongs-to-nobody]');
      belongsToNobody.removeAttribute('hidden');
    } else {
      const belongsToUser = document.querySelector('[data-belongs-to-user]');
      belongsToUser.removeAttribute('hidden');
    }

    typicalState.setAttribute('hidden', true);
    accessDenied.removeAttribute('hidden');
  }
})();

document.addEventListener('click', async (event) => {
  if (event.target.matches('[data-delete]')) {
    if (window.confirm('Are you sure you want to delete this income?')) {
      try {
        await deleteFromDb('income', event.target.dataset.key, appUser?.uid);
        if (document.referrer) {
          window.location.href = document.referrer;
        } else {
          window.location.href = `/overview`;
        }
      } catch (error) {
        window.alert(error.message);
      }
    }
  }
});

document.addEventListener('token-confirmed', async () => {
  if (appUser?.uid && isPayingUser) {
    Promise.all([
      getFromCloudDb(storeName, key, appUser?.uid),
      getAllCategoriesFromCloud(storeName, appUser?.uid),
    ])
      .then((values) => {
        const [ income, categories ] = values;
        networkCategoriesLoaded = true;

        if (!cachedCategoriesLoaded) {
          renderCategories(categories);
          populateForm(income);
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

          populateForm(income);
        }
      })
      .catch(console.error);
  }
});
