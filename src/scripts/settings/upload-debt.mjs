import { addToDb, bulkAddToDb, getAllFromObjectStore } from '../db/index.mjs';
import { sanitize, uid, isPayingUser, csvStringToArray } from '../helpers/index.mjs';

document.addEventListener('change', (event) => {
  if (event.target.matches('[data-import-debt-data]')) {
    const userId = uid();
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = async (e) => {
      const importProgressIndicator = document.querySelector('[data-import-debt-progress]');
      importProgressIndicator.innerHTML = '<p>Loading file...</p>';
      try {
        const debtData = csvStringToArray(e.target.result);
        importProgressIndicator.innerHTML = '<p>Uploading Debt...</p>';

        const debtToImport = debtData.map((debt) => {
          const date = new Date(debt['Date']);
          return {
            uid: userId,
            year: date.getFullYear(),
            month: date.getMonth(),
            description: debt['Description'],
            amount: sanitize(debt['Balance']),
            minimumPayment: sanitize(debt['Minimum Payment']),
            interestRate: sanitize(debt['Interest Rate']),
            key: null,
          };
        });
        await Promise.all(debtToImport.map(async (debt) => {
          await addToDb('debt', debt, true);
          Promise.resolve();
        }));

        if (userId && isPayingUser()) {
          const allDebt = await getAllFromObjectStore('debt', userId);
          await bulkAddToDb('debt', allDebt);
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
          </p>
        `;
      }
    };
    reader.readAsText(file);
  }
});
