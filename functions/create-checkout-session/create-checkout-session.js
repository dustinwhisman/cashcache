require('dotenv').config();
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

const handler = async (event) => {
  console.log(process.env.NODE_ENV);
  const { priceId } = JSON.parse(event.body);
  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NODE_ENV === 'development' ? 'http://localhost:8888' : 'https://cashcache.io'}/account/payment-success?sessionId={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NODE_ENV === 'development' ? 'http://localhost:8888' : 'https://cashcache.io'}/account/payment-canceled`,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        sessionId: session.id,
      }),
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