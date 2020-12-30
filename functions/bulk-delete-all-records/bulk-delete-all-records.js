require('dotenv').config();
const MongoClient = require('mongodb').MongoClient;
const uri = `mongodb+srv://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}@cluster0.vdomk.mongodb.net/${process.env.MONGODB_DB_NAME}?retryWrites=true&w=majority`;

let cachedDb = null;

const connectToDatabase = async (uri) => {
  if (cachedDb) {
    return cachedDb;
  }

  const client = await MongoClient.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  cachedDb = client.db(process.env.MONGODB_DB_NAME);

  return cachedDb;
};

const bulkDeleteAllRecords = async (db, storeName, uid) => {
  const collection = await db.collection(storeName);
  await collection.deleteMany({ uid });

  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Items deleted successfully.' }),
  };
};

const handler = async (event, context) => {
  try {
      context.callbackWaitsForEmptyEventLoop = false;

      const { storeName, uid } = JSON.parse(event.body);
      const db = await connectToDatabase(uri);
      return bulkDeleteAllRecords(db, storeName, uid);
    } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error }),
    };
  }
};

module.exports = { handler };
