import { schemaVersion, schemaName, updateSchema, uuid } from './db-utilities.mjs';

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

export const addToDb = (storeName, thingToAdd) => {
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
          const successEvent = new CustomEvent('item-added', { detail: thingToAdd.key });
          document.dispatchEvent(successEvent);
          resolve();
        };
      };
    }
  });
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
        if (data.uid != uid) {
          reject('You do not have permission to delete this record.');
          return;
        }

        data.isDeleted = true;
        const endResult = objectStore.put(data);
        endResult.onsuccess = () => {
          const successEvent = new CustomEvent('item-deleted');
          document.dispatchEvent(successEvent);
          resolve();
        }
      };
    }
  });
}

export const deleteAllRecords = (storeName) => {
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
      const result = objectStore.clear();
      result.onsuccess = () => {
        const successEvent = new CustomEvent('all-items-deleted');
        document.dispatchEvent(successEvent);
        resolve();
      };
    };
  });
};
