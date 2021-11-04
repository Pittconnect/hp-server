const nodemailer = require("nodemailer");

const user = process.env.MAILER_USER;
const pass = process.env.MAILER_PASS;
const domain = process.env.CLIENT_DOMAIN;

const transport = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: user,
    pass: pass,
  },
});

module.exports.sendConfirmationEmail = (name, email, confirmationCode) =>
  transport.sendMail({
    from: user,
    to: email,
    subject: "Please confirm your account",
    html: `<div><h1>Email Confirmation</h1>
          <h2>Hello, ${name}</h2>
          <p>Thank you for subscribing. Please confirm your email by clicking on the following link</p>
          <a href=${domain}/confirm/${confirmationCode}> Click here</a>
          </div>`,
  });

module.exports.sendPasswordResetConfirmation = (name, email, resetToken) =>
  transport.sendMail({
    from: user,
    to: email,
    subject: "Password reset confirmation",
    html: `<div><h1>Forget Password Email</h1>
          <h2>Hello, ${name}</h2>
          <p>You are receiving this because you (or someone else) have requested the reset of the password for your account. Please click on the following link, or paste this into your browser to complete the process:
            <a href=${domain}/password-reset/${resetToken}> Click here</a>
          </p>
          <br>
          <p>Cheers!</p>
          </div>`,
  });
