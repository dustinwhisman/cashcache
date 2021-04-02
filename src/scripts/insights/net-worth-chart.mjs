import { formatMonthString, sortingFunction, getAllMonthlyTotalsFromCache, getAllMonthlyTotalsFromCloud, chartMagicNumbers } from './helpers.mjs';
import { formatCurrency, uid, isPayingUser } from '../helpers/index.mjs';

const getMonthlyNetWorth = (monthlyTotalSavings, monthlyTotalDebt) => {
  const monthlyNetWorth = {};
  monthlyTotalSavings.forEach((month) => {
    if (monthlyNetWorth[formatMonthString(month.year, month.month)]) {
      monthlyNetWorth[formatMonthString(month.year, month.month)].savings = month.total;
    } else {
      monthlyNetWorth[formatMonthString(month.year, month.month)] = {
        savings: month.total,
        year: month.year,
        month: month.month,
      };
    }
  });

  monthlyTotalDebt.forEach((month) => {
    if (monthlyNetWorth[formatMonthString(month.year, month.month)]) {
      monthlyNetWorth[formatMonthString(month.year, month.month)].debt = month.total;
    } else {
      monthlyNetWorth[formatMonthString(month.year, month.month)] = {
        debt: month.total,
        year: month.year,
        month: month.month,
      };
    }
  });

  const netWorth = Object.keys(monthlyNetWorth)
    .map((key) => ({
      ...monthlyNetWorth[key],
      netWorth: (monthlyNetWorth[key].savings || 0) - (monthlyNetWorth[key].debt || 0),
      label: key,
    }))
    .sort(sortingFunction);

  return netWorth;
};

const getHighestDollarAmount = (monthlyNetWorth) => {
  const highestDollarAmount = Math.ceil(
    Math.max(...[
      ...monthlyNetWorth.map(n => n.savings || 0),
    ]) / 1000
  ) * 1000;

  return highestDollarAmount;
}

const getLowestDollarAmount = (monthlyNetWorth) => {
  const lowestDollarAmount = Math.floor(
    Math.min(...[
      ...monthlyNetWorth.map(n => (n.debt || 0) * -1),
    ]) / 1000
  ) * 1000;

  return lowestDollarAmount > 0 ? 0 : lowestDollarAmount;
}

