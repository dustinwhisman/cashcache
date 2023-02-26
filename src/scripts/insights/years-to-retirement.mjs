import { getAllMonthlyTotalsFromCache, getAllMonthlyTotalsFromCloud, getTotalsByCategoryFromCache, getTotalsByCategoryFromCloud, chartMagicNumbers } from './helpers.mjs';
import { formatCurrency, uid, isPayingUser } from '../helpers/index.mjs';

const getAverageYearlySavings = (monthlyTotalExpenses, monthlyTotalIncome) => {
  if (!monthlyTotalExpenses.length || !monthlyTotalIncome.length) {
    return 0;
  }

  let longTermExpenses = 0;
  for (let i = monthlyTotalExpenses.length - 12; i < monthlyTotalExpenses.length; i += 1) {
    const prevMonth = monthlyTotalExpenses[i];
    if (monthlyTotalExpenses[i]) {
      longTermExpenses += prevMonth.total || 0;
    }
  }

  let longTermIncome = 0;
  for (let i = monthlyTotalIncome.length - 12; i < monthlyTotalIncome.length; i += 1) {
    const prevMonth = monthlyTotalIncome[i];
    if (monthlyTotalIncome[i]) {
      longTermIncome += prevMonth.total || 0;
    }
  }

  const savings = longTermIncome - longTermExpenses;
  return savings;
};

const getAmountNeededForRetirement = (monthlyTotalExpenses) => {
  if (!monthlyTotalExpenses.length) {
    return 0;
  }

  let longTermExpenses = 0;
  let numberOfMonths = 0;
  for (let i = monthlyTotalExpenses.length - 12; i < monthlyTotalExpenses.length; i += 1) {
    const prevMonth = monthlyTotalExpenses[i];
    if (monthlyTotalExpenses[i]) {
      longTermExpenses += prevMonth.total || 0;
      numberOfMonths += 1;
    }
  }

  const avgExpenses = longTermExpenses / numberOfMonths;
  return avgExpenses * 12 * 25;
};

const yearsToRetirement = (assets, yearlySavings, amountNeeded, interest = 0.07) => {
  let count = 0;
  while (amountNeeded > assets) {
    assets = (assets + yearlySavings) * (1 + interest);
    count += 1;
    if (count > 99) {
      break;
    }
  }

  return count;
};

const generateChartData = (assets, yearlySavings, maxYears) => {
  let data = [];
  let year = new Date().getFullYear();
  let pessimisticTotal = assets;
  let optimisticTotal = assets;
  let likelyTotal = assets;

  data.push({
    label: year,
    pessimisticTotal,
    optimisticTotal,
    likelyTotal,
  });

  for (let i = 0; i < maxYears; i += 1) {
    year += 1;
    pessimisticTotal = (pessimisticTotal + yearlySavings) * (1.03);
    optimisticTotal = (optimisticTotal + yearlySavings) * (1.12);
    likelyTotal = (likelyTotal + yearlySavings) * (1.07);
    data.push({
      label: year,
      pessimisticTotal,
      optimisticTotal,
      likelyTotal,
    });
  }

  return data;
};

const getHighestDollarAmount = (data) => {
  const highestDollarAmount = Math.ceil(
    Math.max(...[
      ...data.map(y => y.pessimisticTotal),
      ...data.map(y => y.optimisticTotal),
      ...data.map(y => y.likelyTotal)
    ]) / 1000
  ) * 1000;

  return highestDollarAmount;
}

