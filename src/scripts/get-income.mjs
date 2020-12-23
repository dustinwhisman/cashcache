import { getAllFromIndex } from './db.mjs';

export const getIncome = async (year, month) => {
  const income = await getAllFromIndex('income', 'year-month', year, month);
  if (!income?.length) {
    return null;
  }

  const total = income.reduce((a, b) => a + b.amount, 0);
  const totalIncomeIndicator = document.querySelector('[data-total-income]');
  totalIncomeIndicator.innerHTML = formatCurrency(total);

  const preferences = localStorage.getItem('income-preferences') || '{}';
  const {
    groupByCategory = true,
    sortBy = 'day',
    order = 'ascending'
  } = JSON.parse(preferences);

  const sortingFunction = (a, b) => {
    if (a[sortBy] < b[sortBy]) {
      return order === 'descending' ? 1 : -1;
    }

    if (a[sortBy] > b[sortBy]) {
      return order === 'descending' ? -1 : 1;
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
    }).join('');
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
      </div>
    `;
  }
};
