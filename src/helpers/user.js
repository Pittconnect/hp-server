const mongoose = require("mongoose");
const User = mongoose.model("User");
const utils = require("../utils/password");

const isUserExist = async (query) => {
  console.log("[IS USER EXIST] -> query: ", query);
  try {
    const isExist = await User.exists(query);

    console.log("[IS USER EXIST] -> isExist: ", isExist);
    return isExist;
  } catch (err) {
    throw Error(err);
  }
};

const createNewUser = (userData) => {
  console.log("[CREATE USER] -> userData: ", userData);
  const { username, email, password, role, location, status } = userData;
  const saltHash = utils.genPassword(password);

  const salt = saltHash.salt;
  const hash = saltHash.hash;
  const domain = process.env.SUPERADMIN_DOMAIN;
  const userEmail = email || `${username}${domain}`;

  console.log("[CREATE USER] -> username: ", username);
  const newUser = new User({
    username,
    email: userEmail,
    hash,
    salt,
    confirmationCode: utils.genEncryptedKey({ userEmail }),
    role,
    location,
    status,
  });
  console.log("[CREATE USER] -> newUser: ", newUser);

  return newUser;
};

module.exports = {
  isUserExist,
  createNewUser,
};
