import { formatCurrency, formatDate, uid, isPayingUser } from '../helpers/index.mjs';

let recurringIncomeBlock = `
  <div data-manage-recurring-income hidden>
    <div data-copy-income hidden>
      <button type="button" style="width: 100%; margin-block-end: 1.5rem">
        Copy Recurring Income
      </button>
    </div>
    <a href="/recurring-income" class="small">
      Manage Recurring Income
    </a>
  </div>
`;

if (!uid()) {
  recurringIncomeBlock = `
    <div data-manage-recurring-income hidden>
      <p class="small font-style:italic">
        If you <a href="/login">sign up</a>, you can speed things up by setting
        up recurring income that you can copy at the beginning of each month.
      </p>
    </div>
  `;
} else if (!isPayingUser()) {
  recurringIncomeBlock = `
    <div data-manage-recurring-income hidden>
      <p class="small font-style:italic">
        If you <a href="/account">subscribe</a>, you can speed things up by
        setting up recurring income that you can copy at the beginning of each
        month.
      </p>
    </div>
  `;
}

const initialState = `
  <div data-no-income hidden>
    <p>
      You haven't tracked any income yet.
    </p>
  </div>
  ${recurringIncomeBlock}
`;

const generateBodyHtml = (income) => {
  if (!income?.length) {
    return null;
  }

  const preferences = localStorage.getItem('income-preferences') || '{}';
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
    let categories = income.reduce((acc, income) => {
      if (acc[income.category]) {
        acc[income.category].income.push(income);
      } else {
        acc[income.category] = {
          name: income.category,
          income: [income],
        };
      }

      return acc;
    }, {});

    return Object.keys(categories)
      .sort((a, b) => {
        const aTotal = categories[a].income.reduce((a, b) => a + b.amount, 0);
        const bTotal = categories[b].income.reduce((a, b) => a + b.amount, 0);
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
      const categoryTotal = category.income.reduce((a, b) => a + b.amount, 0);
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
            ${category.income
              .sort(sortingFunction)
              .map((income) => {
                return `
                  <div>
                    <p class="tiny font-style:italic">
                      ${formatDate(income.year, income.month, income.day)}
                    </p>
                    <div class="cluster small">
                      <div class="justify-content:space-between" style="align-items: flex-end">
                        <a href="/edit/income?key=${income.key}" style="max-width: 50%">
                          ${income.description}
                        </a>
                        <p style="margin-inline-start: auto">
                          ${formatCurrency(income.amount)}
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
      <a href="/recurring-income" class="small">
        Manage Recurring Income
      </a>
    </div>
  `;
  } else {
    return `
      <div class="stack" style="--stack-space: 0.75em">
        ${income
          .sort(sortingFunction)
          .map((income) => {
            return `
              <div>
                <p class="tiny font-style:italic">
                  ${formatDate(income.year, income.month, income.day)}
                </p>
                <div class="cluster small">
                  <div class="justify-content:space-between" style="align-items: flex-end">
                    <a href="/edit/income?key=${income.key}" style="max-width: 50%">
                      ${income.description}
                    </a>
                    <p style="margin-inline-start: auto">
                      ${formatCurrency(income.amount)}
                    </p>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        <div style="padding-block-end: 1rem">
          <a href="/recurring-income" class="small">
            Manage Recurring Income
          </a>
        </div>
      </div>
    `;
  }
};

export const displayIncome = (income, recurringIncome) => {
  const totalIncomeIndicator = document.querySelector('[data-total-income]');
  const incomeBody = document.querySelector('[data-income][data-section-body]');
  incomeBody.innerHTML = initialState;

  const total = income.reduce((a, b) => a + b.amount, 0);
  totalIncomeIndicator.innerHTML = formatCurrency(total);

  if (!income.length) {
    const manageRecurringIncomeDiv = document.querySelector('[data-manage-recurring-income]');
    manageRecurringIncomeDiv.removeAttribute('hidden');

    if (recurringIncome.length) {
      const copyIncomeDiv = document.querySelector('[data-copy-income]');
      copyIncomeDiv?.removeAttribute('hidden');
    }
    const noIncomeMessage = document.querySelector('[data-no-income]');
    noIncomeMessage.removeAttribute('hidden');
  }

  const incomeBlock = generateBodyHtml(income);
  if (incomeBlock == null) {
    return;
  }
  incomeBody.innerHTML = incomeBlock;
};
