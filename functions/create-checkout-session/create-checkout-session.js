require('dotenv').config();
const Stripe = require('stripe');
const { initializeApp, cert, getApps, getApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_CREDENTIALS);

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

const handler = async (event) => {
  let app;
  if (!getApps().length) {
    app = initializeApp({
      credential: cert(serviceAccount),
    });
  } else {
    app = getApp();
  }

  let uid;
  let token = event.headers.authorization;
  token = token.replace(/^Bearer\s+/, '');
  if (token) {
    const decodedToken = await getAuth(app).verifyIdToken(token);
    uid = decodedToken.uid;
  } else {
    return {
      statusCode: 401,
      body: JSON.stringify({ message: 'This request was not authorized.' }),
    };
  }

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
      success_url: `${process.env.NODE_ENV === 'development' ? 'http://localhost:8888' : 'https://cashcache.io'}/account/payment-success/?sessionId={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NODE_ENV === 'development' ? 'http://localhost:8888' : 'https://cashcache.io'}/account/payment-canceled/`,
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
