import { getAllFromIndex, getAllFromCloudIndex } from '../db.mjs';
import { formatCurrency } from '../helpers/index.mjs';

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

const prevMonth = month - 1 >= 0 ? month - 1 : 11;
const prevYear = prevMonth === 11 ? year - 1 : year;

const nextMonth = month + 1 <= 11 ? month + 1 : 0;
const nextYear = nextMonth === 0 ? year + 1 : year;

const previousLink = document.querySelector('[data-previous-link]');
previousLink.href = `/insights/monthly?m=${prevMonth}&y=${prevYear}`;
previousLink.innerHTML = new Date(prevYear, prevMonth, 1).toLocaleString('en-US', {
  month: 'short',
  year: 'numeric',
});

const nextLink = document.querySelector('[data-next-link]');
nextLink.href = `/insights/monthly?m=${nextMonth}&y=${nextYear}`;
nextLink.innerHTML = new Date(nextYear, nextMonth, 1).toLocaleString('en-US', {
  month: 'short',
  year: 'numeric',
});

const currentMonthIndicators = document.querySelectorAll('[data-current-month]');
currentMonthIndicators.forEach((currentMonth) => {
  currentMonth.innerHTML = new Date(year, month, 1).toLocaleString('en-US', {
    month: 'short',
    year: 'numeric',
  });
});

let networkDataLoaded = false;
let networkLastMonthDataLoaded = false;
let networkLastYearDataLoaded = false;

const generateDateGrid = (expenses, income, totalExpenses, totalIncome) => {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const paddingDays = (daysInMonth + firstDayOfMonth) % 7 !== 0
    ? 7 - ((daysInMonth + firstDayOfMonth) % 7)
    : 0;

  const datesGrid = document.querySelector('[data-dates-grid]');
  datesGrid.innerHTML = `
    <div class="text-align:center font-weight:bold">S</div>
    <div class="text-align:center font-weight:bold">M</div>
    <div class="text-align:center font-weight:bold">T</div>
    <div class="text-align:center font-weight:bold">W</div>
    <div class="text-align:center font-weight:bold">T</div>
    <div class="text-align:center font-weight:bold">F</div>
    <div class="text-align:center font-weight:bold">S</div>
  `;

  for (let i = 0; i < firstDayOfMonth; i += 1) {
    datesGrid.innerHTML += '<div></div>';
  }

  for (let i = 0; i < daysInMonth; i += 1) {
    const expensesOnDay = expenses.reduce((acc, expense) => {
      if (expense.day !== i + 1) {
        return acc;
      }

      return acc + expense.amount;
    }, 0);
    const percentExpenses = Math.ceil(expensesOnDay / totalExpenses * 100);

    const incomeOnDay = income.reduce((acc, income) => {
      if (income.day !== i + 1) {
        return acc;
      }

      return acc + income.amount;
    }, 0);
    const percentIncome = Math.ceil(incomeOnDay / totalIncome * 100);

    datesGrid.innerHTML += `
      <div>
        <div class="day-marker">${i + 1}</div>
        ${expensesOnDay
        ? `
            <div style="width: 100%; height: 1rem; background: linear-gradient(to left, var(--red), var(--red) ${percentExpenses}%, var(--bg-color) ${percentExpenses}%, var(--bg-color) 100%)"></div>
            <div class="expenses-marker">${formatCurrency(expensesOnDay)}</div>
          `
        : ''}
        ${incomeOnDay
        ? `
            <div style="width: 100%; height: 1rem; background: linear-gradient(to left, var(--green), var(--green) ${percentIncome}%, var(--bg-color) ${percentIncome}%, var(--bg-color) 100%)"></div>
            <div class="income-marker">${formatCurrency(incomeOnDay)}</div>
          `
        : ''}
      </div>
    `;
  }

  for (let i = 0; i < paddingDays; i += 1) {
    datesGrid.innerHTML += '<div></div>';
  }

  const heatMapBlock = document.querySelector('[data-heat-map]');
  heatMapBlock.removeAttribute('hidden');
};

