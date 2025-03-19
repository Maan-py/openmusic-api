const Joi = require("joi");

const LikePayloadSchema = Joi.object({
  albumId: Joi.string().required().label("Album ID"),
  userId: Joi.string().required().label("User ID"),
});

module.exports = LikePayloadSchema;
