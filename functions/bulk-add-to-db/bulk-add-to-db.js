require('dotenv').config();
const MongoClient = require('mongodb').MongoClient;
const uri = `mongodb+srv://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}@cluster0.vdomk.mongodb.net/${process.env.MONGODB_DB_NAME}?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

const handler = async (event) => {
    try {
      const { storeName, records } = JSON.parse(event.body);

      await client.connect();

      const collection = client.db(process.env.MONGODB_DB_NAME).collection(storeName);

      await Promise.all(records.map(async (record) => {
        const recordToInsert = { ...record };
        delete recordToInsert._id;

        const query = { uid: record.uid, key: record.key };
        const update = { $set: { ...recordToInsert } };
        const options = { upsert: true };

        await collection.updateOne(query, update, options);

        return Promise.resolve();
      }));

      await client.close();

      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Items added successfully.' }),
      };
    } catch (error) {
      return {
        statusCode: 500,
        body: JSON.stringify(error),
      };
    }
};

module.exports = { handler };
