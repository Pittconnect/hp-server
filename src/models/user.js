const mongoose = require("mongoose");

const createUserSchema = () => {
  console.log("CREATING USER SCHEMA");
  const Schema = mongoose.Schema;

  const UserSchema = new Schema({
    __v: {
      type: Number,
      select: false,
    },
    username: {
      type: String,
      required: true,
      min: 6,
      max: 255,
    },
    email: {
      type: String,
      required: true,
      min: 6,
      max: 255,
    },
    hash: { type: String, select: false },
    salt: { type: String, select: false },
    status: {
      type: String,
      enum: ["Pending", "Active"],
      default: "Pending",
    },
    pricing: {
      type: String,
      default: "0",
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
    role: {
      type: String,
      default: "member",
      enum: ["admin", "vip", "member"],
    },
    location: {
      type: String,
      default: "usa",
    },
  });

  mongoose.model("User", UserSchema);
  console.log("CREATING USER SCHEMA FINISHED");
};

module.exports = {
  createUserSchema,
};
