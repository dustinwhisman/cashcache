export const updateBackLink = () => {
  const backLink = document.querySelector('[data-back-link]');
  if (backLink == null) {
    return;
  }

  if (document.referrer) {
    backLink.href = document.referrer;
  } else {
    backLink.href = '#0';
    backLink.addEventListener('click', (event) => {
      event.preventDefault();
      window.history.back();
    });
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

export const formatDate = (year, month, day, locale = 'en-US') => new Intl
  .DateTimeFormat(locale, { year: '2-digit', month: 'numeric', day: 'numeric' })
  .format(new Date(year, month, day));

export const sanitize = (value) => Number(value.toString().replace(/[^0-9|.]/g, ''));

export const checkboxSvg = `
  <svg width="32" height="32" viewBox="-6 -6 44 44" aria-hidden="true" focusable="false" style="height: 1em; width: 1em">
    <rect class="checkbox__bg" width="35" height="35" x="-2" y="-2" stroke="currentColor" fill="none" stroke-width="3" rx="6"
        ry="6"></rect>
    <polyline class="checkbox__checkmark" points="4,14 12,23 28,5" stroke="transparent" stroke-width="4" fill="none"></polyline>
  </svg>
`;

export const radioSvg = `
  <svg width="32" height="32" viewBox="-4 -4 39 39" aria-hidden="true" focusable="false" style="height: 1em; width: 1em">
    <circle class="checkbox__bg" cx="16" cy="16" r="16" stroke="currentColor" fill="none" stroke-width="3" />
    <circle class="checkbox__checkmark" cx="16" cy="16" r="6" stroke="transparent" fill="none" stroke-width="4" />
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

export const getCurrentSpecifiedDate = (params = null) => {
  const today = new Date();
  let month = today.getMonth();
  let year = today.getFullYear();
  let day = today.getDate();

  if (params?.has('m')) {
    month = Number(params.get('m'));
  }

  if (params?.has('y')) {
    year = Number(params.get('y'));
  }

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  if (day > daysInMonth) {
    day = daysInMonth;
  }

  return {
    month,
    year,
    day,
  };
};

export const updateDateInputs = (year, month, day) => {
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const yearInput = document.querySelector('#year');
  yearInput.value = year;

  const monthInput = document.querySelector('#month');
  monthInput.value = month + 1;

  const dayInput = document.querySelector('#day');
  dayInput.value = day;

  if (daysInMonth === 31) {
    dayInput.pattern = '^(0?[1-9]|[12]\\d|3[01])$';
  } else if (daysInMonth === 30) {
    dayInput.pattern = '^(0?[1-9]|[12]\\d|3[0])$';
  } else if (daysInMonth === 29) {
    dayInput.pattern = '^(0?[1-9]|[12]\\d)$';
  } else {
    dayInput.pattern = '^(0?[1-9]|1\\d|[12][0-8])$';
  }
};

export const recalculateDays = () => {
  const yearInput = document.querySelector('#year');
  const monthInput = document.querySelector('#month');
  const dayInput = document.querySelector('#day');

  const daysInMonth = new Date(Number(yearInput.value), Number(monthInput.value), 0).getDate();

  if (dayInput.value > daysInMonth) {
    dayInput.value = daysInMonth;
  }

  if (daysInMonth === 31) {
    dayInput.pattern = '^(0?[1-9]|[12]\\d|3[01])$';
  } else if (daysInMonth === 30) {
    dayInput.pattern = '^(0?[1-9]|[12]\\d|3[0])$';
  } else if (daysInMonth === 29) {
    dayInput.pattern = '^(0?[1-9]|[12]\\d)$';
  } else {
    dayInput.pattern = '^(0?[1-9]|1\\d|[12][0-8])$';
  }
};

export const initializeDateChangeListeners = () => {
  const yearInput = document.querySelector('#year');
  const monthInput = document.querySelector('#month');

  monthInput.addEventListener('change', recalculateDays);
  yearInput.addEventListener('change', recalculateDays);
};

export const initializeYearMonthInputs = (params = null) => {
  const today = new Date();
  let month = today.getMonth();
  let year = today.getFullYear();

  if (params?.has('m')) {
    month = Number(params.get('m'));
  }

  if (params?.has('y')) {
    year = Number(params.get('y'));
  }

  const yearInput = document.querySelector('#year');
  yearInput.value = year;

  const monthInput = document.querySelector('#month');
  monthInput.value = month + 1;
};

export const getCustomerId = (token) => {
  fetch('/api/get-is-paying-user', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  })
    .then((response) => response.json())
    .then((data) => {
      if (data?.isPayingUser) {
        localStorage.setItem('isPayingUser', 'true');
        const isPayingCustomerEvent = new CustomEvent('is-paying-customer', { detail: data?.customerId });
        document.dispatchEvent(isPayingCustomerEvent);
      } else {
        localStorage.removeItem('isPayingUser');
        const notPayingCustomerEvent = new CustomEvent('not-paying-customer');
        document.dispatchEvent(notPayingCustomerEvent);
      }
    })
    .catch(console.error);
};


export const uid = () => localStorage.getItem('uid') || null;

export const isPayingUser = () => !!localStorage.getItem('isPayingUser');

export const token = () => localStorage.getItem('token') || null;

// utility function for converting CSVs to array of objects
// https://gist.github.com/plbowers/7560ae793613ee839151624182133159
export const csvStringToArray = (strData, header = true) => {
  const objPattern = new RegExp(("(\\,|\\r?\\n|\\r|^)(?:\"((?:\\\\.|\"\"|[^\\\\\"])*)\"|([^\\,\"\\r\\n]*))"),"gi");
  let arrMatches = null;
  let arrData = [[]];
  while (arrMatches = objPattern.exec(strData)) {
    if (arrMatches[1].length && arrMatches[1] !== ",") {
      arrData.push([]);
    }

    arrData[arrData.length - 1].push(arrMatches[2]
      ? arrMatches[2].replace(new RegExp( "[\\\\\"](.)", "g" ), '$1')
      : arrMatches[3]);
  }

  if (header) {
    let hData = arrData.shift();
    let hashData = arrData.map(row => {
      let i = 0;
      return hData.reduce((acc, key) => {
        acc[key] = row[i++];
        return acc;
      }, {});
    });

    return hashData;
  }

  return arrData;
};
