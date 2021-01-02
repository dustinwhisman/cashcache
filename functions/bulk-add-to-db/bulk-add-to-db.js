require('dotenv').config();
const MongoClient = require('mongodb').MongoClient;

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

const bulkAddToDb = async (db, storeName, records) => {
  const collection = await db.collection(storeName);
  await Promise.all(records.map(async (record) => {
    const recordToInsert = { ...record };
    delete recordToInsert._id;

    const query = { uid: record.uid, key: record.key };
    const update = { $set: { ...recordToInsert } };
    const options = { upsert: true };

    await collection.updateOne(query, update, options);

    return Promise.resolve();
  }));

  if (isDevelopment && client != null) {
    await client.close();
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Items added successfully.' }),
  };
};

const handler = async (event, context) => {
  try {
      context.callbackWaitsForEmptyEventLoop = false;

      const { storeName, records } = JSON.parse(event.body);
      const db = await connectToDatabase(uri);
      return bulkAddToDb(db, storeName, records);
    } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error }),
    };
  }
};

module.exports = { handler };
