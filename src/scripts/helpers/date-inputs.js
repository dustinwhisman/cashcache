const today = new Date();
let month = today.getMonth();
let year = today.getFullYear();
let day = today.getDate();
const params = new URLSearchParams(window.location.search);

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

const recalculateDays = () => {
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

monthInput.addEventListener('change', recalculateDays);
yearInput.addEventListener('change', recalculateDays);
