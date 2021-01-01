require('dotenv').config();
const isDevelopment = process.env.NODE_ENV === 'development';
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const MongoClient = require('mongodb').MongoClient;
const uri = `mongodb+srv://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}@cluster0.vdomk.mongodb.net/${process.env.MONGODB_DB_NAME}?retryWrites=true&w=majority`;

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

const getCustomerId = async (db, uid) => {
  const { customerId } = await db.collection('users').findOne({ uid });

  if (isDevelopment && client != null) {
    await client.close();
  }

  const customer = await stripe.customers.retrieve(customerId, {
    expand: ['subscriptions'],
  });

  const isPayingUser = !!customer?.subscriptions?.data?.some(subscription => subscription?.status === 'active');

  return {
    statusCode: 200,
    body: JSON.stringify({ isPayingUser, customerId }),
  };
};

const handler = async (event, context) => {
  try {
      context.callbackWaitsForEmptyEventLoop = false;

      const { uid } = JSON.parse(event.body);
      const db = await connectToDatabase(uri);
      return getCustomerId(db, uid);
    } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error }),
    };
  }
};

module.exports = { handler };