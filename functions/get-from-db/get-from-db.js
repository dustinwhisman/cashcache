require('dotenv').config();
const MongoClient = require('mongodb').MongoClient;
const uri = `mongodb+srv://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}@cluster0.vdomk.mongodb.net/${process.env.MONGODB_DB_NAME}?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

const handler = async (event) => {
    try {
      const { storeName, key, uid } = JSON.parse(event.body);

      await client.connect();

      const collection = client.db(process.env.MONGODB_DB_NAME).collection(storeName);

      const query = { uid, key };

      const result = await collection.findOne(query);

      await client.close();

      return {
        statusCode: 200,
        body: JSON.stringify(result),
      };
    } catch (error) {
      return {
        statusCode: 500,
        body: JSON.stringify(error),
      };
    }
};

module.exports = { handler };
