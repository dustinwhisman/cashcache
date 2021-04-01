import { formatMonthString, sortingFunction, getAllMonthlyTotalsFromCache, getAllMonthlyTotalsFromCloud, chartMagicNumbers } from './helpers.mjs';
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
        have expenses, income, and savings data for more than one month (other
        than the current one), we'll be able to start plotting some points.
      </p>
      <p>
        You can come back next month, or you can add some historical data for
        past months. You can also bulk upload data via CSV files from the
        <a href="/settings">settings</a> page, which may speed things up.
      </p>
    `;

    return;
  }

  const {
    xMin,
    yMin,
    xMax,
    yMax,
    xLeft,
    xRight,
    yTop,
    yBottom,
    yAxisGap,
    yAxisLabelVerticalOffset,
    yAxisLabelHorizontalOffset,
    xAxisLabelVerticalOffset,
    xAxisLabelHorizontalOffset,
    xAxisLabelRotationalOffset,
    xLegendStart,
    xLegendEnd,
    yLegendStart,
    yLegendGap,
    xLegendLabelStart,
    yLegendLabelOffset,
  } = chartMagicNumbers;

  const yAxisLabels = [];
  const gridLines = [];
  const yAxisInterval = Math.ceil(highestDollarAmount / 10000);
  for (let i = 0; i <= highestDollarAmount / 1000; i += 1) {
    if (i % Math.ceil(yAxisInterval) === 0) {
      yAxisLabels.push(`
        <text x="${yAxisLabelHorizontalOffset}" y="${(yBottom + yAxisLabelVerticalOffset) - (i * yAxisGap)}" style="text-anchor: end" fill="var(--text-color)">
          ${formatCurrency(i * 1000).replace('.00', '')}
        </text>
      `);
      gridLines.push(`
        <polyline points="${xLeft} ${yBottom - (i * yAxisGap)}, ${xRight} ${yBottom - (i * yAxisGap)}" fill="none" stroke="var(--text-color)" stroke-width="2" style="opacity: 0.25"></polyline>
      `);
    }
  }

  const xAxisLabels = [];
  const xAxisInterval = Math.ceil(progress.length / 12);
  for (let i = 0; i < progress.length; i += 1) {
    if (i % Math.ceil(xAxisInterval) === 0) {
      xAxisLabels.push(`
        <text x="${xAxisLabelHorizontalOffset + (i * xRight / progress.length)}" y="${yBottom + xAxisLabelVerticalOffset}" style="text-anchor: end" fill="var(--text-color)" transform="rotate(-45, ${xAxisLabelHorizontalOffset + (i * xRight / progress.length)}, ${yBottom + xAxisLabelRotationalOffset})">
          ${progress[i].label}
        </text>
      `);
    }
  }

  const expensesPoints = progress.map((month, index) => {
    const x = (index * xRight / progress.length);
    const y = yBottom - ((month.expenses || 0) / (highestDollarAmount / yBottom));

    return `${x},${y}`;
  }).join(' ');

  const incomePoints = progress.map((month, index) => {
    const x = (index * xRight / progress.length);
    const y = yBottom - ((month.income || 0) / (highestDollarAmount / yBottom));

    return `${x},${y}`;
  }).join(' ');

  const safeAmountPoints = progress.map((month, index) => {
    const x = (index * xRight / progress.length);
    const y = yBottom - ((month.safeAmount || 0) / (highestDollarAmount / yBottom));

    return `${x},${y}`;
  }).join(' ');

  const svgTemplate = `
    <svg viewbox="${xMin} ${yMin} ${xMax} ${yMax}" aria-hidden="true" focusable="false">
      <g>
        <polyline points="${xLegendStart} ${yLegendStart}, ${xLegendEnd} ${yLegendStart}" fill="none" stroke="var(--text-color)" stroke-width="6" stroke-dasharray="5"></polyline>
        <text x="${xLegendLabelStart}" y="${yLegendStart + yLegendLabelOffset}" fill="var(--text-color)">
          Expenses
        </text>
        <polyline points="${xLegendStart} ${yLegendStart + yLegendGap}, ${xLegendEnd} ${yLegendStart + yLegendGap}" fill="none" stroke="var(--text-color)" stroke-width="6" stroke-dasharray="15"></polyline>
        <text x="${xLegendLabelStart}" y="${yLegendStart + yLegendLabelOffset + yLegendGap}" fill="var(--text-color)">
          Income
        </text>
        <polyline points="${xLegendStart} ${yLegendStart + (yLegendGap * 2)}, ${xLegendEnd} ${yLegendStart + (yLegendGap * 2)}" fill="none" stroke="var(--text-color)" stroke-width="6"></polyline>
        <text x="${xLegendLabelStart}" y="${yLegendStart + yLegendLabelOffset + (yLegendGap * 2)}" fill="var(--text-color)">
          Safe Withdrawal Amount
        </text>
      </g>
      <g>
        <line x1="${xLeft}" x2="${xLeft}" y1="${yBottom}" y2="${yTop}" stroke-width="6" stroke="var(--text-color)"></line>
        ${yAxisLabels.join('')}
        ${gridLines.join('')}
      </g>
      <g>
        <line x1="${xLeft}" x2="${xRight}" y1="${yBottom}" y2="${yBottom}" stroke-width="6" stroke="var(--text-color)"></line>
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
                  ${formatCurrency(month.expenses || 0)}
                </td>
                <td class="text-align:right">
                  ${formatCurrency(month.income || 0)}
                </td>
                <td class="text-align:right">
                  ${formatCurrency(month.safeAmount || 0)}
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
      .catch(console.error);
  })();