const drawChart = (data, highestDollarAmount, amountNeeded) => {
  const chartBlock = document.querySelector('[data-chart]');
  if (!data.length) {
    chartBlock.innerHTML = `
      <p>
        We don't have enough data to project your years to retirement now. Once
        you have expenses, income, and savings data for more than one month
        (other than the current one), we'll be able to start plotting some
        points.
      </p>
      <p>
        You can come back next month, or you can add some historical data for
        past months. You can also bulk upload data via CSV files from the
        <a href="/settings/">settings</a> page, which may speed things up.
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
  let j = 0;
  for (let i = 0; i <= yAxisInterval * 10; i += yAxisInterval) {
    yAxisLabels.push(`
      <text x="${yAxisLabelHorizontalOffset}" y="${(yBottom + yAxisLabelVerticalOffset) - (j * yAxisGap)}" style="text-anchor: end" fill="var(--text-color)">
        ${formatCurrency(i * 1000).replace('.00', '')}
      </text>
    `);
    gridLines.push(`
      <polyline points="${xLeft} ${yBottom - (j * yAxisGap)}, ${xRight} ${yBottom - (j * yAxisGap)}" fill="none" stroke="var(--text-color)" stroke-width="2" style="opacity: 0.25"></polyline>
    `);
    j += 1;
  }

  const yAtAmountNeeded = yBottom - ((amountNeeded || 0) / (highestDollarAmount / yBottom));
  gridLines.push(`
    <polyline points="${xLeft} ${yAtAmountNeeded}, ${xRight} ${yAtAmountNeeded}" fill="none" stroke="var(--text-color)" stroke-width="6"></polyline>
  `);

  const xAxisLabels = [];
  const xAxisInterval = Math.ceil(data.length / 12);
  for (let i = 0; i < data.length; i += 1) {
    if (i % Math.ceil(xAxisInterval) === 0) {
      xAxisLabels.push(`
        <text x="${xAxisLabelHorizontalOffset + (i * xRight / data.length)}" y="${yBottom + xAxisLabelVerticalOffset}" style="text-anchor: end" fill="var(--text-color)" transform="rotate(-45, ${xAxisLabelHorizontalOffset + (i * xRight / data.length)}, ${yBottom + xAxisLabelRotationalOffset})">
          ${data[i].label}
        </text>
      `);
    }
  }

  const pessimisticPoints = data.map((year, index) => {
    const x = (index * xRight / data.length);
    const y = yBottom - ((year.pessimisticTotal || 0) / (highestDollarAmount / yBottom));

    return `${x},${y}`;
  }).join(' ');

  const optimisticPoints = data.map((year, index) => {
    const x = (index * xRight / data.length);
    const y = yBottom - ((year.optimisticTotal || 0) / (highestDollarAmount / yBottom));

    return `${x},${y}`;
  }).join(' ');

  const likelyPoints = data.map((year, index) => {
    const x = (index * xRight / data.length);
    const y = yBottom - ((year.likelyTotal || 0) / (highestDollarAmount / yBottom));

    return `${x},${y}`;
  }).join(' ');

  const svgTemplate = `
    <svg viewbox="${xMin} ${yMin} ${xMax} ${yMax}" aria-hidden="true" focusable="false">
      <g>
        <polyline points="${xLegendStart} ${yLegendStart}, ${xLegendEnd} ${yLegendStart}" fill="none" stroke="var(--text-color)" stroke-width="6" stroke-dasharray="5"></polyline>
        <text x="${xLegendLabelStart}" y="${yLegendStart + yLegendLabelOffset}" fill="var(--text-color)">
          Pessimistic Case (3% Interest)
        </text>
        <polyline points="${xLegendStart} ${yLegendStart + yLegendGap}, ${xLegendEnd} ${yLegendStart + yLegendGap}" fill="none" stroke="var(--text-color)" stroke-width="6" stroke-dasharray="15"></polyline>
        <text x="${xLegendLabelStart}" y="${yLegendStart + yLegendLabelOffset + yLegendGap}" fill="var(--text-color)">
          Optimistic Case (12% Interest)
        </text>
        <polyline points="${xLegendStart} ${yLegendStart + (yLegendGap * 2)}, ${xLegendEnd} ${yLegendStart + (yLegendGap * 2)}" fill="none" stroke="var(--text-color)" stroke-width="6"></polyline>
        <text x="${xLegendLabelStart}" y="${yLegendStart + yLegendLabelOffset + (yLegendGap * 2)}" fill="var(--text-color)">
          Likely Case (7% Interest)
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
        <polyline points="${pessimisticPoints}" fill="none" stroke="var(--text-color)" stroke-width="6" stroke-dasharray="5"></polyline>
        <polyline points="${optimisticPoints}" fill="none" stroke="var(--text-color)" stroke-width="6" stroke-dasharray="15"></polyline>
        <polyline points="${likelyPoints}" fill="none" stroke="var(--text-color)" stroke-width="6"></polyline>
      </g>
    </svg>
  `;

  chartBlock.innerHTML = svgTemplate;
};

const generateCongratulations = () => {
  const explanationBlock = document.querySelector('[data-explanation]');

  explanationBlock.innerHTML = `
    <p>
      Based on our calculations, you already have enough money to retire.
      Congratulations!
    </p>
  `;
};

const generateExplanation = (amountNeeded, pessimisticYears, optimisticYears, likelyYears) => {
  const explanationBlock = document.querySelector('[data-explanation]');

  const template = `
    <p>
      Based on your average expenses and assuming that you save the same amount
      every year, we estimate that you'll need
      <b>${formatCurrency(amountNeeded)}</b> to retire. When you have that much
      saved, you ought to be able to withdraw 4% of your savings per year
      without reducing the principle too much.
    </p>
    <p>
      Assuming your savings are invested but only get a 3% average return every
      year, it would take
      <b>${pessimisticYears === 1 ? '1 year' : `${pessimisticYears} years`}</b>
      to save enough to retire.
    </p>
    <p>
      Assuming your savings are invested and get an optimistic 12% average
      return every year, it would take
      <b>${optimisticYears === 1 ? '1 year' : `${optimisticYears} years`}</b>
      to save enough to retire.
    </p>
    <p>
      Assuming your savings are invested and get a 7% average return every
      year, it would take
      <b>${likelyYears === 1 ? '1 year' : `${likelyYears} years`}</b>
      to save enough to retire. This is the most likely scenario, but there is
      no way to predict the real world, so don't count on this being 100%
      accurate.
    </p>
  `;

  explanationBlock.innerHTML = template;
};

const drawTable = (data) => {
  if (!data.length) {
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
              Year
            </th>
            <th class="text-align:right">
              Pessimistic Total
            </th>
            <th class="text-align:right">
              Optimistic Total
            </th>
            <th class="text-align:right">
              Likely Total
            </th>
          </tr>
        </thead>
        <tbody>
          ${data.map((year) => {
            return `
              <tr>
                <th class="text-align:right">
                  ${year.label}
                </th>
                <td class="text-align:right">
                  ${formatCurrency(year.pessimisticTotal || 0)}
                </td>
                <td class="text-align:right">
                  ${formatCurrency(year.optimisticTotal || 0)}
                </td>
                <td class="text-align:right">
                  ${formatCurrency(year.likelyTotal || 0)}
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

  const referenceDate = new Date();
  referenceDate.setMonth(referenceDate.getMonth() - 1);
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();

  let isNetworkDataLoaded = false;

  Promise.all([
    getAllMonthlyTotalsFromCache('expenses'),
    getAllMonthlyTotalsFromCache('income'),
    getTotalsByCategoryFromCache('savings', year, month),
  ])
    .then((values) => {
      if (!isNetworkDataLoaded) {
        const [ monthlyTotalExpenses, monthlyTotalIncome, recentSavings ] = values;
        const totalAssets = recentSavings.reduce((acc, record) => acc + record.total, 0);
        const amountNeeded = getAmountNeededForRetirement(monthlyTotalExpenses);
        if (totalAssets >= amountNeeded) {
          generateCongratulations();
          return;
        }

        const yearlySavings = getAverageYearlySavings(monthlyTotalExpenses, monthlyTotalIncome);
        const pessimisticYears = yearsToRetirement(totalAssets, yearlySavings, amountNeeded, 0.03);
        const optimisticYears = yearsToRetirement(totalAssets, yearlySavings, amountNeeded, 0.12);
        const likelyYears = yearsToRetirement(totalAssets, yearlySavings, amountNeeded, 0.07);
        const chartData = generateChartData(totalAssets, yearlySavings, pessimisticYears);
        const highestDollarAmount = getHighestDollarAmount(chartData);

        drawChart(chartData, highestDollarAmount, amountNeeded);
        drawTable(chartData);

        if (chartData.length) {
          generateExplanation(amountNeeded, pessimisticYears, optimisticYears, likelyYears);
        }
      }
    })
    .catch(() => {
      // swallow error: the cache doesn't matter that much
    });

    Promise.all([
      getAllMonthlyTotalsFromCloud('expenses'),
      getAllMonthlyTotalsFromCloud('income'),
      getTotalsByCategoryFromCloud('savings', year, month),
    ])
      .then((values) => {
        isNetworkDataLoaded = true;
        const [ monthlyTotalExpenses, monthlyTotalIncome, recentSavings ] = values;
        const totalAssets = recentSavings.reduce((acc, record) => acc + record.total, 0);
        const amountNeeded = getAmountNeededForRetirement(monthlyTotalExpenses);
        if (totalAssets >= amountNeeded) {
          generateCongratulations();
          return;
        }

        const yearlySavings = getAverageYearlySavings(monthlyTotalExpenses, monthlyTotalIncome);
        const pessimisticYears = yearsToRetirement(totalAssets, yearlySavings, amountNeeded, 0.03);
        const optimisticYears = yearsToRetirement(totalAssets, yearlySavings, amountNeeded, 0.12);
        const likelyYears = yearsToRetirement(totalAssets, yearlySavings, amountNeeded, 0.07);
        const chartData = generateChartData(totalAssets, yearlySavings, pessimisticYears);
        const highestDollarAmount = getHighestDollarAmount(chartData);

        drawChart(chartData, highestDollarAmount, amountNeeded);
        drawTable(chartData);

        if (chartData.length > 1) {
          generateExplanation(amountNeeded, pessimisticYears, optimisticYears, likelyYears);
        }
      })
      .catch(console.error);
  })();
