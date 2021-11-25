const mongoose = require("mongoose");
const router = require("express").Router();
const User = mongoose.model("User");
const passport = require("passport");
const utils = require("../utils/password");
const nodemailer = require("../config/nodemailer");
const paypal = require("@paypal/checkout-server-sdk");

const {
  verifiedFunction: ensureAuth,
  checkAdmin,
} = require("./verifyJwtToken");
const {
  getLoggedInUser,
  getAllUsers,
  // getAllActiveUsers,
  // getSingleUser,
  editUserAction,
  editUsersAction,
  deleteUserAction,
} = require("../controllers/userController");

const clientId = process.env.PAYPAL_CLIENT_ID;
const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
const environment = new paypal.core.LiveEnvironment(clientId, clientSecret);
// const environment = new paypal.core.SandboxEnvironment(clientId, clientSecret);
const client = new paypal.core.PayPalHttpClient(environment);

router.get("/", ensureAuth, getAllUsers);
router.get("/me", ensureAuth, getLoggedInUser);

router.patch(
  "/edit-user",
  passport.authenticate("jwt", { session: false }),
  editUserAction
);

router.patch(
  "/edit-users",
  passport.authenticate("jwt", { session: false }),
  editUsersAction
);

router.get(
  "/delete/:id",
  [passport.authenticate("jwt", { session: false }), checkAdmin],
  deleteUserAction
);

router.get("/confirm/:confirmationCode", async (req, res, next) => {
  console.log("[CONFIRM] -> confirmationCode: ", req.params.confirmationCode);

  User.findOne({
    confirmationCode: req.params.confirmationCode,
  })
    .then((user) => {
      console.log(user);
      if (!user) {
        return res.status(404).json({ success: false, msg: "User Not found." });
      } else if (user.status === "Active") {
        return res.status(200).json({
          success: true,
          msg: "User has been already verified. Please Login",
        });
      }

      user.status = "Active";
      user.save((err) => {
        if (err) {
          return res.status(500).send({ success: false, msg: err.message });
        } else {
          return res.status(200).send({
            success: true,
            msg: "Your account has been successfully verified",
          });
        }
      });
    })
    .catch((err) => {
      console.log("[CONFIRM] -> ERROR: ", err);
      next(err);
    });
});

router.get(
  "/protected",
  passport.authenticate("jwt", { session: false }),
  (req, res, next) => {
    res.status(200).json({
      success: true,
      msg: "You are successfully authenticated to this route!",
    });
  }
);

router.post("/login", function (req, res, next) {
  User.findOne({ username: req.body.username })
    .select("+hash +salt")
    .then((user) => {
      if (!user) {
        return res
          .status(401)
          .json({ success: false, msg: "Could not find user" });
      }

      if (user.status !== "Active") {
        return res.status(401).json({
          success: false,
          msg: "Pending Account. Please Verify Your Email!",
        });
      }

      // Function defined at bottom of app.js
      const isValid = utils.validPassword(
        req.body.password,
        user.hash,
        user.salt
      );

      if (isValid) {
        const tokenObject = utils.issueJWT(user);

        res.status(200).json({
          success: true,
          token: tokenObject.token,
          expiresIn: tokenObject.expires,
          role: user.role,
        });
      } else {
        res
          .status(401)
          .json({ success: false, msg: "You entered the wrong password" });
      }
    })
    .catch((err) => {
      next(err);
    });
});

router.post("/create-order", async (req, res, next) => {
  const { price, email } = req.body;

  const result = await User.find({ email });
  console.log("[CREATE ORDER] -> result: ", result);

  if (result.length) {
    res.status(401).json({
      success: false,
      msg: "Email already exists",
    });
  } else {
    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer("return=representation");
    request.requestBody({
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: "USD",
            value: price,
          },
        },
      ],
    });

    try {
      const order = await client.execute(request);
      console.log("[CREATE ORDER] -> order: ", order);
      res.status(201).json({ success: true, order: order.result });
    } catch (error) {
      console.log("[CREATE ORDER] -> order error: ", error.message);
      res.status(401).json({ success: false, msg: error.message });
    }
  }
});

