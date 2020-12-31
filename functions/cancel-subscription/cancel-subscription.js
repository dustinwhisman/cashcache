require('dotenv').config();
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

const handler = async (event) => {
  const { customerId } = JSON.parse(event.body);
  try {
    const customer = await stripe.customers.retrieve(customerId, {
      expand: ['subscriptions'],
    });

    await Promise.all(customer.subscriptions.data.map(async (subscription) => {
      await stripe.subscriptions.del(subscription.id);

      return Promise.resolve();
    }));

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Subscriptions canceled.' }),
    };
  } catch (error) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: {
          message: error.message,
        },
      }),
    };
  }
};

module.exports = { handler };