const compareMonthlyExpenses = (lastMonthsExpenses, totalExpenses) => {
  const monthToMonthBlock = document.querySelector('[data-monthly-expenses]');
  const lastMonthsTotalExpenses = lastMonthsExpenses.reduce((acc, expense) => (acc + expense.amount), 0);

  if (lastMonthsTotalExpenses > totalExpenses) {
    monthToMonthBlock.innerHTML = `
      <p>
        You spent ${formatCurrency(lastMonthsTotalExpenses - totalExpenses)}
        less this month than you did last month.
      </p>
    `;
  } else if (lastMonthsTotalExpenses < totalExpenses) {
    monthToMonthBlock.innerHTML = `
      <p>
        You spent ${formatCurrency(totalExpenses - lastMonthsTotalExpenses)}
        more this month than you did last month.
      </p>
    `;
  } else {
    monthToMonthBlock.innerHTML = `
      <p>
        Wow! You spent exactly the same amount
        (${formatCurrency(totalExpenses)}) this month as you did last month.
        What are the odds?
      </p>
    `;
  }
};

const compareMonthlyIncome = (lastMonthsIncome, totalIncome) => {
  const monthToMonthBlock = document.querySelector('[data-monthly-income]');
  const lastMonthsTotalIncome = lastMonthsIncome.reduce((acc, income) => (acc + income.amount), 0);

  if (lastMonthsTotalIncome > totalIncome) {
    monthToMonthBlock.innerHTML = `
      <p>
        You earned ${formatCurrency(lastMonthsTotalIncome - totalIncome)} less
        this month than you did last month.
      </p>
    `;
  } else if (lastMonthsTotalIncome < totalIncome) {
    monthToMonthBlock.innerHTML = `
      <p>
        You earned ${formatCurrency(totalIncome - lastMonthsTotalIncome)} more
        this month than you did last month.
      </p>
    `;
  } else {
    monthToMonthBlock.innerHTML = `
      <p>
        You earned exactly the same amount (${formatCurrency(totalIncome)})
        this month as you did last month.
      </p>
    `;
  }
};

const compareMonthlySavings = (lastMonthsSavings, totalSavings) => {
  const monthToMonthBlock = document.querySelector('[data-monthly-savings]');
  const lastMonthsTotalSavings = lastMonthsSavings.reduce((acc, savings) => (acc + savings.amount), 0);

  if (lastMonthsTotalSavings > totalSavings) {
    monthToMonthBlock.innerHTML = `
      <p>
        Your total savings went down by
        ${formatCurrency(lastMonthsTotalSavings - totalSavings)} since last
        month.
      </p>
    `;
  } else if (lastMonthsTotalSavings < totalSavings) {
    monthToMonthBlock.innerHTML = `
      <p>
        Your total savings went up by
        ${formatCurrency(totalSavings - lastMonthsTotalSavings)} since last
        month.
      </p>
    `;
  } else {
    monthToMonthBlock.innerHTML = `
      <p>
        Wow! Your savings stayed exactly the same
        (${formatCurrency(totalSavings)}). What are the odds?
      </p>
    `;
  }
};

const compareMonthlyDebt = (lastMonthsDebt, totalDebt) => {
  const monthToMonthBlock = document.querySelector('[data-monthly-debt]');
  const lastMonthsTotalDebt = lastMonthsDebt.reduce((acc, debt) => (acc + debt.amount), 0);

  if (lastMonthsTotalDebt > totalDebt) {
    monthToMonthBlock.innerHTML = `
      <p>
        Your total debt went down by
        ${formatCurrency(lastMonthsTotalDebt - totalDebt)} since last
        month.
      </p>
    `;
  } else if (lastMonthsTotalDebt < totalDebt) {
    monthToMonthBlock.innerHTML = `
      <p>
        Your total debt went up by
        ${formatCurrency(totalDebt - lastMonthsTotalDebt)} since last
        month.
      </p>
    `;
  } else {
    if (totalDebt === 0) {
      monthToMonthBlock.innerHTML = `
        <p>
          You remain debt-free. Nice work!
        </p>
      `;
    } else {
      monthToMonthBlock.innerHTML = `
        <p>
          Wow! Your debt stayed exactly the same
          (${formatCurrency(totalDebt)}). What are the odds?
        </p>
      `;
    }
  }
};

