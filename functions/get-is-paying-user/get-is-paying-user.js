require('dotenv').config();
const Stripe = require('stripe');

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

const getIsPayingUser = async (customerId) => {
  const customer = await stripe.customers.retrieve(customerId, {
    expand: ['subscriptions'],
  });

  const isPayingUser = !!customer?.subscriptions?.data?.some(subscription => subscription?.status === 'active');

  return {
    statusCode: 200,
    body: JSON.stringify({ isPayingUser, customerId }),
  };
};

const handler = async (event) => {
  try {
    const { customerId } = JSON.parse(event.body);
    return getIsPayingUser(customerId);
  } catch (error) {
    console.log({ error });
    return {
      statusCode: 500,
      body: JSON.stringify({ error }),
    };
  }
};

module.exports = { handler };
