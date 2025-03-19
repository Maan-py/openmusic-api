const InvariantError = require("../../exceptions/InvariantError");
const { ImageHeadersSchema } = require("./schema"); // Pastikan `schema.js` mengekspor ini

const UploadsValidator = {
  validateImageHeaders: (headers) => {
    const validationResult = ImageHeadersSchema.validate(headers);
    if (validationResult.error) {
      throw new InvariantError(validationResult.error.message);
    }
  },
};

module.exports = UploadsValidator;
