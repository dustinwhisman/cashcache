require('dotenv').config();
const Stripe = require('stripe');
const MongoClient = require('mongodb').MongoClient;

const isDevelopment = process.env.NODE_ENV === 'development';
console.log({ isDevelopment });
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
console.log({ stripe });
const uri = `mongodb+srv://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}@${process.env.MONGODB_DOMAIN}/${process.env.MONGODB_DB_NAME}?retryWrites=true&w=majority`;
console.log({ uri });

let cachedDb = null;
let client;

const connectToDatabase = async (uri) => {
  if (cachedDb) {
    console.log({ cachedDb });
    return cachedDb;
  }

  client = await MongoClient.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  console.log({ client });

  cachedDb = client.db(process.env.MONGODB_DB_NAME);

  console.log({ cachedDb });
  return cachedDb;
};

const getCustomerId = async (db, uid) => {
  const { customerId } = await db.collection('users').findOne({ uid });
  console.log({ customerId });

  if (isDevelopment && client != null) {
    await client.close();
  }

  const customer = await stripe.customers.retrieve(customerId, {
    expand: ['subscriptions'],
  });
  console.log({ customer });

  const isPayingUser = !!customer?.subscriptions?.data?.some(subscription => subscription?.status === 'active');
  console.log({ isPayingUser });

  return {
    statusCode: 200,
    body: JSON.stringify({ isPayingUser, customerId }),
  };
};

const handler = async (event, context) => {
  try {
    context.callbackWaitsForEmptyEventLoop = false;

    const { uid } = JSON.parse(event.body);
    console.log({ uid });
    const db = await connectToDatabase(uri);
    console.log({ db });
    return getCustomerId(db, uid);
  } catch (error) {
    console.log({ error });
    return {
      statusCode: 500,
      body: JSON.stringify({ error }),
    };
  }
};

module.exports = { handler };
