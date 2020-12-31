require('dotenv').config();
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

const handler = async (event) => {
  const { sessionId } = JSON.parse(event.body);
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const customer = await stripe.customers.retrieve(session.customer);

    return {
      statusCode: 200,
      body: JSON.stringify({ customer }),
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
