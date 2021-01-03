require('dotenv').config();
const MongoClient = require('mongodb').MongoClient;
const admin = require('firebase-admin');
const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_CREDENTIALS);

const isDevelopment = process.env.NODE_ENV === 'development';
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

const saveCustomerId = async (db, uid, customerId) => {
  const query = { uid };
  const update = { $set: { customerId } };
  const options = { upsert: true };
  await db.collection('users').updateOne(query, update, options);

  if (isDevelopment && client != null) {
    await client.close();
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Customer ID updated successfully.' }),
  };
};

const handler = async (event, context) => {
  try {
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

    context.callbackWaitsForEmptyEventLoop = false;

    const { customerId } = JSON.parse(event.body);
    const db = await connectToDatabase(uri);
    return saveCustomerId(db, uid, customerId);
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error }),
    };
  }
};

module.exports = { handler };
