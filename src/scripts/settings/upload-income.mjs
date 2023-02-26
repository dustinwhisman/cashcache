import { addToDb, bulkAddToDb, getAllFromObjectStore } from '../db/index.mjs';
import { sanitize, uid, isPayingUser, csvStringToArray } from '../helpers/index.mjs';

document.addEventListener('change', (event) => {
  if (event.target.matches('[data-import-income-data]')) {
    const userId = uid();
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = async (e) => {
      const importProgressIndicator = document.querySelector('[data-import-income-progress]');
      importProgressIndicator.innerHTML = '<p>Loading file...</p>';
      try {
        const incomeData = csvStringToArray(e.target.result);
        importProgressIndicator.innerHTML = '<p>Uploading Income...</p>';

        const incomeToImport = incomeData.map((income) => {
          const date = new Date(income['Date']);
          return {
            uid: userId,
            year: date.getFullYear(),
            month: date.getMonth(),
            day: date.getDate(),
            category: income['Category'],
            description: income['Description'],
            amount: sanitize(income['Amount']),
            key: null,
          };
        });
        await Promise.all(incomeToImport.map(async (income) => {
          await addToDb('income', income, true);
          Promise.resolve();
        }));

        if (userId && isPayingUser()) {
          const allIncome = await getAllFromObjectStore('income', userId);
          await bulkAddToDb('income', allIncome);
        }

        importProgressIndicator.innerHTML = `
          <p>
            All done! You should see all your data on the
            <a href="/overview/">overview page</a> now.
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
