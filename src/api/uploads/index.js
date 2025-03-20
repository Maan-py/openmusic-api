const UploadsHandler = require("./handler"); // Pastikan nama kelas benar
const routes = require("./routes");

module.exports = {
  name: "uploads",
  version: "1.0.0",
  register: async (server, { storageService, albumsService, validator }) => {
    const uploadsHandler = new UploadsHandler(storageService, albumsService, validator); // Gunakan 'UploadsHandler'
    server.route(routes(uploadsHandler));
  },
};
