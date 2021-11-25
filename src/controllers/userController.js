const {
  // getUser,
  getUsers,
  // getActiveUsers,
  getAndEditUser,
  getSingleUserService,
} = require("../services/user.services");

const {
  userEditValidation,
  usersEditValidation,
} = require("../utils/validation");

const validation = {
  editUser: userEditValidation,
  editUsers: usersEditValidation,
};

const handleValidation = (body, res, type) => {
  console.log("[VALIDATION] -> body: ", body);
  console.log("[VALIDATION] -> type: ", type);

  const { error } = validation[type](body);

  console.log("[VALIDATION] -> error: ", error);

  if (error) {
    throw Error(error.details[0].message);
  }
};

const getAllUsers = async (req, res) => {
  try {
    const totalUsers = await getUsers({});
    console.log("[GET ALL USERS] -> totalUsers: ", totalUsers);

    return res.status(200).json({ success: true, users: totalUsers });
  } catch (err) {
    console.log("[GET ALL USERS] -> err: ", err.message);
    return res.status(400).json({ success: false, msg: err.message });
  }
};

//   const getAllActiveUsers = async (req, res) => {
//     try {
//       const users = await getActiveUsers({ isActive: true });
//       return res.status(200).json({ data: users });
//     } catch (err) {
//       return res.status(400).json({ error_msg: err.message });
//     }
//   };

//   const getSingleUser = async (req, res) => {
//     try {
//       const user = await getSingleUserService({ _id: req.params.id });
//       return res.status(200).json({ data: user });
//     } catch (err) {
//       return res.status(400).json({ error_msg: err.message });
//     }
//   };

const getLoggedInUser = async (req, res) => {
  console.log("[GET LOGGEDIN USER] -> req.user: ", req.user);

  try {
    const user = await getSingleUserService({ _id: req.user._id });
    return res.status(200).json({ success: true, user });
  } catch (err) {
    return res.status(400).json({ success: false, msg: err.message });
  }
};

const editUserAction = async (req, res) => {
  console.log("[EDIT USER ACTION] -> req.body: ", req.body);
  try {
    handleValidation(req.body, res, "editUser");
    const { _id } = req.body;
    const user = await getAndEditUser({ _id }, req.body);
    return res.json({ success: true, user });
  } catch (err) {
    return res.status(400).json({ success: false, msg: err.message });
  }
};

const editUsersAction = async (req, res) => {
  const { modifiedUsers } = req.body;
  console.log("[EDIT USERS ACTION] -> modifiedUsers: ", modifiedUsers);

  try {
    handleValidation(modifiedUsers, res, "editUsers");

    await Promise.all(
      modifiedUsers.map(({ _id, ...userOptions }) =>
        getAndEditUser({ _id }, userOptions)
      )
    );

    const totalUsers = await getUsers({});

    return res.json({ success: true, users: totalUsers });
  } catch (err) {
    return res.status(400).json({ success: false, msg: err.message });
  }
};

const deleteUserAction = async (req, res) => {
  console.log("[DELETE USER ACTION] -> params: ", req.params);
  const { id } = req.params;
  try {
    const user = await getSingleUserService({ _id: id });
    console.log("[DELETE USER ACTION] -> user: ", user);
    if (user.role === "admin") {
      return res.status(401).json({ success: false, msg: "Nice try" });
    }
    await user.remove();
    return res.json({ success: true, msg: "Successefully removed user" });
  } catch (err) {
    return res.status(400).json({ success: false, msg: err.message });
  }
};

module.exports = {
  getAllUsers,
  //   getAllActiveUsers,
  getLoggedInUser,
  //   getSingleUser,
  editUserAction,
  editUsersAction,
  deleteUserAction,
};
