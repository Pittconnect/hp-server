const paypal = require("@paypal/payouts-sdk");

const environment = () => {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  //new paypal.core.LiveEnvironment(clientId, clientSecret);
  return new paypal.core.SandboxEnvironment(clientId, clientSecret);
};

module.exports.client = () => {
  return new paypal.core.PayPalHttpClient(environment());
};
module.exports.request = () => {
  return new paypal.payouts.PayoutsPostRequest();
};