const drawChart = (netWorth, highestDollarAmount, lowestDollarAmount) => {
  const netWorthChartBlock = document.querySelector('[data-chart]');
  if (!Object.keys(netWorth).length || Object.keys(netWorth).length < 2) {
    netWorthChartBlock.innerHTML = `
      <p>
        We don't have enough data to chart your net worth right now. Once you
        have savings and debt data for more than one month (other than the
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
  const yAxisInterval = Math.ceil((highestDollarAmount - lowestDollarAmount) / 10000);
  const chartHeight = yAxisInterval * 10000;
  let yAtZero = yBottom;
  let j = 0;
  for (let i = 0; i <= (Math.ceil((highestDollarAmount - lowestDollarAmount) / 10000) * 10000) / 1000; i += 1) {
    if (i % Math.ceil(yAxisInterval) === 0) {
      yAxisLabels.push(`
        <text x="${yAxisLabelHorizontalOffset}" y="${(yBottom + yAxisLabelVerticalOffset) - (j * yAxisGap)}" style="text-anchor: end" fill="var(--text-color)">
          ${formatCurrency((i * 1000) + lowestDollarAmount).replace('.00', '')}
        </text>
      `);
      gridLines.push(`
        <polyline points="${xLeft} ${yBottom - (j * yAxisGap)}, ${xRight} ${yBottom - (j * yAxisGap)}" fill="none" stroke="var(--text-color)" stroke-width="2" style="opacity: 0.25"></polyline>
      `);
      j += 1;
    }

    if ((i * 1000) + lowestDollarAmount === 0) {
      yAtZero = yBottom - (((i * 1000) / chartHeight) * yBottom);
      gridLines.push(`
        <polyline points="${xLeft} ${yAtZero}, ${xRight} ${yAtZero}" fill="none" stroke="var(--text-color)" stroke-width="6"></polyline>
      `);
    }
  }

  const xAxisLabels = [];
  const xAxisInterval = Math.ceil(netWorth.length / 12);
  for (let i = 0; i < netWorth.length; i += 1) {
    if (i % Math.ceil(xAxisInterval) === 0) {
      xAxisLabels.push(`
        <text x="${xAxisLabelHorizontalOffset + (i * xRight / netWorth.length)}" y="${yBottom + xAxisLabelVerticalOffset}" style="text-anchor: end" fill="var(--text-color)" transform="rotate(-45, ${xAxisLabelHorizontalOffset + (i * xRight / netWorth.length)}, ${yBottom + xAxisLabelRotationalOffset})">
          ${netWorth[i].label}
        </text>
      `);
    }
  }

  const savingsPoints = netWorth.map((month, index) => {
    const x = (index * xRight / netWorth.length);
    const y = yAtZero - ((month.savings || 0) / (chartHeight / yBottom));

    return `${x},${y}`;
  }).join(' ');

  const debtPoints = netWorth.map((month, index) => {
    const x = (index * xRight / netWorth.length);
    const y = yAtZero + ((month.debt || 0) / (chartHeight / yBottom));

    return `${x},${y}`;
  }).join(' ');

  const netWorthPoints = netWorth.map((month, index) => {
    const x = (index * xRight / netWorth.length);
    const y = yAtZero - ((month.netWorth || 0) / (chartHeight / yBottom));

    return `${x},${y}`;
  }).join(' ');

  const svgTemplate = `
    <svg viewbox="${xMin} ${yMin} ${xMax} ${yMax}" aria-hidden="true" focusable="false">
      <g>
        <polyline points="${xLegendStart} ${yLegendStart}, ${xLegendEnd} ${yLegendStart}" fill="none" stroke="var(--text-color)" stroke-width="6" stroke-dasharray="5"></polyline>
        <text x="${xLegendLabelStart}" y="${yLegendStart + yLegendLabelOffset}" fill="var(--text-color)">
          Savings
        </text>
        <polyline points="${xLegendStart} ${yLegendStart + yLegendGap}, ${xLegendEnd} ${yLegendStart + yLegendGap}" fill="none" stroke="var(--text-color)" stroke-width="6" stroke-dasharray="15"></polyline>
        <text x="${xLegendLabelStart}" y="${yLegendStart + yLegendLabelOffset + yLegendGap}" fill="var(--text-color)">
          Debt
        </text>
        <polyline points="${xLegendStart} ${yLegendStart + (yLegendGap * 2)}, ${xLegendEnd} ${yLegendStart + (yLegendGap * 2)}" fill="none" stroke="var(--text-color)" stroke-width="6"></polyline>
        <text x="${xLegendLabelStart}" y="${yLegendStart + yLegendLabelOffset + (yLegendGap * 2)}" fill="var(--text-color)">
          Net Worth
        </text>
      </g>
      <g>
        <line x1="${xLeft}" x2="${xLeft}" y1="${yBottom}" y2="${yTop}" stroke-width="6" stroke="var(--text-color)"></line>
        ${yAxisLabels.join('')}
        ${gridLines.join('')}
      </g>
      <g>
        ${xAxisLabels.join('')}
      </g>
      <g>
        <polyline points="${savingsPoints}" fill="none" stroke="var(--text-color)" stroke-width="6" stroke-dasharray="5"></polyline>
        <polyline points="${debtPoints}" fill="none" stroke="var(--text-color)" stroke-width="6" stroke-dasharray="15"></polyline>
        <polyline points="${netWorthPoints}" fill="none" stroke="var(--text-color)" stroke-width="6"></polyline>
      </g>
    </svg>
  `;

  netWorthChartBlock.innerHTML = svgTemplate;
};

const drawTable = (netWorth) => {
  if (!Object.keys(netWorth).length) {
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
              Savings
            </th>
            <th class="text-align:right">
              Debt
            </th>
            <th class="text-align:right">
              Net Worth
            </th>
          </tr>
        </thead>
        <tbody>
          ${netWorth.map((month) => {
            return `
              <tr>
                <th class="text-align:right">
                  ${month.label}
                </th>
                <td class="text-align:right">
                  ${formatCurrency(month.savings || 0)}
                </td>
                <td class="text-align:right">
                  ${formatCurrency(month.debt || 0)}
                </td>
                <td class="text-align:right">
                  ${formatCurrency(month.netWorth || 0)}
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
    getAllMonthlyTotalsFromCache('savings'),
    getAllMonthlyTotalsFromCache('debt'),
  ])
    .then((values) => {
      if (!isNetworkDataLoaded) {
        const [ monthlyTotalSavings, monthlyTotalDebt ] = values;
        const monthlyNetWorth = getMonthlyNetWorth(monthlyTotalSavings, monthlyTotalDebt);
        const highestDollarAmount = getHighestDollarAmount(monthlyNetWorth);
        const lowestDollarAmount = getLowestDollarAmount(monthlyNetWorth);

        drawChart(monthlyNetWorth, highestDollarAmount, lowestDollarAmount);
        drawTable(monthlyNetWorth);
      }
    })
    .catch(() => {
      // swallow error: the cache doesn't matter that much
    });

    Promise.all([
      getAllMonthlyTotalsFromCloud('savings'),
      getAllMonthlyTotalsFromCloud('debt'),
    ])
      .then((values) => {
        isNetworkDataLoaded = true;
        const [ monthlyTotalSavings, monthlyTotalDebt ] = values;
        const monthlyNetWorth = getMonthlyNetWorth(monthlyTotalSavings, monthlyTotalDebt);
        const highestDollarAmount = getHighestDollarAmount(monthlyNetWorth);
        const lowestDollarAmount = getLowestDollarAmount(monthlyNetWorth);

        drawChart(monthlyNetWorth, highestDollarAmount, lowestDollarAmount);
        drawTable(monthlyNetWorth);
      })
      .catch(console.error);
  })();