router.post("/capture-order", async (req, res, next) => {
  const { username, email, password, order, pricing } = req.body;
  console.log("[CAPTURE ORDER] -> order: ", order);
  console.log("[CAPTURE ORDER] -> pricing: ", pricing);

  let request = new paypal.orders.OrdersCreateRequest();
  request = new paypal.orders.OrdersCaptureRequest(order.orderID);
  request.requestBody({});

  const saltHash = utils.genPassword(password);

  const salt = saltHash.salt;
  const hash = saltHash.hash;

  console.log("[REGISTER] -> username: ", username);
  const newUser = new User({
    username,
    email,
    hash,
    salt,
    pricing,
    confirmationCode: utils.genEncryptedKey({ email }),
  });
  console.log("[CAPTURE ORDER] -> newUser: ", newUser);

  try {
    const user = await newUser.save();
    console.log("[CAPTURE ORDER] -> user: ", user);

    const emailResponse = await nodemailer.sendConfirmationEmail(
      user.username,
      user.email,
      user.confirmationCode
    );
    console.log("[CAPTURE ORDER] -> emailResponse: ", emailResponse);

    const orderResponse = await client.execute(request);
    console.log("[CAPTURE ORDER] -> orderResponse: ", orderResponse);

    res.json({ success: true, msg: "User successfully created" });
  } catch (err) {
    console.log("[CAPTURE ORDER] -> err: ", err.message);
    res.status(500).json({ success: false, msg: err.message });
  }
});

// Register a new user
router.post("/register", async (req, res, next) => {
  const { username, email, password } = req.body;

  const result = await User.find({ email });
  console.log("[REGISTER] -> result: ", result);

  if (result.length) {
    res.json({
      success: false,
      msg: "Email already exists",
    });
  } else {
    const saltHash = utils.genPassword(password);

    const salt = saltHash.salt;
    const hash = saltHash.hash;

    console.log("[REGISTER] -> username: ", username);
    const newUser = new User({
      username,
      email,
      hash,
      salt,
      confirmationCode: utils.genEncryptedKey({ email }),
    });
    console.log("[REGISTER] -> newUser: ", newUser);

    try {
      const user = await newUser.save();
      console.log("[REGISTER] -> user: ", user);

      const emailResponse = await nodemailer.sendConfirmationEmail(
        user.username,
        user.email,
        user.confirmationCode
      );
      console.log("[REGISTER] -> emailResponse: ", emailResponse);

      res.json({ success: true, msg: "User successfully created" });
    } catch (err) {
      console.log("[REGISTER] -> err: ", err.message);
      res.json({ success: false, msg: err.message });
    }
  }
});

router.post("/password-reset", async (req, res, next) => {
  const email = req.body.email;

  try {
    const user = await User.findOne({ email });

    const encrypted = utils.genRandomString(12);
    const resetToken = utils.genEncryptedKey({ encrypted });

    const updateResult = await User.updateOne(
      {
        _id: user._id,
      },
      { $set: { resetToken } }
    );
    console.log("[RESET PASSWORD] -> updated response: ", updateResult);
    console.log("[RESET PASSWORD] -> user: ", user);

    const passwordResetResponse =
      await nodemailer.sendPasswordResetConfirmation(
        user.username,
        user.email,
        resetToken
      );
    console.log("[REGISTER] -> passwordResetResponse: ", passwordResetResponse);

    res.json({
      success: true,
      msg: "Password change email has been successfully sent",
    });
  } catch (error) {
    res.status(502).json({
      success: false,
      msg: "Failed to generate reset link, please try again",
    });
  }
});

router.post("/password-reset/:resetToken", async (req, res, next) => {
  const resetToken = req.params.resetToken;
  console.log("[RESET PASSWORD CONFIRM] -> resetToken: ", resetToken);
  const user = await User.findOne({ resetToken });
  console.log("[RESET PASSWORD CONFIRM] -> user: ", user);

  if (!user) {
    res.status(401).json({
      success: false,
      msg: "Reset token is not valid",
    });
  }

  console.log(
    "[RESET PASSWORD CONFIRM] -> req.body.password: ",
    req.body.password
  );
  const saltHash = utils.genPassword(req.body.password);

  const salt = saltHash.salt;
  const hash = saltHash.hash;
  user.hash = hash;
  user.salt = salt;
  user.resetToken = null;

  try {
    user.save().then(() => {
      res.status(200).json({
        success: true,
        msg: "Password reset successful",
      });
    });
  } catch (err) {
    res.json({
      success: false,
      msg: err.message,
    });
  }
});

module.exports = router;
