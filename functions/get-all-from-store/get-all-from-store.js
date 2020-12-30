require('dotenv').config();
const MongoClient = require('mongodb').MongoClient;
const uri = `mongodb+srv://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}@cluster0.vdomk.mongodb.net/${process.env.MONGODB_DB_NAME}?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

const handler = async (event) => {
  let statusCode = 200;
  let result = [];
  try {
    const { storeName, uid } = JSON.parse(event.body);

    await client.connect();

    const collection = client.db(process.env.MONGODB_DB_NAME).collection(storeName);

    const query = { uid };

    const cursor = collection.find(query);

    for await (const doc of cursor) {
      result.push(doc);
    }
  } catch (error) {
    statusCode = 500;
    result = { error };
  } finally {
    await client.close();
  }

  return {
    statusCode,
    body: JSON.stringify(result),
  };
};

module.exports = { handler };
