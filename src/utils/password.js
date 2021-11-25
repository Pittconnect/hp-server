const crypto = require("crypto");
const jsonwebtoken = require("jsonwebtoken");

const secretKey = process.env.SECRET;

function genPassword(password) {
  const salt = crypto.randomBytes(32).toString("hex");
  const genHash = crypto
    .pbkdf2Sync(password, salt, 10000, 64, "sha512")
    .toString("hex");

  return {
    salt,
    hash: genHash,
  };
}

function validPassword(password, hash, salt) {
  var hashVerify = crypto
    .pbkdf2Sync(password, salt, 10000, 64, "sha512")
    .toString("hex");
  return hash === hashVerify;
}

function issueJWT(user) {
  const { _id, role } = user;

  const expiresIn = "1d";

  const payload = {
    sub: _id,
    role,
  };

  const signedToken = jsonwebtoken.sign(payload, secretKey, {
    expiresIn,
  });

  return {
    token: "bearer " + signedToken,
    expires: expiresIn,
  };
}

function genEncryptedKey(fields) {
  const encrypted = jsonwebtoken.sign({ ...fields }, secretKey);

  return encrypted;
}

function genRandomString(length) {
  let result = "";
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

module.exports.validPassword = validPassword;
module.exports.genPassword = genPassword;
module.exports.issueJWT = issueJWT;
module.exports.genEncryptedKey = genEncryptedKey;
module.exports.genRandomString = genRandomString;
