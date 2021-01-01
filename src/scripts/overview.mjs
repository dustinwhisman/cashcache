import { getAllFromIndex, getAllFromCloudIndex, getAllFromObjectStore, getAllFromCloud, addToDb, bulkAddToDb } from './db.mjs';
import { displayExpenses } from './get-expenses.mjs';
import { displayIncome } from './get-income.mjs';
import { displaySavings } from './get-savings.mjs';
import { displayDebt } from './get-debt.mjs';

let lastMonth = month - 1;
let lastMonthYear = year;
if (lastMonth < 0) {
  lastMonth = 11;
  lastMonthYear -= 1;
}

const loadExpenses = async () => {
  let expenses = await getAllFromIndex('expenses', 'year-month', year, month, appUser?.uid);
  let lastMonthsExpenses = await getAllFromIndex('expenses', 'year-month', lastMonthYear, lastMonth, appUser?.uid);
  displayExpenses(expenses, lastMonthsExpenses);

  if (appUser?.uid && isPayingUser) {
    expenses = await getAllFromCloudIndex('expenses', year, month, appUser?.uid);
    lastMonthsExpenses = await getAllFromCloudIndex('expenses', lastMonthYear, lastMonth, appUser?.uid);
    displayExpenses(expenses, lastMonthsExpenses);
  }
};

loadExpenses();

const loadIncome = async () => {
  let income = await getAllFromIndex('income', 'year-month', year, month, appUser?.uid);
  let lastMonthsIncome = await getAllFromIndex('income', 'year-month', lastMonthYear, lastMonth, appUser?.uid);
  displayIncome(income, lastMonthsIncome);

  if (appUser?.uid && isPayingUser) {
    income = await getAllFromCloudIndex('income', year, month, appUser?.uid);
    lastMonthsIncome = await getAllFromCloudIndex('income', lastMonthYear, lastMonth, appUser?.uid);
    displayIncome(income, lastMonthsIncome);
  }
};

loadIncome();

const loadSavings = async () => {
  let savings = await getAllFromIndex('savings', 'year-month', year, month, appUser?.uid);
  let lastMonthsSavings = await getAllFromIndex('savings', 'year-month', lastMonthYear, lastMonth, appUser?.uid);
  displaySavings(savings, lastMonthsSavings);

  if (appUser?.uid && isPayingUser) {
    savings = await getAllFromCloudIndex('savings', year, month, appUser?.uid);
    lastMonthsSavings = await getAllFromCloudIndex('savings', lastMonthYear, lastMonth, appUser?.uid);
    displaySavings(savings, lastMonthsSavings);
  }
};

loadSavings();

const loadDebt = async () => {
  let debt = await getAllFromIndex('debt', 'year-month', year, month, appUser?.uid);
  let lastMonthsDebt = await getAllFromIndex('debt', 'year-month', lastMonthYear, lastMonth, appUser?.uid);
  displayDebt(debt, lastMonthsDebt);

  if (appUser?.uid && isPayingUser) {
    debt = await getAllFromCloudIndex('debt', year, month, appUser?.uid);
    lastMonthsDebt = await getAllFromCloudIndex('debt', lastMonthYear, lastMonth, appUser?.uid);
    displayDebt(debt, lastMonthsDebt);
  }
};

loadDebt();

const isMonthOnInterval = (startingMonth, currentMonth, interval) => {
  if ((Math.abs(startingMonth - currentMonth) % interval) !== 0) {
    return false;
  }

  return true;
};

document.addEventListener('click', async (event) => {
  if (event.target.matches('[data-copy-savings] button')) {
    event.target.innerHTML = 'Copying...';
    const lastMonthsSavings = await getAllFromIndex('savings', 'year-month', lastMonthYear, lastMonth, appUser?.uid);
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

    if (appUser?.uid && isPayingUser) {
      const savingsToAdd = await getAllFromIndex('savings', 'year-month', year, month, appUser?.uid);
      await bulkAddToDb('savings', savingsToAdd);
    }

    loadSavings();
  }

  if (event.target.matches('[data-copy-debt] button')) {
    event.target.innerHTML = 'Copying...';
    const lastMonthsDebt = await getAllFromIndex('debt', 'year-month', lastMonthYear, lastMonth, appUser?.uid);
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

    if (appUser?.uid && isPayingUser) {
      const debtToAdd = await getAllFromIndex('debt', 'year-month', year, month, appUser?.uid);
      await bulkAddToDb('debt', debtToAdd);
    }

    loadDebt();
  }

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  if (event.target.matches('[data-copy-expenses] button')) {
    event.target.innerHTML = 'Copying...';
    let recurringExpenses = [];

    if (appUser?.uid && isPayingUser) {
      recurringExpenses = await getAllFromCloud('recurring-expenses', appUser?.uid);
    } else {
      recurringExpenses = await getAllFromObjectStore('recurring-expenses', appUser?.uid);
    }

    await Promise.all(recurringExpenses.map(async (expense) => {
      if (expense.isDeleted || !expense.active) {
        return Promise.resolve();
      }

      if (expense.frequency === '1-month') {
        const newExpense = {
          uid: appUser?.uid,
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
          uid: appUser?.uid,
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
          uid: appUser?.uid,
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
          uid: appUser?.uid,
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
            uid: appUser?.uid,
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
            uid: appUser?.uid,
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
            uid: appUser?.uid,
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

    if (appUser?.uid && isPayingUser) {
      const expensesToAdd = await getAllFromIndex('expenses', 'year-month', year, month, appUser?.uid);
      await bulkAddToDb('expenses', expensesToAdd);
    }

    loadExpenses();
  }

  if (event.target.matches('[data-copy-income] button')) {
    event.target.innerHTML = 'Copying...';
    let recurringIncome = [];

    if (appUser?.uid && isPayingUser) {
      recurringIncome = await getAllFromObjectStore('recurring-income', appUser?.uid);
    } else {
      recurringIncome = await getAllFromCloud('recurring-income', appUser?.uid);
    }

    await Promise.all(recurringIncome.map(async (income) => {
      if (income.isDeleted || !income.active) {
        return Promise.resolve();
      }

      if (income.frequency === '1-month') {
        const newIncome = {
          uid: appUser?.uid,
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
          uid: appUser?.uid,
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
          uid: appUser?.uid,
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
          uid: appUser?.uid,
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
            uid: appUser?.uid,
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
            uid: appUser?.uid,
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
            uid: appUser?.uid,
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

    if (appUser?.uid && isPayingUser) {
      const incomeToAdd = await getAllFromIndex('income', 'year-month', year, month, appUser?.uid);
      await bulkAddToDb('income', incomeToAdd);
    }

    loadIncome();
  }
});