const compareToLastMonth = (totalExpenses, totalIncome, totalSavings, totalDebt) => {
  Promise.all([
    getAllFromIndex('expenses', 'year-month', prevYear, prevMonth, appUser?.uid),
    getAllFromIndex('income', 'year-month', prevYear, prevMonth, appUser?.uid),
    getAllFromIndex('savings', 'year-month', prevYear, prevMonth, appUser?.uid),
    getAllFromIndex('debt', 'year-month', prevYear, prevMonth, appUser?.uid),
  ])
    .then((values) => {
      const [lastMonthsExpenses, lastMonthsIncome, lastMonthsSavings, lastMonthsDebt] = values;

      if (!networkLastMonthDataLoaded) {
        compareMonthlyExpenses(lastMonthsExpenses, totalExpenses);
        compareMonthlyIncome(lastMonthsIncome, totalIncome);
        compareMonthlySavings(lastMonthsSavings, totalSavings);
        compareMonthlyDebt(lastMonthsDebt, totalDebt);
      }
    })
    .catch(console.error);
};

const compareYearlyExpenses = (lastYearsExpenses, totalExpenses) => {
  const yearToYearBlock = document.querySelector('[data-yearly-expenses]');
  const lastYearsTotalExpenses = lastYearsExpenses.reduce((acc, expense) => (acc + expense.amount), 0);

  if (lastYearsTotalExpenses > totalExpenses) {
    yearToYearBlock.innerHTML = `
      <p>
        You spent ${formatCurrency(lastYearsTotalExpenses - totalExpenses)}
        less this month than you did this month last year.
      </p>
    `;
  } else if (lastYearsTotalExpenses < totalExpenses) {
    yearToYearBlock.innerHTML = `
      <p>
        You spent ${formatCurrency(totalExpenses - lastYearsTotalExpenses)}
        more this month than you did this month last year.
      </p>
    `;
  } else {
    yearToYearBlock.innerHTML = `
      <p>
        Wow! You spent exactly the same amount
        (${formatCurrency(totalExpenses)}) this month as you did this month
        last year. What are the odds?
      </p>
    `;
  }
};

const compareYearlyIncome = (lastYearsIncome, totalIncome) => {
  const yearToYearBlock = document.querySelector('[data-yearly-income]');
  const lastYearsTotalIncome = lastYearsIncome.reduce((acc, income) => (acc + income.amount), 0);

  if (lastYearsTotalIncome > totalIncome) {
    yearToYearBlock.innerHTML = `
      <p>
        You earned ${formatCurrency(lastYearsTotalIncome - totalIncome)} less
        this month than you did this month last year.
      </p>
    `;
  } else if (lastYearsTotalIncome < totalIncome) {
    yearToYearBlock.innerHTML = `
      <p>
        You earned ${formatCurrency(totalIncome - lastYearsTotalIncome)} more
        this month than you did this month last year.
      </p>
    `;
  } else {
    yearToYearBlock.innerHTML = `
      <p>
        You earned exactly the same amount (${formatCurrency(totalIncome)})
        this month as you did this month last year.
      </p>
    `;
  }
};

const compareYearlySavings = (lastYearsSavings, totalSavings) => {
  const yearToYearBlock = document.querySelector('[data-yearly-savings]');
  const lastYearsTotalSavings = lastYearsSavings.reduce((acc, savings) => (acc + savings.amount), 0);

  if (lastYearsTotalSavings > totalSavings) {
    yearToYearBlock.innerHTML = `
      <p>
        Your total savings went down by
        ${formatCurrency(lastYearsTotalSavings - totalSavings)} since last
        year.
      </p>
    `;
  } else if (lastYearsTotalSavings < totalSavings) {
    yearToYearBlock.innerHTML = `
      <p>
        Your total savings went up by
        ${formatCurrency(totalSavings - lastYearsTotalSavings)} since last
        year.
      </p>
    `;
  } else {
    yearToYearBlock.innerHTML = `
      <p>
        Wow! Your savings stayed exactly the same
        (${formatCurrency(totalSavings)}). What are the odds?
      </p>
    `;
  }
};

