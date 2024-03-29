require("dotenv").config();
const MongoClient = require("mongodb").MongoClient;
const { initializeApp, cert, getApps, getApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_CREDENTIALS);

const isDevelopment = process.env.NODE_ENV === "development";
const uri = `mongodb+srv://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}@${process.env.MONGODB_DOMAIN}/${process.env.MONGODB_DB_NAME}?retryWrites=true&w=majority`;

let cachedDb = null;
let client;

const connectToDatabase = async (uri) => {
  if (cachedDb) {
    return cachedDb;
  }

  client = await MongoClient.connect(uri);

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
    let app;
    if (!getApps().length) {
      app = initializeApp({
        credential: cert(serviceAccount),
      });
    } else {
      app = getApp();
    }

    let uid;
    let token = event.headers.authorization;
    token = token.replace(/^Bearer\s+/, "");
    if (token) {
      const decodedToken = await getAuth(app).verifyIdToken(token);
      uid = decodedToken.uid;
    } else {
      return {
        statusCode: 401,
        body: JSON.stringify({ message: "This request was not authorized." }),
      };
    }

    context.callbackWaitsForEmptyEventLoop = false;

    const { storeName, key } = event.queryStringParameters;
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
