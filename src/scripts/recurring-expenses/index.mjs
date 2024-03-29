import { getAllFromObjectStore, getAllFromCloud } from '../db/index.mjs';
import { formatCurrency, uid, isPayingUser } from '../helpers/index.mjs';

let networkDataLoaded = false;

const formatDay = (number) => {
  switch(number) {
    case 1:
      return '1st';
    case 2:
      return '2nd';
    case 3:
      return '3rd';
    case 4:
      return '4th';
    case 5:
      return '5th';
    case 6:
      return '6th';
    case 7:
      return '7th';
    case 8:
      return '8th';
    case 9:
      return '9th';
    case 10:
      return '10th';
    case 11:
      return '11th';
    case 12:
      return '12th';
    case 13:
      return '13th';
    case 14:
      return '14th';
    case 15:
      return '15th';
    case 16:
      return '16th';
    case 17:
      return '17th';
    case 18:
      return '18th';
    case 19:
      return '19th';
    case 20:
      return '20th';
    case 21:
      return '21st';
    case 22:
      return '22nd';
    case 23:
      return '23th';
    case 24:
      return '24th';
    case 25:
      return '25th';
    case 26:
      return '26th';
    case 27:
      return '27th';
    case 28:
      return '28th';
    case 29:
      return '29th (or last day of month)';
    case 30:
      return '30th (or last day of month)';
    case 31:
      return '31st (or last day of month)';
  }
};

const formatMonthYear = (month, year) => {
  return new Date(year, month, 1).toLocaleString('en-US', {
    month: 'long',
    year: 'numeric',
  });
};

const formatMonthDay = (year, month, day) => {
  return new Date(year, month, day).toLocaleString('en-US', {
    month: 'long',
    day: 'numeric',
  });
};

const formatDate = (year, month, day) => {
  return new Date(year, month, day).toLocaleString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
};

const formatMultipleDays = (days) => {
  if (days.length === 2) {
    return `the ${formatDay(days[0])} and the ${formatDay(days[1])}`;
  }

  let template = '';
  for (let i = 0; i < days.length; i += 1) {
    if (i === days.length - 1) {
      template += `and the ${formatDay(days[i])}`;
    } else {
      template += `the ${formatDay(days[i])}, `;
    }
  }

  return template;
};

const displayRecurringExpenses = (expenses) => {
  const recurringExpensesBlock = document.querySelector('[data-recurring-expenses]');
  recurringExpensesBlock.innerHTML = '';
  const recurringExpenses = expenses.filter(expense => !expense.isDeleted);

  const noRecurringExpenses = document.querySelector('[data-no-recurring-expenses]');
  if (!recurringExpenses?.length) {
    noRecurringExpenses.removeAttribute('hidden');
    return;
  } else {
    noRecurringExpenses.setAttribute('hidden', true);
  }

  recurringExpenses
    .sort((a, b) => {
      if (a.amount < b.amount) {
        return 1;
      }

      if (a.amount > b.amount) {
        return -1;
      }

      return 0;
    })
    .forEach((expense) => {
      let descriptionTemplate;
      if (expense.frequency === '1-month') {
        descriptionTemplate = `Repeats every month on the ${formatDay(expense.day)}`;
      }

      if (expense.frequency === '3-month') {
        descriptionTemplate = `Repeats every 3 months on the ${formatDay(expense.day)}, beginning in ${formatMonthYear(expense.month, expense.year)}`;
      }

      if (expense.frequency === '6-month') {
        descriptionTemplate = `Repeats every 6 months on the ${formatDay(expense.day)}, beginning in ${formatMonthYear(expense.month, expense.year)}`;
      }

      if (expense.frequency === '1-year') {
        descriptionTemplate = `Repeats every year on ${formatMonthDay(expense.year, expense.month, expense.day)}`;
      }

      if (expense.frequency === '1-week') {
        descriptionTemplate = `Repeats every week, beginning on ${formatDate(expense.year, expense.month, expense.day)}`;
      }

      if (expense.frequency === '2-week') {
        descriptionTemplate = `Repeats every 2 weeks, beginning on ${formatDate(expense.year, expense.month, expense.day)}`;
      }

      if (expense.frequency === 'twice-per-month') {
        if (!expense.daysOfMonth?.length || expense.daysOfMonth.length < 2) {
          descriptionTemplate = `<span class="font-style:italic">This recurring expense is set up incorrectly.</span>`;
        } else {
          descriptionTemplate = `Repeats every month on ${formatMultipleDays(expense.daysOfMonth)}`;
        }
      }

      const template = `
        <div>
          <div class="cluster">
            <div class="justify-content:space-between" style="align-items: flex-end">
              <a href="/recurring-expenses/edit/?key=${expense.key}" style="max-width: 50%">
                ${expense.description}
              </a>
              <p style="margin-inline-start: auto">
                ${formatCurrency(expense.amount)}
              </p>
            </div>
          </div>
          <p class="small">
            ${descriptionTemplate}
          </p>
          <p class="small font-style:italic">
            ${expense.active ? 'Active' : 'Not currently active'}
          </p>
        </div>
      `;

      recurringExpensesBlock.innerHTML += template;
    });

  recurringExpensesBlock.removeAttribute('hidden');
};

(async () => {
  const userId = uid();
  if (!userId || !isPayingUser()) {
    const recurringExpensesContainer = document.querySelector('[data-recurring-expenses-container]');
    const paywallMessage = document.querySelector('[data-paywall-message]');

    recurringExpensesContainer.setAttribute('hidden', true);
    paywallMessage.removeAttribute('hidden');

    if (!userId) {
      const ctaLogIn = document.querySelector('[data-cta-log-in]');
      ctaLogIn.removeAttribute('hidden');
    } else {
      const ctaSubscribe = document.querySelector('[data-cta-subscribe]');
      ctaSubscribe.removeAttribute('hidden');
    }

    return;
  }

  const expenses = await getAllFromObjectStore('recurring-expenses', userId);

  if (!networkDataLoaded) {
    displayRecurringExpenses(expenses);
  }
})();

document.addEventListener('token-confirmed', async () => {
  if (uid() && isPayingUser()) {
    const expenses = await getAllFromCloud('recurring-expenses');
    networkDataLoaded = true;

    displayRecurringExpenses(expenses);
  }
});
