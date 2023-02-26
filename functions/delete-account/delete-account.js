require('dotenv').config();
const Stripe = require('stripe');
const MongoClient = require('mongodb').MongoClient;
const { initializeApp, cert, getApps, getApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_CREDENTIALS);

const isDevelopment = process.env.NODE_ENV === 'development';
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const uri = `mongodb+srv://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}@${process.env.MONGODB_DOMAIN}/${process.env.MONGODB_DB_NAME}?retryWrites=true&w=majority`;

let cachedDb = null;
let client;

const connectToDatabase = async (uri) => {
  if (cachedDb) {
    return cachedDb;
  }

  client = await MongoClient.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  cachedDb = client.db(process.env.MONGODB_DB_NAME);

  return cachedDb;
};

const deleteAccount = async (db, uid) => {
  const { customerId } = await db.collection('users').findOne({ uid });
  await db.collection('users').deleteOne({ uid });

  if (isDevelopment && client != null) {
    await client.close();
  }

  const customer = await stripe.customers.retrieve(customerId, {
    expand: ['subscriptions'],
  });

  await Promise.all(customer.subscriptions.data.map(async (subscription) => {
    await stripe.subscriptions.del(subscription.id);

    return Promise.resolve();
  }));

  const deleted = await stripe.customers.del(customerId);

  return {
    statusCode: 200,
    body: JSON.stringify(deleted),
  };
};

const handler = async (event, context) => {
  try {
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

    context.callbackWaitsForEmptyEventLoop = false;

    const db = await connectToDatabase(uri);
    return deleteAccount(db, uid);
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error }),
    };
  }
};

module.exports = { handler };
