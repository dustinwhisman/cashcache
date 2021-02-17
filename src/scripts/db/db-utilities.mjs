export const schemaVersion = 1;
export const schemaName = 'cash-cache-db';

export const updateSchema = (event) => {
  const upgradeDb = event.target.result;

  if (upgradeDb.objectStoreNames.contains('expenses')) {
    upgradeDb.deleteObjectStore('expenses');
  }
  const expenses = upgradeDb.createObjectStore('expenses', { keyPath: 'key' });
  expenses.createIndex('year-month', ['year', 'month']);

  if (upgradeDb.objectStoreNames.contains('income')) {
    upgradeDb.deleteObjectStore('income');
  }
  const income = upgradeDb.createObjectStore('income', { keyPath: 'key' });
  income.createIndex('year-month', ['year', 'month']);

  if (upgradeDb.objectStoreNames.contains('savings')) {
    upgradeDb.deleteObjectStore('savings');
  }
  const savings = upgradeDb.createObjectStore('savings', { keyPath: 'key' });
  savings.createIndex('year-month', ['year', 'month']);

  if (upgradeDb.objectStoreNames.contains('debt')) {
    upgradeDb.deleteObjectStore('debt');
  }
  const debt = upgradeDb.createObjectStore('debt', { keyPath: 'key' });
  debt.createIndex('year-month', ['year', 'month']);

  if (upgradeDb.objectStoreNames.contains('recurring-expenses')) {
    upgradeDb.deleteObjectStore('recurring-expenses');
  }
  upgradeDb.createObjectStore('recurring-expenses', { keyPath: 'key' });

  if (upgradeDb.objectStoreNames.contains('recurring-income')) {
    upgradeDb.deleteObjectStore('recurring-income');
  }
  upgradeDb.createObjectStore('recurring-income', { keyPath: 'key' });
};

// tiny uuidv4 generator
// https://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
export const uuid = () => ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
  (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
);
