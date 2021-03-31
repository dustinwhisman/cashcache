import { formatMonthString, sortingFunction, getAllMonthlyTotalsFromCache, getAllMonthlyTotalsFromCloud } from './helpers.mjs';
import { formatCurrency, uid, isPayingUser } from '../helpers/index.mjs';

const getMonthlyProgress = (monthlyTotalExpenses, monthlyTotalIncome, monthlyTotalSavings) => {
  const monthlyProgress = {};
  monthlyTotalExpenses.slice(0, -1).forEach((month) => {
    if (monthlyProgress[formatMonthString(month.year, month.month)]) {
      monthlyProgress[formatMonthString(month.year, month.month)].expenses = month.total;
    } else {
      monthlyProgress[formatMonthString(month.year, month.month)] = {
        expenses: month.total,
        year: month.year,
        month: month.month,
      };
    }
  });

  monthlyTotalIncome.slice(0, -1).forEach((month) => {
    if (monthlyProgress[formatMonthString(month.year, month.month)]) {
      monthlyProgress[formatMonthString(month.year, month.month)].income = month.total;
    } else {
      monthlyProgress[formatMonthString(month.year, month.month)] = {
        income: month.total,
        year: month.year,
        month: month.month,
      };
    }
  });

  monthlyTotalSavings.slice(0, -1).forEach((month) => {
    if (monthlyProgress[formatMonthString(month.year, month.month)]) {
      monthlyProgress[formatMonthString(month.year, month.month)].safeAmount = month.total / 25 / 12;
    } else {
      monthlyProgress[formatMonthString(month.year, month.month)] = {
        safeAmount: month.total / 25 / 12,
        year: month.year,
        month: month.month,
      };
    }
  });

  const progress = Object.keys(monthlyProgress)
    .map((key) => ({
      ...monthlyProgress[key],
      label: key,
    }))
    .sort(sortingFunction);

  return progress;
};

const getHighestDollarAmount = (monthlyTotalExpenses, monthlyTotalIncome, monthlyTotalSavings) => {
  const highestDollarAmount = Math.ceil(
    Math.max(...[
      ...monthlyTotalExpenses.map(e => e.total),
      ...monthlyTotalIncome.map(i => i.total),
      ...monthlyTotalSavings.map(s => s.total / 25)
    ]) / 1000
  ) * 1000;

  return highestDollarAmount;
}

const drawChart = (progress, highestDollarAmount) => {
  const progressChartBlock = document.querySelector('[data-chart]');
  if (!Object.keys(progress).length) {
    progressChartBlock.innerHTML = `
      <p>
        We don't have enough data to chart your progress right now. Once you
        have expenses, income, and savings data for one month (other than the
        current one), we'll be able to start plotting some points.
      </p>
      <p>
        You can come back next month, or you can add some historical data for
        past months. You can also bulk upload data via CSV files from the
        <a href="/settings">settings</a> page, which may speed things up.
      </p>
    `;

    return;
  }

  const yAxisLabels = [];
  const yAxisInterval = Math.ceil(highestDollarAmount / 10000);
  for (let i = 0; i <= highestDollarAmount / 1000; i += 1) {
    if (i % Math.ceil(yAxisInterval) === 0) {
      yAxisLabels.push(`
        <text x="180" y="${1110 - (i * 100)}" style="text-anchor: end; font-size: 1.5rem" fill="var(--text-color)">
          ${formatCurrency(i * 1000).replace('.00', '')}
        </text>
      `);
    }
  }

  const xAxisLabels = [];
  const xAxisInterval = Math.ceil(progress.length / 12);
  for (let i = 0; i < progress.length; i += 1) {
    if (i % Math.ceil(xAxisInterval) === 0) {
      xAxisLabels.push(`
        <text x="${240 + (i * 1000 / progress.length)}" y="1120" style="text-anchor: end; font-size: 1.5rem" fill="var(--text-color)" transform="rotate(-45, ${240 + (i * 1000 / progress.length)}, 1160)">
          ${progress[i].label}
        </text>
      `);
    }
  }

  const expensesPoints = progress.map((month, index) => {
    const x = 200 + (index * 1000 / progress.length);
    const y = 1100 - (month.expenses / (highestDollarAmount / 1000));

    return `${x},${y}`;
  }).join(' ');

  const incomePoints = progress.map((month, index) => {
    const x = 200 + (index * 1000 / progress.length);
    const y = 1100 - (month.income / (highestDollarAmount / 1000));

    return `${x},${y}`;
  }).join(' ');

  const safeAmountPoints = progress.map((month, index) => {
    const x = 200 + (index * 1000 / progress.length);
    const y = 1100 - (month.safeAmount / (highestDollarAmount / 1000));

    return `${x},${y}`;
  }).join(' ');

  const svgTemplate = `
    <svg viewbox="0 0 1300 1300" aria-hidden="true" focusable="false">
      <g>
        <circle cx="200" cy="40" r="10" fill="var(--red)"></circle>
        <text x="220" y="50" style="font-size: 1.5rem" fill="var(--text-color)">
          Expenses
        </text>
        <rect x="407" y="32" width="16" height="16" fill="var(--blue)"></rect>
        <text x="435" y="50" style="font-size: 1.5rem" fill="var(--text-color)">
          Income
        </text>
        <polygon points="590 48, 600 28, 610 48" fill="var(--yellow)"></polygon>
        <text x="620" y="50" style="font-size: 1.5rem" fill="var(--text-color)">
          Safe Withdrawal Amount
        </text>
      </g>
      <g>
        <line x1="200" x2="200" y1="1100" y2="100" stroke-width="2" stroke="var(--text-color)"></line>
        ${yAxisLabels.join('')}
      </g>
      <g>
        <line x1="200" x2="1200" y1="1100" y2="1100" stroke-width="2" stroke="var(--text-color)"></line>
        ${xAxisLabels.join('')}
      </g>
      <g>
        ${progress.map((month, index) => {
          const x = 200 + (index * 1000 / progress.length);
          const expenseY = 1100 - (month.expenses / (highestDollarAmount / 1000));
          const incomeY = 1100 - (month.income / (highestDollarAmount / 1000));
          const safeAmountY = 1100 - (month.safeAmount / (highestDollarAmount / 1000));

          return `
            <circle cx="${x}" cy="${expenseY}" r="5" fill="var(--red)"></circle>
            <rect x="${x - 4}" y="${incomeY - 4}" width="8" height="8" fill="var(--blue)"></rect>
            <polygon points="${x - 5} ${safeAmountY + 4}, ${x} ${safeAmountY - 6}, ${x + 5} ${safeAmountY + 4}" fill="var(--yellow)"></polygon>
          `;
        }).join('')}
      </g>
      <g>
        <polyline points="${expensesPoints}" fill="none" stroke="var(--red)" stroke-width="2"></polyline>
        <polyline points="${incomePoints}" fill="none" stroke="var(--blue)" stroke-width="2"></polyline>
        <polyline points="${safeAmountPoints}" fill="none" stroke="var(--yellow)" stroke-width="2"></polyline>
      </g>
    </svg>
  `;

  progressChartBlock.innerHTML = svgTemplate;
};

