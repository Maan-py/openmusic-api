const routers = (handler) => [
  {
    method: "POST",
    path: "/albums/{id}/likes",
    handler: handler.likeAlbumHandler,
    options: {
      auth: "openmusic_jwt", // Autentikasi diperlukan
    },
  },
  {
    method: "DELETE",
    path: "/albums/{id}/likes",
    handler: handler.unlikeAlbumHandler,
    options: {
      auth: "openmusic_jwt", // Autentikasi diperlukan
    },
  },
  {
    method: "GET",
    path: "/albums/{id}/likes",
    handler: handler.getAlbumLikesCountHandler,
  },
];

module.exports = routers;
