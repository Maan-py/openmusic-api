const path = require("path");
const routes = (handler) => [
  {
    method: "POST",
    path: "/albums/{id}/covers",
    handler: (req, h) => handler.postUploadImageHandler(req, h),
    options: {
      payload: {
        allow: "multipart/form-data",
        multipart: true,
        output: "stream",
        maxBytes: 512000, // Maksimal 512KB
        parse: true,
      },
    },
  },
  {
    method: "GET",
    path: "/uploads/{param*}",
    handler: {
      directory: {
        path: path.resolve(__dirname, "file"),
      },
    },
  },
];

module.exports = routes;