const drawTable = (progress) => {
  if (!Object.keys(progress).length) {
    return;
  }

  const tableBlock = document.querySelector('[data-table]');

  const tableTemplate = `
    <details>
      <summary>
        See the numbers
      </summary>
      <table class="small">
        <thead>
          <tr>
            <th class="text-align:right">
              Month
            </th>
            <th class="text-align:right">
              Expenses
            </th>
            <th class="text-align:right">
              Income
            </th>
            <th class="text-align:right">
              Safe Withdrawal Amount
            </th>
          </tr>
        </thead>
        <tbody>
          ${progress.map((month) => {
            return `
              <tr>
                <th class="text-align:right">
                  ${month.label}
                </th>
                <td class="text-align:right">
                  ${formatCurrency(month.expenses)}
                </td>
                <td class="text-align:right">
                  ${formatCurrency(month.income)}
                </td>
                <td class="text-align:right">
                  ${formatCurrency(month.safeAmount)}
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </details>
  `;

  tableBlock.innerHTML = tableTemplate;
};

(async () => {
  if (!uid() || !isPayingUser()) {
    const notSubscribed = document.querySelector('[data-not-subscribed]');
    const isSubscribed = document.querySelector('[data-is-subscribed]');
    notSubscribed.removeAttribute('hidden');
    isSubscribed.setAttribute('hidden', true);
    return;
  }

  let isNetworkDataLoaded = false;

  Promise.all([
    getAllMonthlyTotalsFromCache('expenses'),
    getAllMonthlyTotalsFromCache('income'),
    getAllMonthlyTotalsFromCache('savings'),
  ])
    .then((values) => {
      if (!isNetworkDataLoaded) {
        const [ monthlyTotalExpenses, monthlyTotalIncome, monthlyTotalSavings ] = values;
        const monthlyProgress = getMonthlyProgress(monthlyTotalExpenses, monthlyTotalIncome, monthlyTotalSavings);
        const highestDollarAmount = getHighestDollarAmount(monthlyTotalExpenses, monthlyTotalIncome, monthlyTotalSavings);
        drawChart(monthlyProgress, highestDollarAmount);
        drawTable(monthlyProgress);
      }
    })
    .catch(() => {
      // swallow error: the cache doesn't matter that much
    });

    Promise.all([
      getAllMonthlyTotalsFromCloud('expenses'),
      getAllMonthlyTotalsFromCloud('income'),
      getAllMonthlyTotalsFromCloud('savings'),
    ])
      .then((values) => {
        isNetworkDataLoaded = true;
        const [ monthlyTotalExpenses, monthlyTotalIncome, monthlyTotalSavings ] = values;
        const monthlyProgress = getMonthlyProgress(monthlyTotalExpenses, monthlyTotalIncome, monthlyTotalSavings);
        const highestDollarAmount = getHighestDollarAmount(monthlyTotalExpenses, monthlyTotalIncome, monthlyTotalSavings);
        drawChart(monthlyProgress, highestDollarAmount);
        drawTable(monthlyProgress);
      })
      .catch(() => {
        // swallow error: the cache doesn't matter that much
      });
  })();
