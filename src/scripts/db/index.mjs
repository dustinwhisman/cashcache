import { schemaVersion, schemaName, updateSchema, uuid } from './db-utilities.mjs';
import { isPayingUser, token } from '../helpers/index.mjs';

const keepLocalCurrent = (storeName, record) => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(schemaName, schemaVersion);
    request.onupgradeneeded = updateSchema;

    request.onerror = (event) => {
      console.log(`Database error: ${event.target.errorCode}`);
      reject();
    };

    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction([storeName], 'readwrite');
      const objectStore = transaction.objectStore(storeName);
      const result = objectStore.put(record);

      result.onsuccess = () => {
        resolve();
      };
    };
  });
};

export const getFromDb = (storeName, key, uid = null) => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(schemaName, schemaVersion);
    request.onupgradeneeded = updateSchema;

    request.onerror = (event) => {
      const error = `Database error: ${event.target.errorCode}`;
      reject(error);
    };

    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction([storeName], 'readonly');
      const objectStore = transaction.objectStore(storeName);
      const result = objectStore.get(key);
      result.onsuccess = (event) => {
        if (event.target.result.uid != uid) {
          reject('Access to this record is denied.');
        }

        resolve(event.target.result);
      }
    }
  });
};

export const getFromCloudDb = async (storeName, key, uid) => {
  try {
    const request = await fetch(`/api/get-from-db?storeName=${storeName}&key=${key}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token()}`,
      },
    });

    const data = await request.json();
    delete data._id;
    await keepLocalCurrent(storeName, data);

    return data;
  } catch (error) {
    console.error(error);
  }
};

export const getAllFromIndex = (storeName, indexName, year, month, uid = null) => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(schemaName, schemaVersion);
    request.onupgradeneeded = updateSchema;

    request.onerror = (event) => {
      const error = `Database error: ${event.target.errorCode}`;
      reject(error);
    };

    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction([storeName], 'readonly');
      const index = transaction.objectStore(storeName).index(indexName);
      const range = IDBKeyRange.only([year, month]);
      const result = index.getAll(range);
      result.onsuccess = (event) => {
        resolve(event.target.result.filter(x => x.uid == uid && !x.isDeleted));
      };
    }
  });
};

export const getAllFromCloudIndex = async (storeName, year, month, uid) => {
  try {
    const request = await fetch(`/api/get-all-from-index?storeName=${storeName}&year=${year}&month=${month}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token()}`,
      },
    });

    const data = await request.json();
    await Promise.all(data.map(async (record) => {
      delete record._id;
      await keepLocalCurrent(storeName, record);
      return Promise.resolve();
    }));

    return data.filter(x => !x.isDeleted).map((record) => {
      delete record._id;
      return record;
    });
  } catch (error) {
    console.error(error);
  }
};

export const getAllFromObjectStore = (storeName, uid = null) => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(schemaName, schemaVersion);
    request.onupgradeneeded = updateSchema;

    request.onerror = (event) => {
      const error = `Database error: ${event.target.errorCode}`;
      reject(error);
    };

    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction([storeName], 'readonly');
      const objectStore = transaction.objectStore(storeName);
      const result = objectStore.getAll();
      result.onsuccess = (event) => {
        resolve(event.target.result.filter(x => x.uid == uid));
      };
    }
  });
};

export const getAllFromCloud = async (storeName) => {
  try {
    const request = await fetch(`/api/get-all-from-store?storeName=${storeName}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token()}`,
      },
    });

    const data = await request.json();
    await Promise.all(data.map(async (record) => {
      delete record._id;
      await keepLocalCurrent(storeName, record);
      return Promise.resolve();
    }));

    return data.map((record) => {
      delete record._id;
      return record;
    });
  } catch (error) {
    console.error(error);
  }
};

export const getAllCategories = (storeName) => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(schemaName, schemaVersion);
    request.onupgradeneeded = updateSchema;

    request.onerror = (event) => {
      const error = `Database error: ${event.target.errorCode}`;
      reject(error);
    };

    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction([storeName], 'readonly');
      const result = transaction.objectStore(storeName).openCursor(null, 'nextunique');
      const categories = [];
      result.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          if (!categories.includes(cursor.value.category)) {
            categories.push(cursor.value.category);
          }
          cursor.continue();
        } else {
          resolve(categories);
        }
      }
    }
  });
};

