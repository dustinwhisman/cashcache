import { getAllMonthlyTotalsFromCache, getAllMonthlyTotalsFromCloud, getTotalsByCategoryFromCache, getTotalsByCategoryFromCloud, formatDuration } from './helpers.mjs';
import { formatCurrency, uid, isPayingUser } from '../helpers/index.mjs';

const getAverageMonthlyExpenses = (monthlyTotalExpenses) => {
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
  return avgExpenses;
};

const getTotalRunwayMonths = (avgExpenses, recentSavings) => {
  const totalSavings = recentSavings.reduce((acc, record) => acc + record.total, 0);
  return Math.floor(totalSavings / avgExpenses);
};

const getSavingsCategoryBreakdown = (avgExpenses, recentSavings) => {
  const breakdown = recentSavings.map((category) => {
    return {
      ...category,
      runwayMonths: Math.floor(category.total / avgExpenses),
    };
  });

  return breakdown;
};

const displayRunway = (avgExpenses, totalRunwayMonths, breakdown) => {
  const runwayInfoBlock = document.querySelector('[data-runway-info]');

  const template = `
    <p>
      Based on your recent expenses (up to 12 months), you spend
      <b>${formatCurrency(avgExpenses)}</b> per month on average.
    </p>
    <p>
      With the savings that you recorded for last month, that means your entire
      savings could last you <b>${formatDuration(totalRunwayMonths)}</b>.
    </p>
    <p>
      Here's a breakdown of how long each category of savings you have could
      last you.
    </p>
    <ul>
      ${breakdown.map((category) => {
        return `
          <li>
            ${category.label}: ${formatCurrency(category.total)} could last for
            about <b>${formatDuration(category.runwayMonths)}</b>
          </li>
        `;
      }).join('')}
    </ul>
  `;

  runwayInfoBlock.innerHTML = template;
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
    getTotalsByCategoryFromCache('savings', year, month),
  ])
    .then((values) => {
      if (!isNetworkDataLoaded) {
        const [ monthlyTotalExpenses, recentSavings ] = values;
        const avgExpenses = getAverageMonthlyExpenses(monthlyTotalExpenses);
        const totalRunwayMonths = getTotalRunwayMonths(avgExpenses, recentSavings);
        const runwayBreakdown = getSavingsCategoryBreakdown(avgExpenses, recentSavings);
        displayRunway(avgExpenses, totalRunwayMonths, runwayBreakdown);
      }
    })
    .catch(() => {
      // swallow error: the cache doesn't matter that much
    });

    Promise.all([
      getAllMonthlyTotalsFromCloud('expenses'),
      getTotalsByCategoryFromCloud('savings', year, month),
    ])
      .then((values) => {
        isNetworkDataLoaded = true;
        const [ monthlyTotalExpenses, recentSavings ] = values;
        const avgExpenses = getAverageMonthlyExpenses(monthlyTotalExpenses);
        const totalRunwayMonths = getTotalRunwayMonths(avgExpenses, recentSavings);
        const runwayBreakdown = getSavingsCategoryBreakdown(avgExpenses, recentSavings);
        displayRunway(avgExpenses, totalRunwayMonths, runwayBreakdown);
      })
      .catch(console.error);
  })();
