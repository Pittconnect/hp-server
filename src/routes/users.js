const mongoose = require("mongoose");
const router = require("express").Router();
const User = mongoose.model("User");
const passport = require("passport");
const utils = require("../utils/password");
const nodemailer = require("../config/nodemailer");
// const payment = require("../config/payment");
const paypal = require("@paypal/checkout-server-sdk");

let clientId = process.env.PAYPAL_CLIENT_ID;
let clientSecret = process.env.PAYPAL_CLIENT_SECRET;
let environment = new paypal.core.SandboxEnvironment(clientId, clientSecret);
let client = new paypal.core.PayPalHttpClient(environment);

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

// Validate an existing user and issue a JWT
router.post("/login", function (req, res, next) {
  User.findOne({ username: req.body.username })
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

// Register a new user
router.post("/register", async (req, res, next) => {
  const username = req.body.username;
  let senderBatchId = `Test_SDK_${Math.random().toString(36).substring(7)}`;

  console.log("senderBatchId: ", senderBatchId);

  // const payment = {
  //   sender_batch_header: {
  //     recipient_type: "EMAIL",
  //     email_message: "Dbilia USD Payouts",
  //     note: "USD withdrawal request",
  //     sender_batch_id: new Date().toISOString(), // must be unique per batch
  //     email_subject: "[Dbilia] You've requested for withdrawal.",
  //   },
  //   items: [
  //     {
  //       note: "USD withdrawal request",
  //       amount: {
  //         currency: "USD",
  //         value: 123,
  //       },
  //       receiver: "sb-5zwh38384833@business.example.com",
  //       sender_item_id: "4FX733YULQG68",
  //     },
  //   ],
  // };
  // let payoutBacht = {
  //   sender_batch_header: {
  //     recipient_type: "EMAIL",
  //     sender_batch_id: senderBatchId,
  //     email_subject: 'TEST PAYOUT',
  //   },
  //   items: [
  //     {
  //       receiver: ,
  //       note: 'USD withdrawal request',
  //       sender_item_id: "15300979",
  //       amount: {
  //         currency: "USD",
  //         value: 103,
  //       },
  //     },
  //   ],
  // };

  const request = payment.request();
  request.requestBody({});

  let response = await payment.client().execute(request);
  console.log(`Response: ${JSON.stringify(response)}`);

  res.json({
    success: false,
    msg: "Username already exists",
  });
  return;

  const result = await User.find({ username });
  console.log("[REGISTER] -> result: ", result);

  if (result.length) {
    res.json({
      success: false,
      msg: "Username already exists",
    });
  } else {
    const saltHash = utils.genPassword(req.body.password);

    const salt = saltHash.salt;
    const hash = saltHash.hash;
    const email = req.body.email;

    console.log("[REGISTER] -> username: ", username);
    const newUser = new User({
      username,
      email,
      hash: hash,
      salt: salt,
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

      res.json({ success: true, user });
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
