const JwtStrategy = require("passport-jwt").Strategy;
const ExtractJwt = require("passport-jwt").ExtractJwt;

const User = require("mongoose").model("User");

module.exports = (passport) => {
  const secretKey = process.env.SECRET;

  // At a minimum, you must pass the `jwtFromRequest` and `secretOrKey` properties
  options = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: secretKey,
  };
  // The JWT payload is passed into the verify callback
  passport.use(
    new JwtStrategy(options, function (jwt_payload, done) {
      console.log("jwt_payload: ", jwt_payload);

      // We will assign the `sub` property on the JWT to the database ID of user
      User.findOne({ _id: jwt_payload.sub }, function (err, user) {
        // This flow look familiar?  It is the same as when we implemented
        // the `passport-local` strategy
        if (err) {
          return done(err, false);
        }
        if (user) {
          return done(null, user);
        } else {
          return done(null, false);
        }
      });
    })
  );
};
