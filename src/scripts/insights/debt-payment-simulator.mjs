import { getAllFromCloudIndex } from '../db/index.mjs';
import { uid, isPayingUser } from '../helpers/index.mjs';

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
        console.log({
          minPaymentSchedule,
          avalancheSchedule,
          snowballSchedule,
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
      console.log({
        minPaymentSchedule,
        avalancheSchedule,
        snowballSchedule,
      });
})
    .catch(console.error);
})();
