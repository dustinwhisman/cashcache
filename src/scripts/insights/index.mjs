import { getAllFromObjectStore, getAllFromCloud } from './db/index.mjs';
import { updateBackLink, formatCurrency } from './helpers/index.mjs';

updateBackLink();

let networkDataLoaded = false;

const formatMonthString = (year, month) => new Date(year, month, 1)
  .toLocaleString('en-US', {
    month: 'short',
    year: 'numeric',
  });

const sortingFunction = (a, b) => {
  if (a.year < b.year) {
    return -1;
  }

  if (a.year > b.year) {
    return 1;
  }

  if (a.month < b.month) {
    return -1;
  }

  if (a.month > b.month) {
    return 1;
  }

  return 0;
};

const runwayDescription = (numberOfMonths, recentMonthsCount) => {
  const years = Math.floor(numberOfMonths / 12);
  const months = numberOfMonths % 12;

  let yearPhrase = '';
  if (years === 1) {
    yearPhrase = '1 year';
  } else if (years > 1) {
    yearPhrase = `${years} years`;
  }

  let monthPhrase = '';
  if (months === 1) {
    monthPhrase = '1 month';
  } else if (months > 1) {
    monthPhrase = `${months} months`;
  }

  return `
    <p>
      Your savings could last you
      <b>
        ${yearPhrase}${yearPhrase && monthPhrase ? ' and ' : ''}${monthPhrase}.
      </b>
    </p>
    <details>
      <summary>
        What's a runway?
      </summary>
      <div class="stack">
        <p>
          Your runway is how long you could survive off of savings with no
          income. This is a simplified number that doesn't consider taxes,
          insurance, or other real-world things that would happen during
          unemployment, but it's meant to give a rough idea of how
          well-prepared you are to go without income for whatever reason.
        </p>
        <p>
          Based on your current savings and your average expenses from the past
          ${recentMonthsCount === 1 ? 'month' : `${recentMonthsCount} months`},
          we estimate that your runway is
          <b>
            ${yearPhrase}${yearPhrase && monthPhrase ? ' and ' : ''}${monthPhrase}.
          </b>
        </p>
      </div>
    </details>
  `;
};