const compareYearlyDebt = (lastYearsDebt, totalDebt) => {
  const yearToYearBlock = document.querySelector('[data-yearly-debt]');
  const lastYearsTotalDebt = lastYearsDebt.reduce((acc, debt) => (acc + debt.amount), 0);

  if (lastYearsTotalDebt > totalDebt) {
    yearToYearBlock.innerHTML = `
      <p>
        Your total debt went down by
        ${formatCurrency(lastYearsTotalDebt - totalDebt)} since last
        year.
      </p>
    `;
  } else if (lastYearsTotalDebt < totalDebt) {
    yearToYearBlock.innerHTML = `
      <p>
        Your total debt went up by
        ${formatCurrency(totalDebt - lastYearsTotalDebt)} since last
        year.
      </p>
    `;
  } else {
    if (totalDebt === 0) {
      yearToYearBlock.innerHTML = `
        <p>
          You remain debt-free. Nice work!
        </p>
      `;
    } else {
      yearToYearBlock.innerHTML = `
        <p>
          Wow! Your debt stayed exactly the same
          (${formatCurrency(totalDebt)}). What are the odds?
        </p>
      `;
    }
  }
};

const compareToLastYear = (totalExpenses, totalIncome, totalSavings, totalDebt) => {
  Promise.all([
    getAllFromIndex('expenses', 'year-month', year - 1, month, appUser?.uid),
    getAllFromIndex('income', 'year-month', year - 1, month, appUser?.uid),
    getAllFromIndex('savings', 'year-month', year - 1, month, appUser?.uid),
    getAllFromIndex('debt', 'year-month', year - 1, month, appUser?.uid),
  ])
    .then((values) => {
      const [lastYearsExpenses, lastYearsIncome, lastYearsSavings, lastYearsDebt] = values;

      if (!networkLastYearDataLoaded) {
        compareYearlyExpenses(lastYearsExpenses, totalExpenses);
        compareYearlyIncome(lastYearsIncome, totalIncome);
        compareYearlySavings(lastYearsSavings, totalSavings);
        compareYearlyDebt(lastYearsDebt, totalDebt);
      }
    })
    .catch(console.error);
};

const showSavingsRate = (totalExpenses, totalIncome) => {
  const savingsRate = ((totalIncome - totalExpenses) / totalIncome) * 100;
  if (isNaN(savingsRate)) {
    return;
  }

  const savingsRateBlock = document.querySelector('[data-savings-rate]');

  savingsRateBlock.innerHTML = `
    <p>
      Your savings rate this month was ${savingsRate.toFixed(2)}%.
    </p>
  `;

  savingsRateBlock.removeAttribute('hidden');
};

const fetchMonthlyInsightsData = () => {
  Promise.all([
    caches.match(`/api/get-all-from-index?storeName=expenses&year=${year}&month=${month}`).then(response => response.json()),
    caches.match(`/api/get-all-from-index?storeName=income&year=${year}&month=${month}`).then(response => response.json()),
    caches.match(`/api/get-all-from-index?storeName=savings&year=${year}&month=${month}`).then(response => response.json()),
    caches.match(`/api/get-all-from-index?storeName=debt&year=${year}&month=${month}`).then(response => response.json()),
  ])
    .then((values) => {
      const [expenses, income, savings, debt] = values;

      const totalExpenses = expenses.reduce((acc, expense) => (acc + expense.amount), 0);
      const totalIncome = income.reduce((acc, income) => (acc + income.amount), 0);
      const totalSavings = savings.reduce((acc, fund) => (acc + fund.amount), 0);
      const totalDebt = debt.reduce((acc, loan) => (acc + loan.amount), 0);

      if (!networkDataLoaded) {
        generateDateGrid(expenses, income, totalExpenses, totalIncome);
        compareToLastMonth(totalExpenses, totalIncome, totalSavings, totalDebt);
        compareToLastYear(totalExpenses, totalIncome, totalSavings, totalDebt);
        showSavingsRate(totalExpenses, totalIncome);
      }
    })
    .catch(console.error);
};

