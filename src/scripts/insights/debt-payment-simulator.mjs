import { getAllFromCloudIndex } from '../db/index.mjs';
import { formatCurrency, uid, isPayingUser } from '../helpers/index.mjs';
import { formatMonthString } from './helpers.mjs'

let debtData = null;

const calculateMinPaymentSchedule = (debtData) => {
  let totalInterestPaid = 0;
  let totalBalance = debtData.reduce((acc, debt) => acc + debt.amount, 0);
  const monthlySnapshots = [totalBalance];
  let adjustedDebt = debtData;
  while (totalBalance > 0) {
    adjustedDebt = adjustedDebt
      .filter((debt) => debt.amount > 0)
      .map((debt) => {
        const addedInterest = debt.amount * ((debt.interestRate / 100) / 12);
        totalInterestPaid += addedInterest;
        const totalAfterInterest = debt.amount + addedInterest;
        let totalAfterPayment = totalAfterInterest - debt.minimumPayment;
        if (totalAfterPayment < 0) {
          totalAfterPayment = 0;
        }
        return {
          ...debt,
          amount: totalAfterPayment,
        };
      });

    totalBalance = adjustedDebt.reduce((acc, debt) => acc + debt.amount, 0);
    monthlySnapshots.push(totalBalance);
  }

  return {
    totalInterestPaid,
    monthlySnapshots,
  };
};

const calculateAvalancheMethod = (debtData, extraCash = 100) => {
  let monthlyExtraCash = extraCash;
  let totalInterestPaid = 0;
  let totalBalance = debtData.reduce((acc, debt) => acc + debt.amount, 0);
  const monthlySnapshots = [totalBalance];
  let adjustedDebt = debtData.sort((a, b) => {
    if (a.interestRate > b.interestRate) {
      return -1;
    }

    if (a.interestRate < b.interestRate) {
      return 1;
    }

    return 0;
  });

  while (totalBalance > 0) {
    let remainingExtraCash = 0;
    adjustedDebt = adjustedDebt
      .filter((debt) => debt.amount > 0)
      .map((debt, index) => {
        const addedInterest = debt.amount * ((debt.interestRate / 100) / 12);
        totalInterestPaid += addedInterest;
        const totalAfterInterest = debt.amount + addedInterest;
        let totalAfterPayment = totalAfterInterest - debt.minimumPayment;
        if (index === 0) {
          totalAfterPayment -= monthlyExtraCash;
        } else {
          totalAfterPayment -= remainingExtraCash;
        }

        if (totalAfterPayment < 0) {
          remainingExtraCash = totalAfterPayment * -1;
          totalAfterPayment = 0;
          monthlyExtraCash += debt.minimumPayment;
        } else {
          remainingExtraCash = 0;
        }

        return {
          ...debt,
          amount: totalAfterPayment,
        };
      });

    totalBalance = adjustedDebt.reduce((acc, debt) => acc + debt.amount, 0);
    monthlySnapshots.push(totalBalance);
  }

  return {
    totalInterestPaid,
    monthlySnapshots,
  };
};

const calculateSnowballMethod = (debtData, extraCash = 100) => {
  let monthlyExtraCash = extraCash;
  let totalInterestPaid = 0;
  let totalBalance = debtData.reduce((acc, debt) => acc + debt.amount, 0);
  const monthlySnapshots = [totalBalance];
  let adjustedDebt = debtData.sort((a, b) => {
    if (a.amount < b.amount) {
      return -1;
    }

    if (a.amount > b.amount) {
      return 1;
    }

    return 0;
  });

  while (totalBalance > 0) {
    let remainingExtraCash = 0;
    adjustedDebt = adjustedDebt
      .filter((debt) => debt.amount > 0)
      .map((debt, index) => {
        const addedInterest = debt.amount * ((debt.interestRate / 100) / 12);
        totalInterestPaid += addedInterest;
        const totalAfterInterest = debt.amount + addedInterest;
        let totalAfterPayment = totalAfterInterest - debt.minimumPayment;
        if (index === 0) {
          totalAfterPayment -= monthlyExtraCash;
        } else {
          totalAfterPayment -= remainingExtraCash;
        }

        if (totalAfterPayment < 0) {
          remainingExtraCash = totalAfterPayment * -1;
          totalAfterPayment = 0;
          monthlyExtraCash += debt.minimumPayment;
        } else {
          remainingExtraCash = 0;
        }

        return {
          ...debt,
          amount: totalAfterPayment,
        };
      });

    totalBalance = adjustedDebt.reduce((acc, debt) => acc + debt.amount, 0);
    monthlySnapshots.push(totalBalance);
  }

  return {
    totalInterestPaid,
    monthlySnapshots,
  };
};

