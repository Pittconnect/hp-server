const passport = require("passport");

const verifiedFunction = (req, res, next) =>
  passport.authenticate("jwt", { session: false }, (err, user) => {
    if (err) return next(err);
    if (!user)
      return res.status(401).json({
        success: false,
        msg: "Not authorized",
      });

    req.user = user;
    next();
  })(req, res, next);

const checkAdmin = (req, res, next) => {
  // Gather the jwt access token from the request header
  console.log("[CHECK ADMIN] -> req: ", req.user);

  if (req.user.role === "admin") {
    return next();
  }
  return res.status(401).json({
    success: false,
    msg: "You don't have a permissions for this action",
  });
};

module.exports = { verifiedFunction, checkAdmin };
