const autoBind = require("auto-bind");
class LikesHandler {
  constructor(service, validator) {
    this._service = service;
    this._validator = validator;
    autoBind(this);
  }

  // Menyukai album
  async likeAlbumHandler(request, h) {
    const { id } = request.params;
    const { id: userId } = request.auth.credentials;

    try {
      await this._service.getAlbumById(id); // Memastikan album ada

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
          .code(404); // Ubah kode status menjadi 404
      }
      return h
        .response({
          status: "fail",
          message: error.message,
        })
        .code(400);
    }
  }

  // Batal menyukai album
  async unlikeAlbumHandler(request, h) {
    const { id } = request.params;
    const { id: userId } = request.auth.credentials;

    try {
      await this._service.getAlbumById(id); // Memastikan album ada

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
          .code(404); // Ubah kode status menjadi 404
      }
      return h
        .response({
          status: "fail",
          message: error.message,
        })
        .code(400);
    }
  }

  // Melihat jumlah yang menyukai album
  async getAlbumLikesCountHandler(request) {
    const { id } = request.params;

    try {
      await this._service.getAlbumById(id);

      const likeCount = await this._service.getAlbumLikesCount(id);

      return {
        status: "success",
        data: {
          albumId: id,
          likes: parseInt(likeCount),
        },
      };
    } catch (error) {
      if (error.message === "Album tidak ditemukan") {
        return h
          .response({
            status: "fail",
            message: error.message,
          })
          .code(404); // Ubah kode status menjadi 404
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
