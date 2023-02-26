import { formatCurrency, uid, isPayingUser } from '../helpers/index.mjs';

let copySavingsBlock = `
  <div data-copy-savings hidden>
    <button type="button" style="width: 100%">
      Copy Last Month's Savings
    </button>
  </div>
`;

if (!uid()) {
  copySavingsBlock = `
    <div data-copy-savings hidden>
      <p class="small font-style:italic">
        If you <a href="/login/">sign up</a>, you can speed things up by copying
        your savings from last month.
      </p>
    </div>
  `;
} else if (!isPayingUser()) {
  copySavingsBlock = `
    <div data-copy-savings hidden>
      <p class="small font-style:italic">
        If you <a href="/account/">subscribe</a>, you can speed things up by
        copying your savings from last month.
      </p>
    </div>
  `;
}

const initialState = `
  <div data-no-savings hidden>
    <p>
      You haven't tracked any savings yet.
    </p>
  </div>
  ${copySavingsBlock}
`;

const generateBodyHtml = (savings) => {
  if (!savings?.length) {
    return null;
  }

  const preferences = localStorage.getItem('savings-preferences') || '{}';
  const {
    groupByCategory = true,
    order = 'descending'
  } = JSON.parse(preferences);

  const sortingFunction = (a, b) => {
    if (a.amount < b.amount) {
      return order === 'descending' ? 1 : -1;
    }

    if (a.amount > b.amount) {
      return order === 'descending' ? -1 : 1;
    }

    return 0;
  };

  if (groupByCategory) {
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
              .sort(sortingFunction)
              .map((fund) => {
                return `
                  <div>
                    <div class="cluster small">
                      <div class="justify-content:space-between" style="align-items: flex-end">
                        <a href="/edit/savings/?key=${fund.key}" style="max-width: 50%">
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
  } else {
    return `
      <div class="stack" style="--stack-space: 0.75em">
        ${savings
          .sort(sortingFunction)
          .map((fund) => {
            return `
              <div>
                <div class="cluster small">
                  <div class="justify-content:space-between" style="align-items: flex-end">
                    <a href="/edit/savings/?key=${fund.key}" style="max-width: 50%">
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
    `;
  }
};

export const displaySavings = (savings, lastMonthsSavings) => {
  const totalSavingsIndicator = document.querySelector('[data-total-savings]');
  const savingsBody = document.querySelector('[data-savings][data-section-body]');
  savingsBody.innerHTML = initialState;

  const total = savings.reduce((a, b) => a + b.amount, 0);
  totalSavingsIndicator.innerHTML = formatCurrency(total);

  if (!savings.length) {
    if (lastMonthsSavings.length) {
      const copySavingsDiv = document.querySelector('[data-copy-savings]');
      copySavingsDiv.removeAttribute('hidden');
    }

    const noSavingsMessage = document.querySelector('[data-no-savings]');
    noSavingsMessage.removeAttribute('hidden');
  }

  const savingsBlock = generateBodyHtml(savings);
  if (savingsBlock == null) {
    return;
  }
  savingsBody.innerHTML = savingsBlock;
};
