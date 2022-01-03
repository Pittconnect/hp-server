const mongoose = require("mongoose");
const User = mongoose.model("User");

const utils = require("../utils/password");

const createSuperAdmin = async () => {
  const superadminUsername = process.env.SUPERADMIN_USERNAME;
  const superadminDomain = process.env.SUPERADMIN_DOMAIN;
  const superadminPassword = process.env.SUPERADMIN_PASSWORD;

  const superadmin = await User.exists({ username: superadminUsername });
  if (superadmin) {
    console.log("SUPEADMIN ALREADY EXIST");
    return;
  }

  const saltHash = utils.genPassword(superadminPassword);

  const salt = saltHash.salt;
  const hash = saltHash.hash;

  const newUser = new User({
    username: superadminUsername,
    email: `${superadminUsername}${superadminDomain}`,
    hash,
    salt,
    status: "Active",
    pricing: "45",
    confirmationCode: "",
    resetToken: null,
    role: "admin",
  });

  console.log("[CREATE SUPERADMIN] -> newUser: ", newUser);

  try {
    const user = await newUser.save();
    console.log("[CREATE SUPERADMIN] -> user: ", user);
  } catch (err) {
    console.log("[CREATE SUPERADMIN] -> err: ", err.message);
  }
};

module.exports = {
  createSuperAdmin,
};
