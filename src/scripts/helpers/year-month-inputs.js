const today = new Date();
let month = today.getMonth();
let year = today.getFullYear();
const params = new URLSearchParams(window.location.search);

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
