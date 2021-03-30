import { getAllFromIndex, getAllFromCloudIndex, getAllFromObjectStore, getAllFromCloud, addToDb, bulkAddToDb } from '../db/index.mjs';
import { displayExpenses } from './get-expenses.mjs';
import { displayIncome } from './get-income.mjs';
import { displaySavings } from './get-savings.mjs';
import { displayDebt } from './get-debt.mjs';
import { uid, isPayingUser } from '../helpers/index.mjs';

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
previousLink.href = `/overview?m=${prevMonth}&y=${prevYear}`;
previousLink.innerHTML = new Date(prevYear, prevMonth, 1).toLocaleString('en-US', {
  month: 'short',
  year: 'numeric',
});

const nextLink = document.querySelector('[data-next-link]');
nextLink.href = `/overview?m=${nextMonth}&y=${nextYear}`;
nextLink.innerHTML = new Date(nextYear, nextMonth, 1).toLocaleString('en-US', {
  month: 'short',
  year: 'numeric',
});

const currentMonth = document.querySelector('[data-current-month]');
currentMonth.innerHTML = new Date(year, month, 1).toLocaleString('en-US', {
  month: 'short',
  year: 'numeric',
});

const addExpenseLink = document.querySelector('[data-add-expense-link]');
const addIncomeLink = document.querySelector('[data-add-income-link]');
const addSavingsLink = document.querySelector('[data-add-savings-link]');
const addDebtLink = document.querySelector('[data-add-debt-link]');

addExpenseLink.href = `/add/expense?m=${month}&y=${year}`;
addIncomeLink.href = `/add/income?m=${month}&y=${year}`;
addSavingsLink.href = `/add/savings?m=${month}&y=${year}`;
addDebtLink.href = `/add/debt?m=${month}&y=${year}`;

let lastMonth = month - 1;
let lastMonthYear = year;
if (lastMonth < 0) {
  lastMonth = 11;
  lastMonthYear -= 1;
}

let networkExpensesLoaded = false;
let networkIncomeLoaded = false;
let networkSavingsLoaded = false;
let networkDebtLoaded = false;

let inMemoryRecurringExpenses;
let inMemoryRecurringIncome;
let inMemoryLastMonthsSavings;
let inMemoryLastMonthsDebt;

const fetchExpenses = (shouldRender = false) => {
  Promise.all([
    caches.match(`/api/get-all-from-index?storeName=expenses&year=${year}&month=${month}`).then(response => response.json()),
    caches.match('/api/get-all-from-store?storeName=recurring-expenses').then(response => response.json()),
  ])
    .then((values) => {
      const [ expenses, recurringExpenses ] = values;

      if (!networkExpensesLoaded || shouldRender) {
        displayExpenses(expenses, recurringExpenses);
      }
    })
    .catch(() => {
      // swallow error - we don't care about cache failures here
    });
};

const loadExpenses = (shouldRender = false) => {
  const userId = uid();
  if (userId && isPayingUser()) {
    fetchExpenses(shouldRender);
  }

  Promise.all([
    getAllFromIndex('expenses', 'year-month', year, month, userId),
    getAllFromObjectStore('recurring-expenses', userId),
  ])
    .then((values) => {
      const [ expenses, recurringExpenses ] = values;

      if (!networkExpensesLoaded || shouldRender) {
        inMemoryRecurringExpenses = recurringExpenses;
        displayExpenses(expenses, recurringExpenses);
      }
    })
    .catch(console.error);
};

const fetchIncome = (shouldRender = false) => {
  Promise.all([
    caches.match(`/api/get-all-from-index?storeName=income&year=${year}&month=${month}`).then(response => response.json()),
    caches.match('/api/get-all-from-store?storeName=recurring-income').then(response => response.json()),
  ])
    .then((values) => {
      const [ income, recurringIncome ] = values;

      if (!networkIncomeLoaded || shouldRender) {
        displayIncome(income, recurringIncome);
      }
    })
    .catch(() => {
      // swallow error - we don't care about cache failures here
    });
};