(() => {
  if (!appUser?.uid || !isPayingUser) {
    const monthlyInsights = document.querySelector('[data-monthly-insights]');
    const paywallMessage = document.querySelector('[data-paywall-message]');

    monthlyInsights.setAttribute('hidden', true);
    paywallMessage.removeAttribute('hidden');

    if (!appUser?.uid) {
      const ctaLogIn = document.querySelector('[data-cta-log-in]');
      ctaLogIn.removeAttribute('hidden');
    } else {
      const ctaSubscribe = document.querySelector('[data-cta-subscribe]');
      ctaSubscribe.removeAttribute('hidden');
    }

    return;
  }

  fetchMonthlyInsightsData();

  Promise.all([
    getAllFromIndex('expenses', 'year-month', year, month, appUser?.uid),
    getAllFromIndex('income', 'year-month', year, month, appUser?.uid),
    getAllFromIndex('savings', 'year-month', year, month, appUser?.uid),
    getAllFromIndex('debt', 'year-month', year, month, appUser?.uid),
  ])
    .then((values) => {
      const [expenses, income, savings, debt] = values;

      const totalExpenses = expenses.reduce((acc, expense) => (acc + expense.amount), 0);
      const totalIncome = income.reduce((acc, income) => (acc + income.amount), 0);
      const totalSavings = savings.reduce((acc, fund) => (acc + fund.amount), 0);
      const totalDebt = debt.reduce((acc, loan) => (acc + loan.amount), 0);

      if (!networkDataLoaded) {
        generateDateGrid(expenses, income, totalExpenses, totalIncome);
        compareToLastMonth(totalExpenses, totalIncome, totalSavings, totalDebt);
        compareToLastYear(totalExpenses, totalIncome, totalSavings, totalDebt);
        showSavingsRate(totalExpenses, totalIncome);
      }
    })
    .catch(console.error);
})();

document.addEventListener('token-confirmed', () => {
  if (appUser?.uid && isPayingUser) {
    let totalExpenses = 0;
    let totalIncome = 0;
    let totalSavings = 0;
    let totalDebt = 0;

    Promise.all([
      getAllFromCloudIndex('expenses', year, month, appUser?.uid),
      getAllFromCloudIndex('income', year, month, appUser?.uid),
      getAllFromCloudIndex('savings', year, month, appUser?.uid),
      getAllFromCloudIndex('debt', year, month, appUser?.uid),
    ])
      .then((values) => {
        const [expenses, income, savings, debt] = values;
        networkDataLoaded = true;

        totalExpenses = expenses.reduce((acc, expense) => (acc + expense.amount), 0);
        totalIncome = income.reduce((acc, income) => (acc + income.amount), 0);
        totalSavings = savings.reduce((acc, fund) => (acc + fund.amount), 0);
        totalDebt = debt.reduce((acc, loan) => (acc + loan.amount), 0);

        generateDateGrid(expenses, income, totalExpenses, totalIncome);
        compareToLastMonth(totalExpenses, totalIncome, totalSavings, totalDebt);
        compareToLastYear(totalExpenses, totalIncome, totalSavings, totalDebt);
        showSavingsRate(totalExpenses, totalIncome);
      })
      .catch(console.error);

    Promise.all([
      getAllFromCloudIndex('expenses', prevYear, prevMonth, appUser?.uid),
      getAllFromCloudIndex('income', prevYear, prevMonth, appUser?.uid),
      getAllFromCloudIndex('savings', prevYear, prevMonth, appUser?.uid),
      getAllFromCloudIndex('debt', prevYear, prevMonth, appUser?.uid),
    ])
      .then((values) => {
        const [lastMonthsExpenses, lastMonthsIncome, lastMonthsSavings, lastMonthsDebt] = values;
        networkLastMonthDataLoaded = true;

        compareMonthlyExpenses(lastMonthsExpenses, totalExpenses);
        compareMonthlyIncome(lastMonthsIncome, totalIncome);
        compareMonthlySavings(lastMonthsSavings, totalSavings);
        compareMonthlyDebt(lastMonthsDebt, totalDebt);
      })
      .catch(console.error);

    Promise.all([
      getAllFromCloudIndex('expenses', year - 1, month, appUser?.uid),
      getAllFromCloudIndex('income', year - 1, month, appUser?.uid),
      getAllFromCloudIndex('savings', year - 1, month, appUser?.uid),
      getAllFromCloudIndex('debt', year - 1, month, appUser?.uid),
    ])
      .then((values) => {
        const [lastYearsExpenses, lastYearsIncome, lastYearsSavings, lastYearsDebt] = values;
        networkLastYearDataLoaded = true;

        compareYearlyExpenses(lastYearsExpenses, totalExpenses);
        compareYearlyIncome(lastYearsIncome, totalIncome);
        compareYearlySavings(lastYearsSavings, totalSavings);
        compareYearlyDebt(lastYearsDebt, totalDebt);
      })
      .catch(console.error);
  }
});
