import { formatMonthString, sortingFunction, getAllMonthlyTotalsFromCache, getAllMonthlyTotalsFromCloud, chartMagicNumbers } from './helpers.mjs';
import { formatCurrency, uid, isPayingUser } from '../helpers/index.mjs';

const getMonthlySavingsRate = (monthlyTotalIncome, monthlyTotalExpenses) => {
  const monthlySavingsRate = {};
  monthlyTotalIncome.forEach((month) => {
    if (monthlySavingsRate[formatMonthString(month.year, month.month)]) {
      monthlySavingsRate[formatMonthString(month.year, month.month)].income = month.total;
    } else {
      monthlySavingsRate[formatMonthString(month.year, month.month)] = {
        income: month.total,
        year: month.year,
        month: month.month,
      };
    }
  });

  monthlyTotalExpenses.forEach((month) => {
    if (monthlySavingsRate[formatMonthString(month.year, month.month)]) {
      monthlySavingsRate[formatMonthString(month.year, month.month)].expenses = month.total;
    } else {
      monthlySavingsRate[formatMonthString(month.year, month.month)] = {
        expenses: month.total,
        year: month.year,
        month: month.month,
      };
    }
  });

  let savingsRate = Object.keys(monthlySavingsRate)
    .map((key) => {
      return {
        ...monthlySavingsRate[key],
        savingsRate: ((monthlySavingsRate[key].income || 0) - (monthlySavingsRate[key].expenses || 0)) / (monthlySavingsRate[key].income || 1),
        label: key,
      };
    })
    .sort(sortingFunction);

  savingsRate = savingsRate.map((month, index) => {
    let longTermIncome = 0;
    let longTermExpenses = 0;
    for (let i = index - 11; i <= index; i += 1) {
      const prevMonth = savingsRate[i];
      if (savingsRate[i]) {
        longTermIncome += prevMonth.income || 0;
        longTermExpenses += prevMonth.expenses || 0;
      }
    }
    const avgSavingsRate = (longTermIncome - longTermExpenses) / longTermIncome;
      return {
      ...month,
      avgSavingsRate,
    };
  });

  return savingsRate;
};

const getHighestPercentage = (savingsRate) => {
  const highestPercentage = Math.ceil(
    Math.max(...[
      ...savingsRate.map(s => s.savingsRate || 0),
    ]) * 100
  ) / 100;

  return highestPercentage;
};

const getLowestPercentage = (savingsRate) => {
  const lowestPercentage = Math.floor(
    Math.min(...[
      ...savingsRate.map(s => s.savingsRate || 0),
    ]) * 100
  ) / 100;

  return lowestPercentage;
};

