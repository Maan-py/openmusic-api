const autoBind = require("auto-bind");

class LikesHandler {
  constructor(service, validator, cacheService) {
    this._service = service;
    this._validator = validator;
    this._cache = cacheService; 
    autoBind(this);
  }

  async likeAlbumHandler(request, h) {
    const { id } = request.params;
    const { id: userId } = request.auth.credentials;

    try {
      await this._service.getAlbumById(id);

      const isLiked = await this._service.checkIfAlbumLiked(userId, id);
      if (isLiked) {
        return h
          .response({
            status: "fail",
            message: "Anda sudah menyukai album ini",
          })
          .code(400);
      }

      await this._service.addAlbumLike(userId, id);

      await this._cache.del(`album_likes_count:${id}`);

      return h
        .response({
          status: "success",
          message: "Album berhasil disukai",
        })
        .code(201);
    } catch (error) {
      if (error.message === "Album tidak ditemukan") {
        return h
          .response({
            status: "fail",
            message: error.message,
          })
          .code(404);
      }
      return h
        .response({
          status: "fail",
          message: error.message,
        })
        .code(400);
    }
  }

  async unlikeAlbumHandler(request, h) {
    const { id } = request.params;
    const { id: userId } = request.auth.credentials;

    try {
      await this._service.getAlbumById(id); 

      const isLiked = await this._service.checkIfAlbumLiked(userId, id);
      if (!isLiked) {
        return h
          .response({
            status: "fail",
            message: "Anda belum menyukai album ini",
          })
          .code(400);
      }

      await this._service.removeAlbumLike(userId, id);

      await this._cache.del(`album_likes_count:${id}`);

      return h
        .response({
          status: "success",
          message: "Album berhasil dibatalkan dari daftar suka",
        })
        .code(200);
    } catch (error) {
      if (error.message === "Album tidak ditemukan") {
        return h
          .response({
            status: "fail",
            message: error.message,
          })
          .code(404); 
      }
      return h
        .response({
          status: "fail",
          message: error.message,
        })
        .code(400);
    }
  }

  async getAlbumLikesCountHandler(request, h) {
    const { id } = request.params;

    try {
      const cacheKey = `album_likes_count:${id}`;
      let likeCount = await this._cache.get(cacheKey);

      if (likeCount !== null) {
        return h
          .response({
            status: "success",
            data: {
              albumId: id,
              likes: parseInt(likeCount),
            },
          })
          .header("X-Data-Source", "cache");
      }

      await this._service.getAlbumById(id);
      likeCount = await this._service.getAlbumLikesCount(id);

      await this._cache.set(cacheKey, likeCount, 1800); 

      return h
        .response({
          status: "success",
          data: {
            albumId: id,
            likes: parseInt(likeCount),
          },
        })
        .header("X-Data-Source", "database");
    } catch (error) {
      if (error.message === "Album tidak ditemukan") {
        return h
          .response({
            status: "fail",
            message: error.message,
          })
          .code(404); 
      }
      return h
        .response({
          status: "fail",
          message: error.message,
        })
        .code(400);
    }
  }
}

module.exports = LikesHandler;