const loadIncome = (shouldRender = false) => {
  const userId = uid();
  if (userId && isPayingUser()) {
    fetchIncome(shouldRender);
  }

  Promise.all([
    getAllFromIndex('income', 'year-month', year, month, userId),
    getAllFromObjectStore('recurring-income', userId),
  ])
    .then((values) => {
      const [ income, recurringIncome ] = values;

      if (!networkIncomeLoaded || shouldRender) {
        inMemoryRecurringIncome = recurringIncome;
        displayIncome(income, recurringIncome);
      }
    })
    .catch(console.error);
};

const fetchSavings = (shouldRender = false) => {
  Promise.all([
    caches.match(`/api/get-all-from-index?storeName=savings&year=${year}&month=${month}`).then(response => response.json()),
    caches.match(`/api/get-all-from-index?storeName=savings&year=${lastMonthYear}&month=${lastMonth}`).then(response => response.json()),
  ])
    .then((values) => {
      const [ savings, lastMonthsSavings ] = values;

      if (!networkSavingsLoaded || shouldRender) {
        displaySavings(savings, lastMonthsSavings);
      }
    })
    .catch(() => {
      // swallow error - we don't care about cache failures here
    });
};

const loadSavings = (shouldRender = false) => {
  const userId = uid();
  if (userId && isPayingUser()) {
    fetchSavings(shouldRender);
  }

  Promise.all([
    getAllFromIndex('savings', 'year-month', year, month, userId),
    getAllFromIndex('savings', 'year-month', lastMonthYear, lastMonth, userId),
  ])
    .then((values) => {
      const [ savings, lastMonthsSavings ] = values;

      if (!networkSavingsLoaded || shouldRender) {
        inMemoryLastMonthsSavings = lastMonthsSavings;
        displaySavings(savings, lastMonthsSavings);
      }
    })
    .catch(console.error);
};

const fetchDebt = (shouldRender = false) => {
  Promise.all([
    caches.match(`/api/get-all-from-index?storeName=debt&year=${year}&month=${month}`).then(response => response.json()),
    caches.match(`/api/get-all-from-index?storeName=debt&year=${lastMonthYear}&month=${lastMonth}`).then(response => response.json()),
  ])
    .then((values) => {
      const [ debt, lastMonthsDebt ] = values;

      if (!networkDebtLoaded || shouldRender) {
        displayDebt(debt, lastMonthsDebt);
      }
    })
    .catch(() => {
      // swallow error - we don't care about cache failures here
    });
};

const loadDebt = async (shouldRender = false) => {
  const userId = uid();
  if (userId && isPayingUser()) {
    fetchDebt(shouldRender);
  }

  Promise.all([
    getAllFromIndex('debt', 'year-month', year, month, userId),
    getAllFromIndex('debt', 'year-month', lastMonthYear, lastMonth, userId),
  ])
    .then((values) => {
      const [ debt, lastMonthsDebt ] = values;

      if (!networkDebtLoaded || shouldRender) {
        inMemoryLastMonthsDebt = lastMonthsDebt;
        displayDebt(debt, lastMonthsDebt);
      }
    })
    .catch(console.error);
};

loadExpenses();
loadIncome();
loadSavings();
loadDebt();

const isMonthOnInterval = (startingMonth, currentMonth, interval) => {
  if ((Math.abs(startingMonth - currentMonth) % interval) !== 0) {
    return false;
  }

  return true;
};

