require('dotenv').config();
const MongoClient = require('mongodb').MongoClient;
const uri = `mongodb+srv://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}@cluster0.vdomk.mongodb.net/${process.env.MONGODB_DB_NAME}?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

const handler = async (event) => {
    try {
      const { storeName, record } = JSON.parse(event.body);

      await client.connect();

      const collection = client.db(process.env.MONGODB_DB_NAME).collection(storeName);
      const query = { uid: record.uid, key: record.key };
      const update = { $set: { ...record } };
      const options = { upsert: true };

      await collection.updateOne(query, update, options);

      client.close();

      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Item added successfully.' }),
      };
    } catch (error) {
      return {
        statusCode: 500,
        body: JSON.stringify(error),
      };
    }
};

module.exports = { handler };