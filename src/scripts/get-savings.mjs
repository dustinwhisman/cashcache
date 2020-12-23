import { getAllFromIndex } from './db.mjs';

export const getSavings = async (year, month) => {
  const savings = await getAllFromIndex('savings', 'year-month', year, month);
  if (!savings?.length) {
    return null;
  }

  const total = savings.reduce((a, b) => a + b.amount, 0);
  const totalSavingsIndicator = document.querySelector('[data-total-savings]');
  totalSavingsIndicator.innerHTML = formatCurrency(total);

  let categories = savings.reduce((acc, fund) => {
    if (acc[fund.category]) {
      acc[fund.category].savings.push(fund);
    } else {
      acc[fund.category] = {
        name: fund.category,
        savings: [fund],
      };
    }

    return acc;
  }, {});

  return Object.keys(categories)
    .sort((a, b) => {
      const aTotal = categories[a].savings.reduce((a, b) => a + b.amount, 0);
      const bTotal = categories[b].savings.reduce((a, b) => a + b.amount, 0);
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
    const categoryTotal = category.savings.reduce((a, b) => a + b.amount, 0);
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
          ${category.savings
            .sort((a, b) => {
              if (a.amount < b.amount) {
                return 1;
              }

              if (a.amount > b.amount) {
                return -1;
              }

              return 0;
            })
            .map((fund) => {
              return `
                <div>
                  <div class="cluster small">
                    <div class="justify-content:space-between" style="align-items: flex-end">
                      <a href="/edit/savings?key=${fund.key}" style="max-width: 50%">
                        ${fund.description}
                      </a>
                      <p style="margin-inline-start: auto">
                        ${formatCurrency(fund.amount)}
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
};
