const express = require("express");
const serverless = require("serverless-http");
const passport = require("passport");
const cors = require("cors");

const { createDbConnection } = require("../config/database");
const { createUserSchema } = require("../models/user");

// Gives us access to variables set in the .env file via `process.env.VARIABLE_NAME` syntax
require("dotenv").config();

const app = express();

// Must first load the models
createUserSchema();

require("../config/passport")(passport);
app.use(passport.initialize());

const allowedOrigins = [
  "http://localhost:3000",
  "https://healthparam.netlify.app",
];

const corsOptions = {
  origin: function (origin, callback) {
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
};

app.use(cors());
// app.use(cors(corsOptions));

// Instead of using body-parser middleware, use the new Express implementation of the same thing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * -------------- ROUTES ----------------
 */

// Imports all of the routes from ./routes/index.js
const routes = require("../routes");

// pattern - .netlify/nameOfBuildFolder/nameOfThisFile/
app.use("/.netlify/functions/server", routes);

module.exports = app;
const handler = serverless(app);
module.exports.handler = async (event, context) => {
  console.log("SERVERLESS HANDLER STARTED");
  context.callbackWaitsForEmptyEventLoop = false;

  // Get an instance of our database connection
  await createDbConnection();

  const result = await handler(event, context);
  console.log("SERVERLESS HANDLER FINISHED");
  return result;
};