export const getAllCategoriesFromCloud = async (storeName, uid) => {
  try {
    const request = await fetch(`/api/get-all-categories?storeName=${storeName}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token()}`,
      },
    });

    const data = await request.json();

    return data;
  } catch (error) {
    console.error(error);
  }
};

export const addToDb = (storeName, thingToAdd, isBulkAdd = false) => {
  return new Promise((resolve, reject) => {
    if (thingToAdd.key == null) {
      thingToAdd.key = uuid();
    }

    const request = indexedDB.open(schemaName, schemaVersion);
    request.onupgradeneeded = updateSchema;

    request.onerror = (event) => {
      console.log(`Database error: ${event.target.errorCode}`);
      reject();
    };

    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction([storeName], 'readwrite');
      const objectStore = transaction.objectStore(storeName);
      const existingThingRequest = objectStore.get(thingToAdd.key);
      existingThingRequest.onsuccess = (event) => {
        if (event.target.result && event.target.result.isDeleted) {
          thingToAdd.isDeleted = true;
        }

        const result = objectStore.put(thingToAdd);
        result.onsuccess = () => {
          if (!isPayingUser() || !thingToAdd.uid || isBulkAdd) {
            resolve();
            return;
          }

          fetch('/api/add-to-db', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token()}`,
            },
            body: JSON.stringify({
              storeName,
              record: thingToAdd,
            }),
          })
            .then(response => response.json())
            .then(() => {
              resolve();
            })
            .catch((error) => {
              console.error(error);
              reject();
            });
        };
      };
    }
  });
};

export const bulkAddToDb = async (storeName, records) => {
  for (let i = 0; i < records.length; i += 100) {
    const recordsBatch = records.slice(i, i + 100);
    try {
      const request = await fetch('/api/bulk-add-to-db', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token()}`,
        },
        body: JSON.stringify({
          storeName,
          records: recordsBatch,
        }),
      });

      await request.json();
    } catch (error) {
      console.error(error);
    }
  }
};

export const deleteFromDb = (storeName, key, uid = null) => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(schemaName, schemaVersion);
    request.onupgradeneeded = updateSchema;

    request.onerror = (event) => {
      console.log(`Database error: ${event.target.errorCode}`);
      reject();
    };

    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction([storeName], 'readwrite');
      const objectStore = transaction.objectStore(storeName);
      const result = objectStore.get(key);
      result.onsuccess = (event) => {
        const data = event.target.result;
        delete data._id;

        if (data.uid != uid) {
          reject('You do not have permission to delete this record.');
          return;
        }

        data.isDeleted = true;
        const endResult = objectStore.put(data);
        endResult.onsuccess = () => {
          if (!isPayingUser() || !uid) {
            const successEvent = new CustomEvent('item-deleted');
            document.dispatchEvent(successEvent);
            resolve();
            return;
          }

          fetch('/api/add-to-db', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token()}`,
            },
            body: JSON.stringify({
              storeName,
              record: data,
            }),
          })
            .then(response => response.json())
            .then(() => {
              const successEvent = new CustomEvent('item-deleted');
              document.dispatchEvent(successEvent);
              resolve();
            })
            .catch((error) => {
              console.error(error);
              reject();
            });
        }
      };
    }
  });
}

const hardDeleteFromDb = (storeName, key) => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(schemaName, schemaVersion);
    request.onupgradeneeded = updateSchema;

    request.onerror = (event) => {
      console.log(`Database error: ${event.target.errorCode}`);
      reject();
    };

    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction([storeName], 'readwrite');
      const objectStore = transaction.objectStore(storeName);
      const result = objectStore.delete(key);
      result.onsuccess = () => {
        resolve();
      };
    }
  });
}

export const deleteAllRecords = async (storeName, records, uid = null) => {
  await Promise.all(records.map(async (record) => {
    try {
      await hardDeleteFromDb(storeName, record.key);
      return Promise.resolve();
    } catch (error) {
      console.error(error);
      return Promise.reject();
    }
  }));

  if (uid) {
    try {
      const request = await fetch('/api/bulk-delete-all-records', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token()}`,
        },
        body: JSON.stringify({
          storeName,
        }),
      });

      await request.json();
    } catch (error) {
      console.error(error);
    }
  }
};

export const deleteAllCloudRecords = async (storeName, uid) => {
  if (!uid) {
    return;
  }

  try {
    const request = await fetch('/api/bulk-delete-all-records', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token()}`,
      },
      body: JSON.stringify({
        storeName,
      }),
    });

    await request.json();
  } catch (error) {
    console.error(error);
  }
};
