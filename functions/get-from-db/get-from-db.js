require('dotenv').config();
const isDevelopment = process.env.NODE_ENV === 'development';
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

const getFromDb = async (db, storeName, key, uid) => {
  const result = await db.collection(storeName).findOne({ key, uid });

  if (isDevelopment && client != null) {
    await client.close();
  }

  return {
    statusCode: 200,
    body: JSON.stringify(result),
  };
};

const handler = async (event, context) => {
  try {
      context.callbackWaitsForEmptyEventLoop = false;

      const { storeName, key, uid } = JSON.parse(event.body);
      const db = await connectToDatabase(uri);
      return getFromDb(db, storeName, key, uid);
    } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error }),
    };
  }
};

module.exports = { handler };
