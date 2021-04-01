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

        drawTable(monthlyNetWorth);
        console.log({
          monthlyNetWorth,
          highestDollarAmount,
          lowestDollarAmount,
        });
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

        drawTable(monthlyNetWorth);
        console.log({
          monthlyNetWorth,
          highestDollarAmount,
          lowestDollarAmount,
        });
      })
      .catch(console.error);
  })();
