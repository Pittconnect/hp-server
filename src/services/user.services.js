const mongoose = require("mongoose");
const User = mongoose.model("User");

const getUsers = async (query) => {
  try {
    // const users = await User.find(query).find({ role: ["member", "vip"] });
    const users = await User.find(query);
    console.log("[GET USERS] -> users: ", users);
    return users;
  } catch (err) {
    throw Error(err);
  }
};

const getAndEditUser = async (query, newData) => {
  console.log("[GET AND EDIT USER] -> query: ", query);
  console.log("[GET AND EDIT USER] -> newData: ", newData);

  try {
    const user = await User.findOneAndUpdate(query, newData, {
      new: true,
      runValidators: true,
    });
    console.log("[GET AND EDIT USER] -> user: ", user);

    return user;
  } catch (err) {
    throw Error(err);
  }
};

const getSingleUserService = async (query) => {
  try {
    console.log("[GET SINGLE USER SERVICE] -> query: ", query);
    const user = await User.findOne(query);
    // const user = await User.findOne(query).select("+hash");
    console.log("[GET SINGLE USER SERVICE] -> user: ", user);
    return user;
  } catch (err) {
    throw Error(err);
  }
};

module.exports = {
  getUsers,
  getAndEditUser,
  getSingleUserService,
};
