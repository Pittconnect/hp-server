const mongoose = require("mongoose");

const createUserSchema = () => {
  console.log("CREATING USER SCHEMA");
  const Schema = mongoose.Schema;

  const UserSchema = new Schema({
    username: String,
    email: String,
    hash: String,
    salt: String,
    status: {
      type: String,
      enum: ["Pending", "Active"],
      default: "Pending",
    },
    confirmationCode: {
      type: String,
      unique: true,
    },
    resetToken: {
      type: String,
      default: null,
      unique: false,
    },
  });

  mongoose.model("User", UserSchema);
  console.log("CREATING USER SCHEMA FINISHED");
};

module.exports = {
  createUserSchema,
};