const drawChart = (savingsRate, highestPercentage, lowestPercentage) => {
  const savingsRateChartBlock = document.querySelector('[data-chart]');
  if (!Object.keys(savingsRate).length || Object.keys(savingsRate).length < 2) {
    savingsRateChartBlock.innerHTML = `
      <p>
        We don't have enough data to chart your savings rate right now. Once you
        have income and expenses data for more than one month (other than the
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
  const yAxisInterval = (Math.ceil(highestPercentage * 10) - Math.floor(lowestPercentage * 10));
  const chartHeight = yAxisInterval * 10;
  let yAtZero = yBottom;
  let j = 0;
  for (let i = 0; i <= chartHeight; i += 1) {
    if (i % Math.ceil(yAxisInterval) === 0) {
      yAxisLabels.push(`
        <text x="${yAxisLabelHorizontalOffset}" y="${(yBottom + yAxisLabelVerticalOffset) - (j * yAxisGap)}" style="text-anchor: end" fill="var(--text-color)">
          ${i + (Math.floor(lowestPercentage * 10) * 10)}%
        </text>
      `);
      gridLines.push(`
        <polyline points="${xLeft} ${yBottom - (j * yAxisGap)}, ${xRight} ${yBottom - (j * yAxisGap)}" fill="none" stroke="var(--text-color)" stroke-width="2" style="opacity: 0.25"></polyline>
      `);
      j += 1;
    }

    if ((i * 10) + (Math.floor(lowestPercentage * 10) * 10) === 0) {
      yAtZero = yBottom - (((i * 10) / chartHeight) * yBottom);
      gridLines.push(`
        <polyline points="${xLeft} ${yAtZero}, ${xRight} ${yAtZero}" fill="none" stroke="var(--text-color)" stroke-width="6"></polyline>
      `);
    }
  }

  const xAxisLabels = [];
  const xAxisInterval = Math.ceil(savingsRate.length / 12);
  for (let i = 0; i < savingsRate.length; i += 1) {
    if (i % Math.ceil(xAxisInterval) === 0) {
      xAxisLabels.push(`
        <text x="${xAxisLabelHorizontalOffset + (i * xRight / savingsRate.length)}" y="${yBottom + xAxisLabelVerticalOffset}" style="text-anchor: end" fill="var(--text-color)" transform="rotate(-45, ${xAxisLabelHorizontalOffset + (i * xRight / savingsRate.length)}, ${yBottom + xAxisLabelRotationalOffset})">
          ${savingsRate[i].label}
        </text>
      `);
    }
  }

  const savingsRatePoints = savingsRate.map((month, index) => {
    const x = (index * xRight / savingsRate.length);
    const y = yAtZero - ((month.savingsRate || 0) * 100 / (chartHeight / yBottom));

    return `${x},${y}`;
  }).join(' ');

  const avgSavingsRatePoints = savingsRate.map((month, index) => {
    const x = (index * xRight / savingsRate.length);
    const y = yAtZero - ((month.avgSavingsRate || 0) * 100 / (chartHeight / yBottom));

    return `${x},${y}`;
  }).join(' ');

  const svgTemplate = `
    <svg viewbox="${xMin} ${yMin} ${xMax} ${yMax}" aria-hidden="true" focusable="false">
      <g>
        <polyline points="${xLegendStart} ${yLegendStart}, ${xLegendEnd} ${yLegendStart}" fill="none" stroke="var(--text-color)" stroke-width="6" stroke-dasharray="5"></polyline>
        <text x="${xLegendLabelStart}" y="${yLegendStart + yLegendLabelOffset}" fill="var(--text-color)">
          Savings Rate
        </text>
        <polyline points="${xLegendStart} ${yLegendStart + yLegendGap}, ${xLegendEnd} ${yLegendStart + yLegendGap}" fill="none" stroke="var(--text-color)" stroke-width="6"></polyline>
        <text x="${xLegendLabelStart}" y="${yLegendStart + yLegendLabelOffset + yLegendGap}" fill="var(--text-color)">
          Savings Rate (Rolling Average)
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
        <polyline points="${savingsRatePoints}" fill="none" stroke="var(--text-color)" stroke-width="6" stroke-dasharray="5"></polyline>
        <polyline points="${avgSavingsRatePoints}" fill="none" stroke="var(--text-color)" stroke-width="6"></polyline>
      </g>
    </svg>
  `;

  savingsRateChartBlock.innerHTML = svgTemplate;
};

const drawTable = (savingsRate) => {
  if (!Object.keys(savingsRate).length) {
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
              Savings Rate
            </th>
            <th class="text-align:right">
              Savings Rate (Rolling Average)
            </th>
          </tr>
        </thead>
        <tbody>
          ${savingsRate.map((month) => {
            return `
              <tr>
                <th class="text-align:right">
                  ${month.label}
                </th>
                <td class="text-align:right">
                  ${((month.savingsRate || 0) * 100).toFixed(2)}%
                </td>
                <td class="text-align:right">
                  ${((month.avgSavingsRate || 0) * 100).toFixed(2)}%
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
    getAllMonthlyTotalsFromCache('income'),
    getAllMonthlyTotalsFromCache('expenses'),
  ])
    .then((values) => {
      if (!isNetworkDataLoaded) {
        const [ monthlyTotalIncome, monthlyTotalExpenses ] = values;
        const monthlySavingsRate = getMonthlySavingsRate(monthlyTotalIncome, monthlyTotalExpenses);
        const highestPercentage = getHighestPercentage(monthlySavingsRate);
        const lowestPercentage = getLowestPercentage(monthlySavingsRate);

        drawChart(monthlySavingsRate, highestPercentage, lowestPercentage);
        drawTable(monthlySavingsRate);
      }
    })
    .catch(() => {
      // swallow error: the cache doesn't matter that much
    });

    Promise.all([
      getAllMonthlyTotalsFromCloud('income'),
      getAllMonthlyTotalsFromCloud('expenses'),
    ])
      .then((values) => {
        isNetworkDataLoaded = true;
        const [ monthlyTotalIncome, monthlyTotalExpenses ] = values;
        const monthlySavingsRate = getMonthlySavingsRate(monthlyTotalIncome, monthlyTotalExpenses);
        const highestPercentage = getHighestPercentage(monthlySavingsRate);
        const lowestPercentage = getLowestPercentage(monthlySavingsRate);

        drawChart(monthlySavingsRate, highestPercentage, lowestPercentage);
        drawTable(monthlySavingsRate);
      })
      .catch(console.error);
  })();
