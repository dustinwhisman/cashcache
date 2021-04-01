import { getAllFromObjectStore, getAllFromCloud } from '../db/index.mjs';
import { uid } from '../helpers/index.mjs';

export const formatMonthString = (year, month) => new Date(year, month, 1)
  .toLocaleString('en-US', {
    month: 'short',
    year: 'numeric',
  });

export const sortingFunction = (a, b) => {
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


const formatMonthlyTotalData = (allData) => {
  const today = new Date();
  const thisYear = today.getFullYear();
  const thisMonth = today.getMonth();

  const dataByMonth = allData.reduce((acc, record) => {
    if (record.isDeleted) {
      return acc;
    }

    if (record.year > thisYear) {
      return acc;
    }

    if (record.year === thisYear && record.month >= thisMonth) {
      return acc;
    }

    if (acc[`${formatMonthString(record.year, record.month)}`]) {
      acc[`${formatMonthString(record.year, record.month)}`].push(record);
    } else {
      acc[`${formatMonthString(record.year, record.month)}`] = [record];
    }

    return acc;
  }, {});

  const totalDataByMonth = Object.keys(dataByMonth)
    .map((key) => ({
      year: dataByMonth[key][0].year,
      month: dataByMonth[key][0].month,
      label: key,
      total: dataByMonth[key].reduce((acc, record) => (acc + record.amount), 0),
    }))
    .sort(sortingFunction);

  return totalDataByMonth;
};

export const getAllMonthlyTotals = async (storeName) => {
  try {
    const allData = await getAllFromObjectStore(storeName, uid());
    return formatMonthlyTotalData(allData);
  } catch {
    return null;
  }
};

export const getAllMonthlyTotalsFromCache = async (storeName) => {
  try {
    const response = await caches.match(`/api/get-all-from-store?storeName=${storeName}`);
    const allData = await response.json();
    return formatMonthlyTotalData(allData);
  } catch {
    return null;
  }
};

export const getAllMonthlyTotalsFromCloud = async (storeName) => {
  try {
    const allData = await getAllFromCloud(storeName);
    return formatMonthlyTotalData(allData);
  } catch {
    return null;
  }
};

export const chartMagicNumbers = {
  xMin: -200,
  yMin: -200,
  xMax: 1800,
  yMax: 1500,
  xLeft: 0,
  xRight: 1500,
  yTop: 0,
  yBottom: 1000,
  yAxisGap: 100,
  yAxisLabelVerticalOffset: 10,
  yAxisLabelHorizontalOffset: -20,
  xAxisLabelVerticalOffset: 20,
  xAxisLabelHorizontalOffset: 40,
  xAxisLabelRotationalOffset: 60,
  xLegendStart: -135,
  xLegendEnd: 0,
  yLegendStart: -180,
  yLegendGap: 50,
  xLegendLabelStart: 20,
  yLegendLabelOffset: 10,
};
