require('dotenv').config();
const Stripe = require('stripe');
const admin = require('firebase-admin');
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
    const decodedToken = await admin.auth().verifyIdToken(token);
    uid = decodedToken.uid;
  } else {
    return {
      statusCode: 401,
      body: JSON.stringify({ message: 'This request was not authorized.' }),
    };
  }

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
