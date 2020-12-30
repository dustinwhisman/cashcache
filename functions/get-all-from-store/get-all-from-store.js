require('dotenv').config();
const MongoClient = require('mongodb').MongoClient;
const uri = `mongodb+srv://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}@cluster0.vdomk.mongodb.net/${process.env.MONGODB_DB_NAME}?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

const handler = async (event) => {
  let statusCode = 200;
  let result = [];
  try {
    const { storeName, uid } = JSON.parse(event.body);

    console.log('Opening client');
    await client.connect();

    const collection = client.db(process.env.MONGODB_DB_NAME).collection(storeName);

    const query = { uid };

    const cursor = collection.find(query);

    console.log('Fetching documents');
    result = await cursor.toArray();

    console.log('Closing cursor');
    await cursor.close();
  } catch (error) {
    console.error({ error });
    statusCode = 500;
    result = { error };
  } finally {
    console.log('Closing client');
    await client.close();
  }

  return {
    statusCode,
    body: JSON.stringify(result),
  };
};

module.exports = { handler };