document.addEventListener('token-confirmed', () => {
  const userId = uid();
  if (userId && isPayingUser()) {
    Promise.all([
      getAllFromCloudIndex('expenses', year, month, userId),
      getAllFromCloud('recurring-expenses'),
    ])
      .then((values) => {
        const [ expenses, recurringExpenses ] = values;
        networkExpensesLoaded = true;
        inMemoryRecurringExpenses = recurringExpenses;

        displayExpenses(expenses, recurringExpenses);
      })
      .catch(console.error);

    Promise.all([
      getAllFromCloudIndex('income', year, month, userId),
      getAllFromCloud('recurring-income'),
    ])
      .then((values) => {
        const [ income, recurringIncome ] = values;
        networkIncomeLoaded = true;
        inMemoryRecurringIncome = recurringIncome;

        displayIncome(income, recurringIncome);
      })
      .catch(console.error);

    Promise.all([
      getAllFromCloudIndex('savings', year, month, userId),
      getAllFromCloudIndex('savings', lastMonthYear, lastMonth, userId),
    ])
      .then((values) => {
        const [ savings, lastMonthsSavings ] = values;
        networkSavingsLoaded = true;
        inMemoryLastMonthsSavings = lastMonthsSavings;

        displaySavings(savings, lastMonthsSavings);
      })
      .catch(console.error);

    Promise.all([
      getAllFromCloudIndex('debt', year, month, userId),
      getAllFromCloudIndex('debt', lastMonthYear, lastMonth, userId),
    ])
      .then((values) => {
        const [ debt, lastMonthsDebt ] = values;
        networkDebtLoaded = true;
        inMemoryLastMonthsDebt = lastMonthsDebt;

        displayDebt(debt, lastMonthsDebt);
      })
      .catch(console.error);
  }
});

