import { uid } from '../helpers/index.mjs';

(async () => {
  let sessionId;
  let customerId;
  const params = new URLSearchParams(window.location.search);

  if (params?.has('sessionId')) {
    sessionId = params.get('sessionId');
  }

  if (sessionId) {
    try {
      const customerRequest = await fetch('/api/get-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ sessionId }),
      });
      const customerData = await customerRequest.json();
      customerId = customerData?.customer?.id;

      if (uid()) {
        fetch('/api/save-customer-id', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            customerId,
          }),
        })
          .then(response => response.json())
          .then(() => {
            console.log('Customer ID saved');
          })
          .catch((error) => {
            console.error(error);
          });
      }
    } catch (error) {
      console.error(error);
    }
  }
})();
