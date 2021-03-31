import { addToDb, bulkAddToDb, getAllFromObjectStore } from '../db/index.mjs';
import { sanitize, uid, isPayingUser, csvStringToArray } from '../helpers/index.mjs';

document.addEventListener('change', (event) => {
  if (event.target.matches('[data-import-savings-data]')) {
    const userId = uid();
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = async (e) => {
      const importProgressIndicator = document.querySelector('[data-import-savings-progress]');
      importProgressIndicator.innerHTML = '<p>Loading file...</p>';
      try {
        const savingsData = csvStringToArray(e.target.result);
        importProgressIndicator.innerHTML = '<p>Uploading Savings...</p>';

        const savingsToImport = savingsData.map((savings) => {
          const date = new Date(savings['Date']);
          return {
            uid: userId,
            year: date.getFullYear(),
            month: date.getMonth(),
            category: savings['Category'],
            description: savings['Description'],
            amount: sanitize(savings['Balance']),
            key: null,
          };
        });
        await Promise.all(savingsToImport.map(async (savings) => {
          await addToDb('savings', savings, true);
          Promise.resolve();
        }));

        if (userId && isPayingUser()) {
          const allSavings = await getAllFromObjectStore('savings', userId);
          await bulkAddToDb('savings', allSavings);
        }

        importProgressIndicator.innerHTML = `
          <p>
            All done! You should see all your data on the
            <a href="/overview">overview page</a> now.
          </p>
        `;
      } catch (error) {
        importProgressIndicator.innerHTML = `
          <p>
            There was a problem importing data from that file. Please double
            check the file and try again. If you continue to have problems,
            contact us at
            <a href="mailto:help@cashcache.io">
              help@cashcache.io
            </a>
            <button type="button" class="tiny" data-copy-link-button>
              Copy
            </button>
          </p>
        `;
      }
    };
    reader.readAsText(file);
  }
});
