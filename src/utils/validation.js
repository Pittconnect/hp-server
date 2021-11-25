const Joi = require("joi");

// User edit validation schema
const userEditSchema = () => {
  return Joi.object({
    role: Joi.string().required(),
    location: Joi.string().allow(""),
  });
};

const userEditValidation = (data) => {
  const schema = userEditSchema();

  return schema.validate(data);
};

const usersEditValidation = (data) => {
  const schema = userEditSchema();

  return Joi.array().items(schema).validate(data, { allowUnknown: true });
};

// // pasword reset validation
// const passwordResetValidation = (data) => {
//   const schema = Joi.object({
//     token: Joi.string().required(),
//     email: Joi.string().min(6).required().email(),
//     password: Joi.string().min(6).required(),
//   });

//   return schema.validate(data);
// };

module.exports = {
  userEditValidation,
  usersEditValidation,
  //   passwordResetValidation
};
