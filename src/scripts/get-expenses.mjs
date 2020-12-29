const initialState = `
  <div data-no-expenses hidden>
    <p>
      You haven't tracked any expenses yet.
    </p>
  </div>
  <div data-manage-recurring-expenses hidden>
    <div data-copy-expenses hidden>
      <button type="button" style="width: 100%; margin-block-end: 1.5rem">
        Copy Recurring Expenses
      </button>
    </div>
    <a href="/recurring-expenses" class="small">
      View Recurring Expenses
    </a>
  </div>
`;

const generateBodyHtml = (expenses) => {
  if (!expenses?.length) {
    return null;
  }

  const preferences = localStorage.getItem('expenses-preferences') || '{}';
  const {
    groupByCategory = true,
    sortBy = 'amount',
    order = 'descending'
  } = JSON.parse(preferences);

  const sortingFunction = (a, b) => {
    if (a[sortBy] < b[sortBy]) {
      return order === 'descending' ? 1 : -1;
    }

    if (a[sortBy] > b[sortBy]) {
      return order === 'descending' ? -1 : 1;
    }

    if (sortBy === 'amount') {
      if (a.day < b.day) {
        return -1;
      }

      if (a.day > b.day) {
        return 1;
      }
    } else {
      if (a.amount < b.amount) {
        return 1;
      }

      if (a.amount > b.amount) {
        return -1;
      }
    }

    return 0;
  };

  if (groupByCategory) {
    let categories = expenses.reduce((acc, expense) => {
      if (acc[expense.category]) {
        acc[expense.category].expenses.push(expense);
      } else {
        acc[expense.category] = {
          name: expense.category,
          expenses: [expense],
        };
      }

      return acc;
    }, {});

    return Object.keys(categories)
      .sort((a, b) => {
        const aTotal = categories[a].expenses.reduce((a, b) => a + b.amount, 0);
        const bTotal = categories[b].expenses.reduce((a, b) => a + b.amount, 0);
        if (aTotal < bTotal) {
          return 1;
        }

        if (aTotal > bTotal) {
          return -1;
        }

        return 0;
      })
    .map((key) => {
      const category = categories[key];
      const categoryTotal = category.expenses.reduce((a, b) => a + b.amount, 0);
      return `
        <div>
          <div class="cluster heading">
            <div class="justify-content:space-between" style="align-items: flex-end">
              <h3 class="h6" style="max-width: 50%">
                ${category.name}
              </h3>
              <p class="h6" style="margin-inline-start: auto">
                ${formatCurrency(categoryTotal)}
              </p>
            </div>
          </div>
          <div class="stack" style="--stack-space: 0.75em">
            ${category.expenses
              .sort(sortingFunction)
              .map((expense) => {
                return `
                  <div>
                    <p class="tiny font-style:italic">
                      ${formatDate(expense.year, expense.month, expense.day)}
                    </p>
                    <div class="cluster small">
                      <div class="justify-content:space-between" style="align-items: flex-end">
                        <a href="/edit/expense?key=${expense.key}" style="max-width: 50%">
                          ${expense.description}
                        </a>
                        <p style="margin-inline-start: auto">
                          ${formatCurrency(expense.amount)}
                        </p>
                      </div>
                    </div>
                  </div>
                `;
              }).join('')}
          </div>
        </div>
      `;
    }).join('') + `
      <div style="padding-block-end: 1rem">
        <a href="/recurring-expenses" class="small">
          View Recurring Expenses
        </a>
      </div>
    `;
  } else {
    return `
      <div class="stack" style="--stack-space: 0.75em">
        ${expenses
          .sort(sortingFunction)
          .map((expense) => {
            return `
              <div>
                <p class="tiny font-style:italic">
                  ${formatDate(expense.year, expense.month, expense.day)}
                </p>
                <div class="cluster small">
                  <div class="justify-content:space-between" style="align-items: flex-end">
                    <a href="/edit/expense?key=${expense.key}" style="max-width: 50%">
                      ${expense.description}
                    </a>
                    <p style="margin-inline-start: auto">
                      ${formatCurrency(expense.amount)}
                    </p>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        <div style="padding-block-end: 1rem">
          <a href="/recurring-expenses" class="small">
            View Recurring Expenses
          </a>
        </div>
      </div>
      `;
  }
};

export const displayExpenses = (expenses, lastMonthsExpenses) => {
  const totalExpensesIndicator = document.querySelector('[data-total-expenses]');
  const expensesBody = document.querySelector('[data-expenses][data-section-body]');
  expensesBody.innerHTML = initialState;

  const total = expenses.reduce((a, b) => a + b.amount, 0);
  totalExpensesIndicator.innerHTML = formatCurrency(total);

  if (!expenses.length) {
    const manageRecurringExpensesDiv = document.querySelector('[data-manage-recurring-expenses]');
    manageRecurringExpensesDiv.removeAttribute('hidden');

    if (lastMonthsExpenses.length) {
      const copyExpensesDiv = document.querySelector('[data-copy-expenses]');
      copyExpensesDiv.removeAttribute('hidden');
    }

    const noExpensesMessage = document.querySelector('[data-no-expenses]');
    noExpensesMessage.removeAttribute('hidden');
  }

  const expensesBlock = generateBodyHtml(expenses);
  if (expensesBlock == null) {
    return;
  }
  expensesBody.innerHTML = expensesBlock;
};