const generateChartData = (minPaymentData, avalancheData, snowballData) => {
  const data = [];
  const referenceDate = new Date();
  referenceDate.setMonth(referenceDate.getMonth() - 1);
  let year = referenceDate.getFullYear();
  let month = referenceDate.getMonth();

  for (let i = 0; i < minPaymentData.length; i += 1) {
    data.push({
      label: formatMonthString(year, month),
      minPaymentBalance: minPaymentData[i] || 0,
      avalancheBalance: avalancheData[i] || 0,
      snowballBalance: snowballData[i] || 0,
    });

    referenceDate.setMonth(referenceDate.getMonth() + 1);
      year = referenceDate.getFullYear();
      month = referenceDate.getMonth();
    }

  return data;
};

const getHighestDollarAmount = (data) => {
  const highestDollarAmount = Math.ceil(
    Math.max(...[
      ...data.map(m => m.minPaymentBalance),
      ...data.map(m => m.avalancheBalance),
      ...data.map(m => m.snowballBalance)
    ]) / 1000
  ) * 1000;

  return highestDollarAmount;
}

const drawTable = (data) => {
  if (!Object.keys(data).length) {
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
              Minimum Payment Balance
            </th>
            <th class="text-align:right">
              Avalanche Balance
            </th>
            <th class="text-align:right">
              Snowball Balance
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
                  ${formatCurrency(year.minPaymentBalance || 0)}
                </td>
                <td class="text-align:right">
                  ${formatCurrency(year.avalancheBalance || 0)}
                </td>
                <td class="text-align:right">
                  ${formatCurrency(year.snowballBalance || 0)}
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
    caches.match(`/api/get-all-from-index?storeName=debt&year=${year}&month=${month}`),
  ])
    .then((values) => {
      if (!isNetworkDataLoaded) {
        const [ debts ] = values;
        debtData = debts.map((d) => ({
          amount: d.amount,
          description: d.description,
          interestRate: d.interestRate,
          minimumPayment: d.minimumPayment,
        }));
        const minPaymentSchedule = calculateMinPaymentSchedule(debtData);
        const avalancheSchedule = calculateAvalancheMethod(debtData);
        const snowballSchedule = calculateSnowballMethod(debtData);
        const chartData = generateChartData(minPaymentSchedule.monthlySnapshots, avalancheSchedule.monthlySnapshots, snowballSchedule.monthlySnapshots);
        const highestDollarAmount = getHighestDollarAmount(chartData);

        drawTable(chartData);
        console.log({
          chartData,
        });
        }
    })
    .catch(() => {
      // swallow error: the cache doesn't matter that much
    });

  Promise.all([
    getAllFromCloudIndex('debt', year, month, uid()),
  ])
    .then((values) => {
      isNetworkDataLoaded = true;
      const [ debts ] = values;
      debtData = debts.map((d) => ({
        amount: d.amount,
        description: d.description,
        interestRate: d.interestRate,
        minimumPayment: d.minimumPayment,
      }));
      const minPaymentSchedule = calculateMinPaymentSchedule(debtData);
      const avalancheSchedule = calculateAvalancheMethod(debtData);
      const snowballSchedule = calculateSnowballMethod(debtData);
      const chartData = generateChartData(minPaymentSchedule.monthlySnapshots, avalancheSchedule.monthlySnapshots, snowballSchedule.monthlySnapshots);
      const highestDollarAmount = getHighestDollarAmount(chartData);

      drawTable(chartData);
      console.log({
        chartData,
      });
})
    .catch(console.error);
})();
