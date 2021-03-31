import { addToDb, bulkAddToDb, getAllFromObjectStore } from '../db/index.mjs';
import { sanitize, uid, isPayingUser, csvStringToArray } from '../helpers/index.mjs';

document.addEventListener('change', (event) => {
  if (event.target.matches('[data-import-expenses-data]')) {
    const userId = uid();
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = async (e) => {
      const importProgressIndicator = document.querySelector('[data-import-expenses-progress]');
      importProgressIndicator.innerHTML = '<p>Loading file...</p>';
      try {
        const expensesData = csvStringToArray(e.target.result);
        importProgressIndicator.innerHTML = '<p>Uploading Expenses...</p>';

        const expensesToImport = expensesData.map((expense) => {
          const date = new Date(expense['Date']);
          return {
            uid: userId,
            year: date.getFullYear(),
            month: date.getMonth(),
            day: date.getDate(),
            category: expense['Category'],
            description: expense['Description'],
            amount: sanitize(expense['Amount']),
            key: null,
          };
        });
        await Promise.all(expensesToImport.map(async (expense) => {
          await addToDb('expenses', expense, true);
          Promise.resolve();
        }));

        if (userId && isPayingUser()) {
          const allExpenses = await getAllFromObjectStore('expenses', userId);
          await bulkAddToDb('expenses', allExpenses);
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
