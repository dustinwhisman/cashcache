import { schemaVersion, schemaName, updateSchema, uuid } from './db-utilities.mjs';

export const getFromDb = (storeName, key) => {
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
        resolve(event.target.result);
      }
    }
  });
};

export const getAllFromIndex = (storeName, indexName, year, month) => {
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
        resolve(event.target.result.filter(x => !x.isDeleted));
      };
    }
  });
};

export const getAllFromObjectStore = (storeName) => {
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
        resolve(event.target.result);
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
  if (thingToAdd.key == null) {
    thingToAdd.key = uuid();
  }

  const request = indexedDB.open(schemaName, schemaVersion);
  request.onupgradeneeded = updateSchema;

  request.onerror = (event) => {
    console.log(`Database error: ${event.target.errorCode}`);
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
      };
    };
  }
};

export const deleteFromDb = (storeName, key) => {
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
