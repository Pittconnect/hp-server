const mongoose = require("mongoose");

require("dotenv").config();

const devURI = process.env.DB_STRING_DEV;
const prodURI = process.env.DB_STRING_PROD;
const isProduction = process.env.NODE_ENV === "production";

const dbURI = isProduction ? prodURI : devURI;

// Once we connect to the database once, we'll store that connection and reuse it so that we don't have to connect to the database on every request.
let cachedDbConnection = null;

async function createDbConnection() {
  console.log("CONNECTING TO THE DATABASE");
  if (cachedDbConnection) {
    console.log("DATABASE IS ALREADY EXIST");
    return cachedDbConnection;
  }

  console.log("CREATING CONNECTION TO THE NEW DATABASE");
  try {
    console.log("DATABASE URI: ", dbURI);
    connection = await mongoose.connect(dbURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("CONNECTING TO THE NEW DATABASE IS SUCCESFULLY CREATED");
  } catch (error) {
    console.error("COULDNT CREATE CONNECTION TO THE DATABASE");
    throw error;
  }

  cachedDbConnection = connection;
  return connection;
}

module.exports = { createDbConnection };
