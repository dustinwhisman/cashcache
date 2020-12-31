require('dotenv').config();

module.exports = {
  environment: process.env.NODE_ENV,
  firebaseApiKey: process.env.FIREBASE_API_KEY,
  firebaseAuthDomain: process.env.FIREBASE_AUTH_DOMAIN,
  firebaseMessagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  firebaseAppId: process.env.FIREBASE_APP_ID,
  stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
  monthlyPlanId: process.env.PRODUCT_MONTHLY_ID,
  yearlyPlanId: process.env.PRODUCT_YEARLY_ID,
};
