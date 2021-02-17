import { formatCurrency } from '../helpers/index.mjs';

let copyDebtBlock = `
  <div data-copy-debt hidden>
    <button type="button" style="width: 100%">
      Copy Last Month's Debt
    </button>
  </div>
`;

if (!appUser?.uid) {
  copyDebtBlock = `
    <div data-copy-debt hidden>
      <p class="small font-style:italic">
        If you <a href="/login">sign up</a>, you can speed things up by copying
        your debt from last month.
      </p>
    </div>
  `;
} else if (!isPayingUser) {
  copyDebtBlock = `
    <div data-copy-debt hidden>
      <p class="small font-style:italic">
        If you <a href="/account">subscribe</a>, you can speed things up by
        copying your debt from last month.
      </p>
    </div>
  `;
}

const initialState = `
  <div data-no-debt hidden>
    <p>
      You haven't tracked any debt yet.
    </p>
  </div>
  ${copyDebtBlock}
`;

const generateBodyHtml = (debts) => {
  if (!debts?.length) {
    return null;
  }

  const preferences = localStorage.getItem('debt-preferences') || '{}';
  const { method = 'avalanche' } = JSON.parse(preferences);

  if (method === 'avalanche') {
    return `
      <div class="stack" style="--stack-space: 0.75em">
        ${debts
          .sort((a, b) => {
            if (a.interestRate < b.interestRate) {
              return 1;
            }

            if (a.interestRate > b.interestRate) {
              return -1;
            }

            return 0;
          })
          .map((loan, index) => {
            let priorityHint = '';
            if (debts.length > 1 && index === 0) {
              priorityHint = `
                <div>
                  <p class="tiny font-style:italic">
                    The best way to pay off debt is to pay the minimum on all
                    balances, then throw as much money as you can at the loan with the
                    highest interest rate. In your case, that's your
                    ${loan.description}.
                  </p>
                </div>
              `;
            }

            return `
              ${priorityHint}
              <div>
                <div class="cluster small">
                  <div class="justify-content:space-between" style="align-items: flex-end">
                    <a href="/edit/debt?key=${loan.key}" style="max-width: 50%">
                      ${loan.description}
                    </a>
                    <p style="margin-inline-start: auto">
                      ${formatCurrency(loan.amount)}
                    </p>
                  </div>
                </div>
                <div class="cluster tiny">
                  <div class="justify-content:space-between" style="align-items: flex-end">
                    <p style="max-width: 50%">
                      ${loan.interestRate}%
                    </p>
                    <p style="margin-inline-start: auto">
                      ${formatCurrency(loan.minimumPayment)}
                    </p>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
      </div>
    `;
  } else {
    return `
      <div class="stack" style="--stack-space: 0.75em">
        ${debts
          .sort((a, b) => {
            if (a.amount < b.amount) {
              return -1;
            }

            if (a.amount > b.amount) {
              return 1;
            }

            return 0;
          })
          .map((loan, index) => {
            let priorityHint = '';
            if (debts.length > 1 && index === 0) {
              priorityHint = `
                <div>
                  <p class="tiny font-style:italic">
                    A simple way to pay off debt is to pay the minimum on all
                    balances, then throw as much money as you can at the loan with
                    the smallest balance. In your case, that's your
                    ${loan.description}.
                  </p>
                </div>
              `;
            }

            return `
              ${priorityHint}
              <div>
                <div class="cluster small">
                  <div class="justify-content:space-between" style="align-items: flex-end">
                    <a href="/edit/debt?key=${loan.key}" style="max-width: 50%">
                      ${loan.description}
                    </a>
                    <p style="margin-inline-start: auto">
                      ${formatCurrency(loan.amount)}
                    </p>
                  </div>
                </div>
                <div class="cluster tiny">
                  <div class="justify-content:space-between" style="align-items: flex-end">
                    <p style="max-width: 50%">
                      ${loan.interestRate}%
                    </p>
                    <p style="margin-inline-start: auto">
                      ${formatCurrency(loan.minimumPayment)}
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

export const displayDebt = (debts, lastMonthsDebt) => {
  const totalDebtIndicator = document.querySelector('[data-total-debt]');
  const debtBody = document.querySelector('[data-debt][data-section-body]');
  debtBody.innerHTML = initialState;

  const total = debts.reduce((a, b) => a + b.amount, 0);
  totalDebtIndicator.innerHTML = formatCurrency(total);

  if (!debts.length) {
    if (lastMonthsDebt.length) {
      const copyDebtDiv = document.querySelector('[data-copy-debt]');
      copyDebtDiv.removeAttribute('hidden');
    }

    const noDebtMessage = document.querySelector('[data-no-debt]');
    noDebtMessage.removeAttribute('hidden');
  }

  const debtBlock = generateBodyHtml(debts);
  if (debtBlock == null) {
    return;
  }
  debtBody.innerHTML = debtBlock;
};
