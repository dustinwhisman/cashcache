import { getAllFromIndex, getAllFromObjectStore, addToDb, bulkAddToDb } from './db.mjs';
import { getExpenses } from './get-expenses.mjs';
import { getIncome } from './get-income.mjs';
import { getSavings } from './get-savings.mjs';
import { getDebt } from './get-debt.mjs';

let lastMonth = month - 1;
let lastMonthYear = year;
if (lastMonth < 0) {
  lastMonth = 11;
  lastMonthYear -= 1;
}

const loadExpenses = async () => {
  const expensesBody = document.querySelector('[data-expenses][data-section-body]');
  const expensesBlock = await getExpenses(year, month);

  if (expensesBlock == null) {
    const manageRecurringExpensesDiv = document.querySelector('[data-manage-recurring-expenses]');
    manageRecurringExpensesDiv.removeAttribute('hidden');
    const lastMonthsExpenses = await getAllFromIndex('expenses', 'year-month', lastMonthYear, lastMonth, appUser?.uid);
    if (lastMonthsExpenses.length) {
      const copyExpensesDiv = document.querySelector('[data-copy-expenses]');
      copyExpensesDiv.removeAttribute('hidden');
    }
    const noExpensesMessage = document.querySelector('[data-no-expenses]');
    noExpensesMessage.removeAttribute('hidden');
    return;
  }

  expensesBody.innerHTML = expensesBlock;
};

loadExpenses();

const loadIncome = async () => {
  const incomeBody = document.querySelector('[data-income][data-section-body]');
  const incomeBlock = await getIncome(year, month);

  if (incomeBlock == null) {
    const manageRecurringIncomeDiv = document.querySelector('[data-manage-recurring-income]');
    manageRecurringIncomeDiv.removeAttribute('hidden');
    const lastMonthsIncome = await getAllFromIndex('income', 'year-month', lastMonthYear, lastMonth, appUser?.uid);
    if (lastMonthsIncome.length) {
      const copyIncomeDiv = document.querySelector('[data-copy-income]');
      copyIncomeDiv.removeAttribute('hidden');
    }
    const noIncomeMessage = document.querySelector('[data-no-income]');
    noIncomeMessage.removeAttribute('hidden');
    return;
  }

  incomeBody.innerHTML = incomeBlock;
};

loadIncome();

const loadSavings = async () => {
  const savingsBody = document.querySelector('[data-savings][data-section-body]');
  const savingsBlock = await getSavings(year, month);

  if (savingsBlock == null) {
    const lastMonthsSavings = await getAllFromIndex('savings', 'year-month', lastMonthYear, lastMonth, appUser?.uid);
    if (lastMonthsSavings.length) {
      const copySavingsDiv = document.querySelector('[data-copy-savings]');
      copySavingsDiv.removeAttribute('hidden');
    }
    const noSavingsMessage = document.querySelector('[data-no-savings]');
    noSavingsMessage.removeAttribute('hidden');
    return;
  }

  savingsBody.innerHTML = savingsBlock;
};

loadSavings();

const loadDebt = async () => {
  const debtBody = document.querySelector('[data-debt][data-section-body]');
  const debtBlock = await getDebt(year, month);

  if (debtBlock == null) {
    const lastMonthsDebt = await getAllFromIndex('debt', 'year-month', lastMonthYear, lastMonth, appUser?.uid);
    if (lastMonthsDebt.length) {
      const copyDebtDiv = document.querySelector('[data-copy-debt]');
      copyDebtDiv.removeAttribute('hidden');
    }
    const noDebtMessage = document.querySelector('[data-no-debt]');
    noDebtMessage.removeAttribute('hidden');
    return;
  }

  debtBody.innerHTML = debtBlock;
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

    if (appUser?.uid) {
      const savingsToAdd = await getAllFromIndex('savings', 'year-month', year, month, appUser?.uid);
      await bulkAddToDb('savings', savingsToAdd);
    }

    loadSavings();
  }

  if (event.target.matches('[data-copy-debt] button')) {
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

    if (appUser?.uid) {
      const debtToAdd = await getAllFromIndex('debt', 'year-month', year, month, appUser?.uid);
      await bulkAddToDb('debt', debtToAdd);
    }

    loadDebt();
  }

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  if (event.target.matches('[data-copy-expenses] button')) {
    const recurringExpenses = await getAllFromObjectStore('recurring-expenses', appUser?.uid);
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

    if (appUser?.uid) {
      const expensesToAdd = await getAllFromIndex('expenses', 'year-month', year, month, appUser?.uid);
      await bulkAddToDb('expenses', expensesToAdd);
    }

    loadExpenses();
  }

  if (event.target.matches('[data-copy-income] button')) {
    const recurringIncome = await getAllFromObjectStore('recurring-income', appUser?.uid);
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

    if (appUser?.uid) {
      const incomeToAdd = await getAllFromIndex('income', 'year-month', year, month, appUser?.uid);
      await bulkAddToDb('income', incomeToAdd);
    }

    loadIncome();
  }
});
