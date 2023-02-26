require('dotenv').config();
const Stripe = require('stripe');
const { initializeApp, cert, getApps, getApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_CREDENTIALS);

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

const handler = async (event) => {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
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