document.addEventListener('click', async (event) => {
  const userId = uid();
  if (event.target.matches('[data-copy-savings] button')) {
    event.target.innerHTML = 'Copying...';
    let lastMonthsSavings = inMemoryLastMonthsSavings;
    if (!lastMonthsSavings) {
      lastMonthsSavings = await getAllFromIndex('savings', 'year-month', lastMonthYear, lastMonth, userId);
    }

    await Promise.all(lastMonthsSavings.map(async (fund) => {
      const newFund = {
        ...fund,
        month,
        year,
        key: null,
      };

      await addToDb('savings', newFund, true);
      return Promise.resolve();
    }));

    if (userId && isPayingUser()) {
      const savingsToAdd = await getAllFromIndex('savings', 'year-month', year, month, userId);
      await bulkAddToDb('savings', savingsToAdd);
    }

    loadSavings(true);
  }

  if (event.target.matches('[data-copy-debt] button')) {
    event.target.innerHTML = 'Copying...';
    let lastMonthsDebt = inMemoryLastMonthsDebt;
    if (!lastMonthsDebt) {
      lastMonthsDebt = await getAllFromIndex('debt', 'year-month', lastMonthYear, lastMonth, userId);
    }

    await Promise.all(lastMonthsDebt.map(async (loan) => {
      const newLoan = {
        ...loan,
        month,
        year,
        key: null,
      };

      await addToDb('debt', newLoan, true);
      return Promise.resolve();
    }));

    if (userId && isPayingUser()) {
      const debtToAdd = await getAllFromIndex('debt', 'year-month', year, month, userId);
      await bulkAddToDb('debt', debtToAdd);
    }

    loadDebt(true);
  }

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  if (event.target.matches('[data-copy-expenses] button')) {
    event.target.innerHTML = 'Copying...';
    let recurringExpenses = inMemoryRecurringExpenses;

    if (!recurringExpenses) {
      if (userId && isPayingUser()) {
        recurringExpenses = await getAllFromCloud('recurring-expenses');
      } else {
        recurringExpenses = await getAllFromObjectStore('recurring-expenses', userId);
      }
    }

    await Promise.all(recurringExpenses.map(async (expense) => {
      if (expense.isDeleted || !expense.active) {
        return Promise.resolve();
      }

      if (expense.frequency === '1-month') {
        const newExpense = {
          uid: userId,
          year,
          month,
          day: expense.day > daysInMonth ? daysInMonth : expense.day,
          category: expense.category,
          description: expense.description,
          amount: expense.amount,
          key: null,
        };

        await addToDb('expenses', newExpense, true);
        return Promise.resolve();
      }

      if (expense.frequency === '3-month') {
        if (!isMonthOnInterval(expense.month, month, 3)) {
          return Promise.resolve();
        }

        const newExpense = {
          uid: userId,
          year,
          month,
          day: expense.day > daysInMonth ? daysInMonth : expense.day,
          category: expense.category,
          description: expense.description,
          amount: expense.amount,
          key: null,
        };

        await addToDb('expenses', newExpense, true);
        return Promise.resolve();
      }

      if (expense.frequency === '6-month') {
        if (!isMonthOnInterval(expense.month, month, 6)) {
          return Promise.resolve();
        }

        const newExpense = {
          uid: userId,
          year,
          month,
          day: expense.day > daysInMonth ? daysInMonth : expense.day,
          category: expense.category,
          description: expense.description,
          amount: expense.amount,
          key: null,
        };

        await addToDb('expenses', newExpense, true);
        return Promise.resolve();
      }

      if (expense.frequency === '1-year') {
        if (expense.month !== month) {
          return Promise.resolve();
        }

        const newExpense = {
          uid: userId,
          year,
          month,
          day: expense.day > daysInMonth ? daysInMonth : expense.day,
          category: expense.category,
          description: expense.description,
          amount: expense.amount,
          key: null,
        };

        await addToDb('expenses', newExpense, true);
        return Promise.resolve();
      }

      if (expense.frequency === '1-week') {
        let expenseDay = new Date(expense.year, expense.month, expense.day);
        const maximumDay = new Date(year, month + 1, 0);
        while (true) {
          if (expenseDay > maximumDay) {
            break;
          }

          if (expenseDay.getFullYear() !== year || expenseDay.getMonth() !== month) {
            expenseDay.setDate(expenseDay.getDate() + 7);
            continue;
          }

          const newExpense = {
            uid: userId,
            year,
            month,
            day: expenseDay.getDate() > daysInMonth ? daysInMonth : expenseDay.getDate(),
            category: expense.category,
            description: expense.description,
            amount: expense.amount,
            key: null,
          };

          await addToDb('expenses', newExpense, true);
          expenseDay.setDate(expenseDay.getDate() + 7);
        }

        return Promise.resolve();
      }

      if (expense.frequency === '2-week') {
        let expenseDay = new Date(expense.year, expense.month, expense.day);
        const maximumDay = new Date(year, month + 1, 0);
        while (true) {
          if (expenseDay > maximumDay) {
            break;
          }

          if (expenseDay.getFullYear() !== year || expenseDay.getMonth() !== month) {
            expenseDay.setDate(expenseDay.getDate() + 14);
            continue;
          }

          const newExpense = {
            uid: userId,
            year,
            month,
            day: expenseDay.getDate() > daysInMonth ? daysInMonth : expenseDay.getDate(),
            category: expense.category,
            description: expense.description,
            amount: expense.amount,
            key: null,
          };

          await addToDb('expenses', newExpense, true);
          expenseDay.setDate(expenseDay.getDate() + 14);
        }

        return Promise.resolve();
      }

      if (expense.frequency === 'twice-per-month') {
        await Promise.all(expense.daysOfMonth.map(async (day) => {
          const newExpense = {
            uid: userId,
            year,
            month,
            day: day > daysInMonth ? daysInMonth : day,
            category: expense.category,
            description: expense.description,
            amount: expense.amount,
            key: null,
          };

          await addToDb('expenses', newExpense, true);
          return Promise.resolve();
        }));

        return Promise.resolve();
      }

      return Promise.resolve();
    }));

    if (userId && isPayingUser()) {
      const expensesToAdd = await getAllFromIndex('expenses', 'year-month', year, month, userId);
      await bulkAddToDb('expenses', expensesToAdd);
    }

    loadExpenses(true);
  }

  if (event.target.matches('[data-copy-income] button')) {
    event.target.innerHTML = 'Copying...';
    let recurringIncome = inMemoryRecurringIncome;

    if (!recurringIncome) {
      if (userId && isPayingUser()) {
        recurringIncome = await getAllFromObjectStore('recurring-income', userId);
      } else {
        recurringIncome = await getAllFromCloud('recurring-income');
      }
    }

    await Promise.all(recurringIncome.map(async (income) => {
      if (income.isDeleted || !income.active) {
        return Promise.resolve();
      }

      if (income.frequency === '1-month') {
        const newIncome = {
          uid: userId,
          year,
          month,
          day: income.day > daysInMonth ? daysInMonth : income.day,
          category: income.category,
          description: income.description,
          amount: income.amount,
          key: null,
        };

        await addToDb('income', newIncome, true);
        return Promise.resolve();
      }

      if (income.frequency === '3-month') {
        if (!isMonthOnInterval(income.month, month, 3)) {
          return Promise.resolve();
        }

        const newIncome = {
          uid: userId,
          year,
          month,
          day: income.day > daysInMonth ? daysInMonth : income.day,
          category: income.category,
          description: income.description,
          amount: income.amount,
          key: null,
        };

        await addToDb('income', newIncome, true);
        return Promise.resolve();
      }

      if (income.frequency === '6-month') {
        if (!isMonthOnInterval(income.month, month, 6)) {
          return Promise.resolve();
        }

        const newIncome = {
          uid: userId,
          year,
          month,
          day: income.day > daysInMonth ? daysInMonth : income.day,
          category: income.category,
          description: income.description,
          amount: income.amount,
          key: null,
        };

        await addToDb('income', newIncome, true);
        return Promise.resolve();
      }

      if (income.frequency === '1-year') {
        if (income.month !== month) {
          return Promise.resolve();
        }

        const newIncome = {
          uid: userId,
          year,
          month,
          day: income.day > daysInMonth ? daysInMonth : income.day,
          category: income.category,
          description: income.description,
          amount: income.amount,
          key: null,
        };

        await addToDb('income', newIncome, true);
        return Promise.resolve();
      }

      if (income.frequency === '1-week') {
        let incomeDay = new Date(income.year, income.month, income.day);
        const maximumDay = new Date(year, month + 1, 0);
        while (true) {
          if (incomeDay > maximumDay) {
            break;
          }

          if (incomeDay.getFullYear() !== year || incomeDay.getMonth() !== month) {
            incomeDay.setDate(incomeDay.getDate() + 7);
            continue;
          }

          const newIncome = {
            uid: userId,
            year,
            month,
            day: incomeDay.getDate() > daysInMonth ? daysInMonth : incomeDay.getDate(),
            category: income.category,
            description: income.description,
            amount: income.amount,
            key: null,
          };

          await addToDb('income', newIncome, true);
          incomeDay.setDate(incomeDay.getDate() + 7);
        }

        return Promise.resolve();
      }

      if (income.frequency === '2-week') {
        let incomeDay = new Date(income.year, income.month, income.day);
        const maximumDay = new Date(year, month + 1, 0);
        while (true) {
          if (incomeDay > maximumDay) {
            break;
          }

          if (incomeDay.getFullYear() !== year || incomeDay.getMonth() !== month) {
            incomeDay.setDate(incomeDay.getDate() + 14);
            continue;
          }

          const newIncome = {
            uid: userId,
            year,
            month,
            day: incomeDay.getDate() > daysInMonth ? daysInMonth : incomeDay.getDate(),
            category: income.category,
            description: income.description,
            amount: income.amount,
            key: null,
          };

          await addToDb('income', newIncome, true);
          incomeDay.setDate(incomeDay.getDate() + 14);
        }

        return Promise.resolve();
      }

      if (income.frequency === 'twice-per-month') {
        await Promise.all(income.daysOfMonth.map(async (day) => {
          const newIncome = {
            uid: userId,
            year,
            month,
            day: day > daysInMonth ? daysInMonth : day,
            category: income.category,
            description: income.description,
            amount: income.amount,
            key: null,
          };

          await addToDb('income', newIncome, true);
          return Promise.resolve();
        }));

        return Promise.resolve();
      }

      return Promise.resolve();
    }));

    if (userId && isPayingUser()) {
      const incomeToAdd = await getAllFromIndex('income', 'year-month', year, month, userId);
      await bulkAddToDb('income', incomeToAdd);
    }

    loadIncome(true);
  }
});