const calculateRunway = (totalExpensesByMonth, totalSavingsByMonth) => {
  const runwayBlock = document.querySelector('[data-runway]');
  const runwayDetails = document.querySelector('[data-runway-details]');
  const recentExpenses = totalExpensesByMonth.slice(-13, -1);
  if (!recentExpenses.length) {
    runwayDetails.innerHTML = `
      <p>
        We don't have enough expenses data to calculate what your runway might
        be. As a rule, we don't factor in the current month for this
        calculation, since the in-progress total would make the calculation
        less accurate.
      </p>
      <p>
        You can come back next month, or you can add some historical data for
        past months. You can also bulk upload data via CSV files from the
        <a href="/settings">settings</a> page, which may speed things up.
      </p>
    `;
    runwayBlock.removeAttribute('hidden');
    return;
  }

  const currentSavings = totalSavingsByMonth[totalSavingsByMonth.length - 1]?.total;
  if (!currentSavings) {
    runwayDetails.innerHTML = `
      <p>
        We don't have enough savings data to calculate what your runway might
        be. All we need is one month of savings, so if you track what's
        currently in your savings or retirement accounts (or even cash), we'll
        be able to calculate your runway.
      </p>
    `;
    runwayBlock.removeAttribute('hidden');
    return;
  }

  const averageRecentExpenses = recentExpenses.reduce((acc, e) => (acc + e.total), 0) / recentExpenses.length;
  const runwayInMonths = Math.floor(currentSavings / averageRecentExpenses);

  runwayDetails.innerHTML = runwayDescription(runwayInMonths, recentExpenses.length);
  runwayBlock.removeAttribute('hidden');
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

const calculateRetirementEstimates = (totalExpensesByMonth, totalIncomeByMonth, totalSavingsByMonth) => {
  const retirementBlock = document.querySelector('[data-retirement]');
  const retirementSummaryBlock = document.querySelector('[data-retirement-summary]');
  const retirementDetailsBlock = document.querySelector('[data-retirement-details]');

  const recentExpenses = totalExpensesByMonth.slice(-13, -1);
  if (!recentExpenses.length) {
    retirementSummaryBlock.innerHTML = `
      <p>
        We don't have enough expenses data to calculate how much you might
        need to retire. As a rule, we don't factor in the current month for
        this calculation, since the in-progress total would make the
        calculation less accurate.
      </p>
      <p>
        You can come back next month, or you can add some historical data for
        past months. You can also bulk upload data via CSV files from the
        <a href="/settings">settings</a> page, which may speed things up.
      </p>
    `;

    retirementBlock.removeAttribute('hidden');
    return;
  }

  const averageRecentExpenses = recentExpenses.reduce((acc, e) => (acc + e.total), 0) / recentExpenses.length;
  const estimatedYearlyExpenses = averageRecentExpenses * 12;
  const estimatedRetirementAmount = estimatedYearlyExpenses * 25;

  const recentIncome = totalIncomeByMonth.slice(-13, -1);
  if (!recentIncome.length) {
    retirementDetailsBlock.innerHTML = `
      <p>
        We don't have enough income data to calculate how long it might take
        to retire. As a rule, we don't factor in the current month for this
        calculation, since the in-progress total would make the calculation
        less accurate.
      </p>
      <p>
        You can come back next month, or you can add some historical data for
        past months. You can also bulk upload data via CSV files from the
        <a href="/settings">settings</a> page, which may speed things up.
      </p>
    `;
    retirementBlock.removeAttribute('hidden');
    return;
  }

  const currentSavings = totalSavingsByMonth[totalSavingsByMonth.length - 1]?.total;
  if (!currentSavings) {
    retirementDetailsBlock.innerHTML += `
      <p>
        We don't have enough savings data to calculate how long it might take
        to retire. All we need is one month of savings, so if you track what's
        currently in your savings or retirement accounts (or even cash), we'll
        be able to calculate how long you might have until retirement.
      </p>
    `;
    retirementBlock.removeAttribute('hidden');
    return;
  }

  const averageRecentIncome = recentIncome.reduce((acc, i) => (acc + i.total), 0) / recentIncome.length;
  const estimatedYearlyIncome = averageRecentIncome * 12;
  const estimatedAnnualSavings = estimatedYearlyIncome - estimatedYearlyExpenses;

  const estimatedYearsToRetirement = yearsToRetirement(currentSavings, estimatedAnnualSavings, estimatedRetirementAmount);

  if (estimatedYearsToRetirement < 1) {
    retirementSummaryBlock.innerHTML = `
      <p>
        Amount needed to retire:
        <b>
          ${formatCurrency(estimatedRetirementAmount)}
        </b>
      </p>
      <p>
        Current savings:
        <b>
          ${formatCurrency(currentSavings)}
        </b>
      </p>
      <p>
        But wait... That would mean... You already have enough to retire! Of
        course that's assuming no major changes and that you don't withdraw more
        than 4% of your savings per year. Even so, well done!
      </p>
    `;
  } else {
    retirementSummaryBlock.innerHTML = `
      <p>
        Amount needed to retire:
        <b>
          ${formatCurrency(estimatedRetirementAmount)}
        </b>
      </p>
      <p>
        Estimated time until retirement:
        <b>
          ${estimatedYearsToRetirement === 1
            ? '1 year'
            : estimatedYearsToRetirement > 99
              ? '100 or more years'
              : `${estimatedYearsToRetirement} years`}
        </b>
      </p>
    `;
  }

  if (estimatedYearsToRetirement > 0) {
    retirementDetailsBlock.innerHTML = `
      <details>
        <summary>
          Details
        </summary>
        <div class="stack">
          <p>
            Based on your average expenses over the past
            ${recentExpenses.length === 1 ? 'month' : `${recentExpenses.length} months`},
            we estimate that you will need at least
            <b>${formatCurrency(estimatedRetirementAmount)}</b>
            to retire safely. This assumes you spend no more than 4% of your
            savings every year and your expenses remain similar to what they are
            now.
          </p>
          ${estimatedYearsToRetirement > 99
            ? `
              <p>
                Based on your current savings and expenses, it is highly unlikely
                that you will be able to save enough money to retire. This means
                that you're either spending more money than you make, or it means
                that you aren't saving enough to meaningfully grow your retirement
                savings.
              </p>
              <p>
                You might want to consider finding a financial advisor, but make
                sure you ask them if they are a fiduciary and whether they get paid
                through a fee-only model. If they answer no to either question, find
                somebody else to help.
              </p>
            `
            : `
              <p>
                Based on how much you save per year (income minus expenses), we
                estimate that it will take about
                <b>
                  ${estimatedYearsToRetirement === 1 ? '1 year' : `${estimatedYearsToRetirement} years`}
                </b>
                for you to have enough saved to retire. This assumes that you
                continue to save the same amount every year and that your
                investments average a 7% annual return over the long run.
              </p>
            `}
          <p>
            If those numbers seem impossibly large, the best way to make them
            smaller is to reduce your average expenses. We recommend that instead of
            focusing on minor luxury expenses (the so-called "latte factor"), you
            start with your largest expenses and see what you can do to make them
            smaller.
          </p>
          <p>
            Making more money also helps, but there's no actionable advice for doing
            that. Changes such as shopping around for better insurance, finding
            cheaper housing, and using public transportation, bikes, or cheap used
            cars instead of driving new, rapidly depreciating cars are more within
            reach.
          </p>
        </div>
      </details>
    `;
  }

  retirementBlock.removeAttribute('hidden');
};

const drawProgressChart = (totalExpensesByMonth, totalIncomeByMonth, totalSavingsByMonth) => {
  const monthlyProgress = {};
  totalExpensesByMonth.slice(0, -1).forEach((month) => {
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

  totalIncomeByMonth.slice(0, -1).forEach((month) => {
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

  totalSavingsByMonth.slice(0, -1).forEach((month) => {
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

  if (!Object.keys(monthlyProgress).length) {
    const progressChartBlock = document.querySelector('[data-progress-chart]');
    const progressChartDetails = document.querySelector('[data-progress-chart-details]');
    progressChartDetails.innerHTML = `
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
    progressChartBlock.removeAttribute('hidden');
    return;
  }

  const progress = Object.keys(monthlyProgress)
    .map((key) => ({
      ...monthlyProgress[key],
      label: key,
    }))
    .sort(sortingFunction);

  const highestDollarAmount = Math.ceil(
    Math.max(...[
      ...totalExpensesByMonth.map(e => e.total),
      ...totalIncomeByMonth.map(i => i.total),
      ...totalSavingsByMonth.map(s => s.total / 25)
    ]) / 1000
  ) * 1000;

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
    <details>
      <summary>
        See the numbers
      </summary>
      <table class="small">
        <thead>
          <tr>
            <th>
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
                <th>
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

  const progressChartBlock = document.querySelector('[data-progress-chart]');
  const progressChartDetails = document.querySelector('[data-progress-chart-details]');
  progressChartDetails.innerHTML = svgTemplate;
  progressChartBlock.removeAttribute('hidden');
};

const drawRollingSavingsChart = (totalExpensesByMonth, totalIncomeByMonth, totalSavingsByMonth) => {
  const monthlyData = {};
  totalExpensesByMonth.slice(0, -1).forEach((month) => {
    if (monthlyData[formatMonthString(month.year, month.month)]) {
      monthlyData[formatMonthString(month.year, month.month)].expenses = month.total;
    } else {
      monthlyData[formatMonthString(month.year, month.month)] = {
        expenses: month.total,
        year: month.year,
        month: month.month,
      };
    }
  });

  totalIncomeByMonth.slice(0, -1).forEach((month) => {
    if (monthlyData[formatMonthString(month.year, month.month)]) {
      monthlyData[formatMonthString(month.year, month.month)].income = month.total;
    } else {
      monthlyData[formatMonthString(month.year, month.month)] = {
        income: month.total,
        year: month.year,
        month: month.month,
      };
    }
  });

  totalSavingsByMonth.slice(0, -1).forEach((month) => {
    if (monthlyData[formatMonthString(month.year, month.month)]) {
      monthlyData[formatMonthString(month.year, month.month)].safeAmount = month.total / 25 / 12;
    } else {
      monthlyData[formatMonthString(month.year, month.month)] = {
        safeAmount: month.total / 25 / 12,
        year: month.year,
        month: month.month,
      };
    }
  });

  if (!Object.keys(monthlyData).length) {
    const savingsRateBlock = document.querySelector('[data-savings-rate]');
    const savingsRateDetails = document.querySelector('[data-savings-rate-details]');
    savingsRateDetails.innerHTML = `
      <p>
        We don't have enough data to chart your savings rate right now.
        Once you have expenses, and income data for one month (other than the
        current one), we'll be able to start plotting some points.
      </p>
      <p>
        You can come back next month, or you can add some historical data for
        past months. You can also bulk upload data via CSV files from the
        <a href="/settings">settings</a> page, which may speed things up.
      </p>
    `;
    savingsRateBlock.removeAttribute('hidden');
    return;
  }

  const progress = Object.keys(monthlyData)
    .map((key) => ({
      ...monthlyData[key],
      label: key,
    }))
    .sort(sortingFunction);

  const savingsRates = progress.map((month, index) => {
    let longTermIncome = 0;
    let longTermExpenses = 0;
    for (let i = index - 11; i <= index; i += 1) {
      const prevMonth = progress[i];
      if (progress[i]) {
        longTermIncome += prevMonth.income;
        longTermExpenses += prevMonth.expenses;
      }
    }
    const avgSavingsRate = (longTermIncome - longTermExpenses) / longTermIncome;
    const currentSavingsRate = (month.income - month.expenses) / month.income;

    return {
      label: month.label,
      avgSavingsRate,
      currentSavingsRate,
    };
  });

  const yAxisLabels = [];
  for (let i = -10; i <= 10; i += 2) {
    yAxisLabels.push(`
      <text x="180" y="${610 - (i * 50)}" style="text-anchor: end; font-size: 1.5rem" fill="var(--text-color)">
        ${i * 10}%
      </text>
    `);
  }

  const xAxisLabels = [];
  const xAxisInterval = Math.ceil(savingsRates.length / 12);
  for (let i = 0; i < savingsRates.length; i += 1) {
    if (i % Math.ceil(xAxisInterval) === 0) {
      xAxisLabels.push(`
        <text x="${240 + (i * 1000 / savingsRates.length)}" y="1120" style="text-anchor: end; font-size: 1.5rem" fill="var(--text-color)" transform="rotate(-45, ${240 + (i * 1000 / savingsRates.length)}, 1160)">
          ${savingsRates[i].label}
        </text>
      `);
    }
  }

  const currentRatePoints = savingsRates.map((month, index) => {
    const x = 200 + (index * 1000 / savingsRates.length);
    const y = 600 - (month.currentSavingsRate * 500);

    return `${x},${y}`;
  }).join(' ');

  const avgRatePoints = savingsRates.map((month, index) => {
    const x = 200 + (index * 1000 / savingsRates.length);
    const y = 600 - (month.avgSavingsRate * 500);

    return `${x},${y}`;
  }).join(' ');

  const svgTemplate = `
    <svg viewbox="0 0 1300 1300" aria-hidden="true" focusable="false">
      <g>
        <circle cx="200" cy="40" r="10" fill="var(--text-color)"></circle>
        <text x="220" y="50" style="font-size: 1.5rem" fill="var(--text-color)">
          Monthly Savings Rate
        </text>
        <polygon points="590 48, 600 28, 610 48" fill="var(--blue)"></polygon>
        <text x="620" y="50" style="font-size: 1.5rem" fill="var(--text-color)">
          Average Savings Rate (12 months)
        </text>
      </g>
      <g>
        <line x1="200" x2="200" y1="1100" y2="100" stroke-width="2" stroke="var(--text-color)"></line>
        <line x1="200" x2="1200" y1="600" y2="600" stroke-width="2" stroke="var(--text-color)"></line>
        <line x1="200" x2="1200" y1="1100" y2="1100" stroke-width="2" stroke="var(--text-color)"></line>
        ${yAxisLabels.join('')}
        ${xAxisLabels.join('')}
      </g>
      <g>
        ${savingsRates.map((month, index) => {
          const x = 200 + (index * 1000 / savingsRates.length);
          const currentRateY = 600 - (month.currentSavingsRate * 500);
          const avgRateY = 600 - (month.avgSavingsRate * 500);

          return `
            <circle cx="${x}" cy="${currentRateY}" r="5" fill="var(--text-color)"></circle>
            <polygon points="${x - 5} ${avgRateY + 4}, ${x} ${avgRateY - 6}, ${x + 5} ${avgRateY + 4}" fill="var(--blue)"></polygon>
          `;
        }).join('')}
      </g>
      <g>
        <polyline points="${currentRatePoints}" fill="none" stroke="var(--text-color)" stroke-width="2"></polyline>
        <polyline points="${avgRatePoints}" fill="none" stroke="var(--blue)" stroke-width="2"></polyline>
      </g>
    </svg>
    <details>
      <summary>
        See the numbers
      </summary>
      <table class="small">
        <thead>
          <tr>
            <th>
              Month
            </th>
            <th class="text-align:right">
              Savings Rate
            </th>
            <th class="text-align:right">
              Avg Savings Rate (12 months)
            </th>
          </tr>
        </thead>
        <tbody>
          ${savingsRates.map((month) => {
            return `
              <tr>
                <th>
                  ${month.label}
                </th>
                <td class="text-align:right">
                  ${(month.currentSavingsRate * 100).toFixed(2)}%
                </td>
                <td class="text-align:right">
                  ${(month.avgSavingsRate * 100).toFixed(2)}%
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </details>
  `;

  const savingsRateBlock = document.querySelector('[data-savings-rate]');
  const savingsRateDetails = document.querySelector('[data-savings-rate-details]');
  savingsRateDetails.innerHTML = svgTemplate;
  savingsRateBlock.removeAttribute('hidden');
};

const displayInsights = (allExpenses, allIncome, allSavings) => {
  const today = new Date();
  const thisYear = today.getFullYear();
  const thisMonth = today.getMonth();
  const expensesByMonth = allExpenses.reduce((acc, expense) => {
    if (expense.isDeleted) {
      return acc;
    }

    if (expense.year > thisYear) {
      return acc;
    }

    if (expense.year === thisYear && expense.month > thisMonth) {
      return acc;
    }

    if (acc[`${formatMonthString(expense.year, expense.month)}`]) {
      acc[`${formatMonthString(expense.year, expense.month)}`].push(expense);
    } else {
      acc[`${formatMonthString(expense.year, expense.month)}`] = [expense];
    }

    return acc;
  }, {});

  const totalExpensesByMonth = Object.keys(expensesByMonth)
    .map((key) => ({
      year: expensesByMonth[key][0].year,
      month: expensesByMonth[key][0].month,
      label: key,
      total: expensesByMonth[key].reduce((acc, expense) => (acc + expense.amount), 0),
    }))
    .sort(sortingFunction);

  const incomeByMonth = allIncome.reduce((acc, income) => {
    if (income.isDeleted) {
      return acc;
    }

    if (income.year > thisYear) {
      return acc;
    }

    if (income.year === thisYear && income.month > thisMonth) {
      return acc;
    }

    if (acc[`${formatMonthString(income.year, income.month)}`]) {
      acc[`${formatMonthString(income.year, income.month)}`].push(income);
    } else {
      acc[`${formatMonthString(income.year, income.month)}`] = [income];
    }

    return acc;
  }, {});

  const totalIncomeByMonth = Object.keys(incomeByMonth)
    .map((key) => ({
      year: incomeByMonth[key][0].year,
      month: incomeByMonth[key][0].month,
      label: key,
      total: incomeByMonth[key].reduce((acc, income) => (acc + income.amount), 0),
    }))
    .sort(sortingFunction);

  const savingsByMonth = allSavings.reduce((acc, savings) => {
    if (savings.isDeleted) {
      return acc;
    }

    if (savings.year > thisYear) {
      return acc;
    }

    if (savings.year === thisYear && savings.month > thisMonth) {
      return acc;
    }

    if (acc[`${formatMonthString(savings.year, savings.month)}`]) {
      acc[`${formatMonthString(savings.year, savings.month)}`].push(savings);
    } else {
      acc[`${formatMonthString(savings.year, savings.month)}`] = [savings];
    }

    return acc;
  }, {});

  const totalSavingsByMonth = Object.keys(savingsByMonth)
    .map((key) => ({
      year: savingsByMonth[key][0].year,
      month: savingsByMonth[key][0].month,
      label: key,
      total: savingsByMonth[key].reduce((acc, savings) => (acc + savings.amount), 0),
    }))
    .sort(sortingFunction);

  calculateRunway(totalExpensesByMonth, totalSavingsByMonth);
  calculateRetirementEstimates(totalExpensesByMonth, totalIncomeByMonth, totalSavingsByMonth);
  drawProgressChart(totalExpensesByMonth, totalIncomeByMonth, totalSavingsByMonth);
  drawRollingSavingsChart(totalExpensesByMonth, totalIncomeByMonth, totalSavingsByMonth);
};

const fetchInsightsData = () => {
  Promise.all([
    caches.match('/api/get-all-from-store?storeName=expenses').then(response => response.json()),
    caches.match('/api/get-all-from-store?storeName=income').then(response => response.json()),
    caches.match('/api/get-all-from-store?storeName=savings').then(response => response.json()),
  ])
    .then((values) => {
      const [ allExpenses, allIncome, allSavings ] = values;

      if (!networkDataLoaded) {
        displayInsights(allExpenses, allIncome, allSavings);
      }
    })
    .catch(console.error);
};

(() => {
  if (!appUser?.uid || !isPayingUser) {
    const insights = document.querySelector('[data-insights]');
    const paywallMessage = document.querySelector('[data-paywall-message]');

    insights.setAttribute('hidden', true);
    paywallMessage.removeAttribute('hidden');

    if (!appUser?.uid) {
      const ctaLogIn = document.querySelector('[data-cta-log-in]');
      ctaLogIn.removeAttribute('hidden');
    } else {
      const ctaSubscribe = document.querySelector('[data-cta-subscribe]');
      ctaSubscribe.removeAttribute('hidden');
    }

    return;
  }

  fetchInsightsData();

  Promise.all([
    getAllFromObjectStore('expenses', appUser?.uid),
    getAllFromObjectStore('income', appUser?.uid),
    getAllFromObjectStore('savings', appUser?.uid),
  ])
    .then((values) => {
      const [ allExpenses, allIncome, allSavings ] = values;

      if (!networkDataLoaded) {
        displayInsights(allExpenses, allIncome, allSavings);
      }
    })
    .catch(console.error);
})();

document.addEventListener('token-confirmed', () => {
  if (appUser?.uid && isPayingUser) {
    Promise.all([
      getAllFromCloud('expenses'),
      getAllFromCloud('income'),
      getAllFromCloud('savings'),
    ])
      .then((values) => {
        const [ allExpenses, allIncome, allSavings ] = values;
        networkDataLoaded = true;

        displayInsights(allExpenses, allIncome, allSavings);
      })
      .catch(console.error);
  }
});
