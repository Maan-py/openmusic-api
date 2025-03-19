const Joi = require("joi");

const ImageHeadersSchema = Joi.object({
  "content-type": Joi.string().valid("image/jpeg", "image/png", "image/jpg").required(),
}).unknown();

module.exports = { ImageHeadersSchema };
