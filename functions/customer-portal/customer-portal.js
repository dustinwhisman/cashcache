require('dotenv').config();
const Stripe = require('stripe');

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

const handler = async (event) => {
  const { customerId } = JSON.parse(event.body);
  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.NODE_ENV === 'development' ? 'http://localhost:8888' : 'https://cashcache.io'}/account`,
    });

    return {
      statusCode: 200,
      body: JSON.stringify(session),
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
