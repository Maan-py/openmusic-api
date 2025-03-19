const LikesHandler = require("./handler");
const routes = require("./routes");
const CacheService = require("../../services/redis/CacheService");

module.exports = {
  name: "likes",
  version: "1.0.0",
  register: async (server, { service, validator }) => {
    const cacheService = new CacheService();

    const likesHandler = new LikesHandler(service, validator, cacheService);

    server.route(routes(likesHandler));
  },
};
