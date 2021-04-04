import { getAllFromCloudIndex } from '../db/index.mjs';
import { formatCurrency, sanitize, uid, isPayingUser } from '../helpers/index.mjs';
import { formatMonthString, formatDuration, chartMagicNumbers } from './helpers.mjs'

let debtData = null;
let extraCash = 100;

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

const calculateAvalancheMethod = (debtData) => {
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

const calculateSnowballMethod = (debtData) => {
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

const drawChart = (data, highestDollarAmount) => {
  const chartBlock = document.querySelector('[data-chart]');
  if (data.length <= 1) {
    chartBlock.innerHTML = `
      <p>
        We don't have enough data to simulate your debt repayment now. We
        calculate based on the previous month's debt entries, since the balances
        might not be consistent for the current month, depending on when you
        track it.
      </p>
      <p>
        You can come back next month, or you can add some historical data for
        past months. You can also bulk upload data via CSV files from the
        <a href="/settings">settings</a> page, which may speed things up.
      </p>
      <p>
        If you don't have any debt, then feel free to disregard these messages,
        and congratulations on being debt free!
      </p>
    `;

    const extraCashForm = document.querySelector('[data-extra-cash-form]');
    extraCashForm.setAttribute('hidden', true);

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

  const minPaymentPoints = data.map((year, index) => {
    const x = (index * xRight / data.length);
    const y = yBottom - ((year.minPaymentBalance || 0) / (highestDollarAmount / yBottom));

    return `${x},${y}`;
  }).join(' ');

  const snowballPoints = data.map((year, index) => {
    const x = (index * xRight / data.length);
    const y = yBottom - ((year.snowballBalance || 0) / (highestDollarAmount / yBottom));

    return `${x},${y}`;
  }).join(' ');

  const avalanchePoints = data.map((year, index) => {
    const x = (index * xRight / data.length);
    const y = yBottom - ((year.avalancheBalance || 0) / (highestDollarAmount / yBottom));

    return `${x},${y}`;
  }).join(' ');

  const svgTemplate = `
    <svg viewbox="${xMin} ${yMin} ${xMax} ${yMax}" aria-hidden="true" focusable="false">
      <g>
        <polyline points="${xLegendStart} ${yLegendStart}, ${xLegendEnd} ${yLegendStart}" fill="none" stroke="var(--text-color)" stroke-width="6" stroke-dasharray="5"></polyline>
        <text x="${xLegendLabelStart}" y="${yLegendStart + yLegendLabelOffset}" fill="var(--text-color)">
          Minimum Payment Only
        </text>
        <polyline points="${xLegendStart} ${yLegendStart + yLegendGap}, ${xLegendEnd} ${yLegendStart + yLegendGap}" fill="none" stroke="var(--text-color)" stroke-width="6" stroke-dasharray="15"></polyline>
        <text x="${xLegendLabelStart}" y="${yLegendStart + yLegendLabelOffset + yLegendGap}" fill="var(--text-color)">
          Snowball Method
        </text>
        <polyline points="${xLegendStart} ${yLegendStart + (yLegendGap * 2)}, ${xLegendEnd} ${yLegendStart + (yLegendGap * 2)}" fill="none" stroke="var(--text-color)" stroke-width="6"></polyline>
        <text x="${xLegendLabelStart}" y="${yLegendStart + yLegendLabelOffset + (yLegendGap * 2)}" fill="var(--text-color)">
          Avalanche Method
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
        <polyline points="${minPaymentPoints}" fill="none" stroke="var(--text-color)" stroke-width="6" stroke-dasharray="5"></polyline>
        <polyline points="${snowballPoints}" fill="none" stroke="var(--text-color)" stroke-width="6" stroke-dasharray="15"></polyline>
        <polyline points="${avalanchePoints}" fill="none" stroke="var(--text-color)" stroke-width="6"></polyline>
      </g>
    </svg>
  `;

  chartBlock.innerHTML = svgTemplate;
};

const generateExplanation = (minPaymentSchedule, snowballSchedule, avalancheSchedule) => {
  if (minPaymentSchedule.monthlySnapshots.length <= 1) {
    return;
  }

  const explanationBlock = document.querySelector('[data-explanation]');

  const template = `
    <p>
      If you were to only pay the minimum payment every month on all your loans,
      it would take
      <b>${formatDuration(minPaymentSchedule.monthlySnapshots.length - 1)}</b>
      to pay off your debt. You would end up paying
      <b>${formatCurrency(minPaymentSchedule.totalInterestPaid)}</b>
      in interest over the lifetime of your loans.
    </p>
    <p>
      If you were to use the Snowball Method to pay off your loans (paying extra
      on the smallest balance, the minimum payment on everything else), it would
      take
      <b>${formatDuration(snowballSchedule.monthlySnapshots.length - 1)}</b>
      to pay off your debt. You would end up paying
      <b>${formatCurrency(snowballSchedule.totalInterestPaid)}</b>
      in interest over the lifetime of your loans.
    </p>
    <p>
      If you were to use the Avalanche Method to pay off your loans (paying
      extra on the highest interest, the minimum payment on everything else), it
      would take
      <b>${formatDuration(avalancheSchedule.monthlySnapshots.length - 1)}</b>
      to pay off your debt. You would end up paying
      <b>${formatCurrency(avalancheSchedule.totalInterestPaid)}</b>
      in interest over the lifetime of your loans.
    </p>
    <p>
      For the Snowball and Avalanche methods, we assume that you are adding the
      minimum payment of paid off loans to future payments, increasing the extra
      cash you have available over time.
    </p>
  `;

  explanationBlock.innerHTML = template;
};

const drawTable = (data) => {
  if (data.length <= 1) {
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

const calculateDebtSchedules = () => {
  const minPaymentSchedule = calculateMinPaymentSchedule(debtData);
  const avalancheSchedule = calculateAvalancheMethod(debtData);
  const snowballSchedule = calculateSnowballMethod(debtData);
  const chartData = generateChartData(minPaymentSchedule.monthlySnapshots, avalancheSchedule.monthlySnapshots, snowballSchedule.monthlySnapshots);
  const highestDollarAmount = getHighestDollarAmount(chartData);

  drawChart(chartData, highestDollarAmount);
  generateExplanation(minPaymentSchedule, snowballSchedule, avalancheSchedule);
  drawTable(chartData);
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

        calculateDebtSchedules();
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

      calculateDebtSchedules();
    })
    .catch(console.error);
})();

document.addEventListener('submit', (event) => {
  event.preventDefault();

  const { elements } = event.target;
  extraCash = sanitize(elements['extra-cash'].value);

  calculateDebtSchedules();
});
