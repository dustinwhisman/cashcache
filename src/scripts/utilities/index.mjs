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

export const formatCurrency = (value, locale = 'en-US', currency = 'USD') => new Intl
  .NumberFormat(locale, { style: 'currency', currency })
  .format(value);

const checkboxSvg = `
  <svg width="32" height="32" viewBox="-6 -6 44 44" aria-hidden="true" focusable="false" style="height: 1em; width: 1em">
    <rect class="checkbox__bg" width="35" height="35" x="-2" y="-2" stroke="currentColor" fill="none" stroke-width="3" rx="6"
        ry="6"></rect>
    <polyline class="checkbox__checkmark" points="4,14 12,23 28,5" stroke="transparent" stroke-width="4" fill="none"></polyline>
  </svg>
`;

const getDateGridHtml = () => {
  let gridHtml = '';

  for (let i = 1; i <= 31; i += 1) {
    gridHtml += `
      <div>
        <label class="custom-checkbox" ${i > 28 ? 'style="opacity: 0.5"' : ''}>
          <input type="checkbox" name="days-of-month" value="${i}">
          ${checkboxSvg}
          <span>
            ${i}
          </span>
        </label>
      </div>
    `;
  }

  return gridHtml;
};

export const initializeComplexDates = () => {
  const calendar = document.querySelector('[data-calendar]');
  calendar.innerHTML = getDateGridHtml();

  document.addEventListener('change', (event) => {
    if (event.target.matches('[name=frequency]')) {
      const simpleDatesBlock = document.querySelector('[data-simple-dates]');
      const complexDatesBlock = document.querySelector('[data-complex-dates]');
      if (event.target.value === 'twice-per-month') {
        simpleDatesBlock.setAttribute('hidden', true);
        complexDatesBlock.removeAttribute('hidden');
      } else {
        simpleDatesBlock.removeAttribute('hidden');
        complexDatesBlock.setAttribute('hidden', true);
      }
    }
  });
};
