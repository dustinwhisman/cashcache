import { formatMonthString, sortingFunction, getAllMonthlyTotalsFromCache, getAllMonthlyTotalsFromCloud } from './helpers.mjs';
import { formatCurrency, uid, isPayingUser } from '../helpers/index.mjs';

const getMonthlyProgress = (monthlyTotalExpenses, monthlyTotalIncome, monthlyTotalSavings) => {
  const monthlyProgress = {};
  monthlyTotalExpenses.forEach((month) => {
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

  monthlyTotalIncome.forEach((month) => {
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

  monthlyTotalSavings.forEach((month) => {
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
  const gridLines = [];
  const yAxisInterval = Math.ceil(highestDollarAmount / 10000);
  for (let i = 0; i <= highestDollarAmount / 1000; i += 1) {
    if (i % Math.ceil(yAxisInterval) === 0) {
      yAxisLabels.push(`
        <text x="-20" y="${1010 - (i * 100)}" style="text-anchor: end" fill="var(--text-color)">
          ${formatCurrency(i * 1000).replace('.00', '')}
        </text>
      `);
      gridLines.push(`
        <polyline points="0 ${1000 - (i * 100)}, 1500 ${1000 - (i * 100)}" fill="none" stroke="var(--text-color)" stroke-width="2" style="opacity: 0.25"></polyline>
      `);
    }
  }

  const xAxisLabels = [];
  const xAxisInterval = Math.ceil(progress.length / 12);
  for (let i = 0; i < progress.length; i += 1) {
    if (i % Math.ceil(xAxisInterval) === 0) {
      xAxisLabels.push(`
        <text x="${40 + (i * 1500 / progress.length)}" y="1020" style="text-anchor: end" fill="var(--text-color)" transform="rotate(-45, ${40 + (i * 1500 / progress.length)}, 1060)">
          ${progress[i].label}
        </text>
      `);
    }
  }

  const expensesPoints = progress.map((month, index) => {
    const x = (index * 1500 / progress.length);
    const y = 1000 - ((month.expenses || 0) / (highestDollarAmount / 1000));

    return `${x},${y}`;
  }).join(' ');

  const incomePoints = progress.map((month, index) => {
    const x = (index * 1500 / progress.length);
    const y = 1000 - ((month.income || 0) / (highestDollarAmount / 1000));

    return `${x},${y}`;
  }).join(' ');

  const safeAmountPoints = progress.map((month, index) => {
    const x = (index * 1500 / progress.length);
    const y = 1000 - ((month.safeAmount || 0) / (highestDollarAmount / 1000));

    return `${x},${y}`;
  }).join(' ');

  const svgTemplate = `
    <svg viewbox="-200 -200 1800 1500" aria-hidden="true" focusable="false">
      <g>
        <polyline points="-135 -180, 0 -180" fill="none" stroke="var(--text-color)" stroke-width="6" stroke-dasharray="5"></polyline>
        <text x="20" y="-170" fill="var(--text-color)">
          Expenses
        </text>
        <polyline points="-135 -130, 0 -130" fill="none" stroke="var(--text-color)" stroke-width="6" stroke-dasharray="15"></polyline>
        <text x="20" y="-120" fill="var(--text-color)">
          Income
        </text>
        <polyline points="-135 -80, 0 -80" fill="none" stroke="var(--text-color)" stroke-width="6"></polyline>
        <text x="20" y="-70" fill="var(--text-color)">
          Safe Withdrawal Amount
        </text>
      </g>
      <g>
        <line x1="0" x2="0" y1="1000" y2="000" stroke-width="6" stroke="var(--text-color)"></line>
        ${yAxisLabels.join('')}
        ${gridLines.join('')}
      </g>
      <g>
        <line x1="0" x2="1500" y1="1000" y2="1000" stroke-width="6" stroke="var(--text-color)"></line>
        ${xAxisLabels.join('')}
      </g>
      <g>
        <polyline points="${expensesPoints}" fill="none" stroke="var(--text-color)" stroke-width="6" stroke-dasharray="5"></polyline>
        <polyline points="${incomePoints}" fill="none" stroke="var(--text-color)" stroke-width="6" stroke-dasharray="15"></polyline>
        <polyline points="${safeAmountPoints}" fill="none" stroke="var(--text-color)" stroke-width="6"></polyline>
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
