const autoBind = require("auto-bind");
class AlbumsHandler {
  constructor(service, validator) {
    this._service = service;
    this._validator = validator;

    autoBind(this);
  }

  async postAlbumHandler(request, h) {
    this._validator.validateAlbumPayload(request.payload);
    const { name, year } = request.payload;

    const albumId = await this._service.addAlbum({ name, year });

    const response = h.response({
      status: "success",
      message: "Album berhasil ditambahkan",
      data: {
        albumId,
      },
    });
    response.code(201);
    return response;
  }

  async updateAlbumCover(albumId, coverUrl) {
    const query = {
      text: "UPDATE albums SET cover = $1 WHERE id = $2 RETURNING id",
      values: [coverUrl, albumId],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError("Gagal memperbarui cover album. ID tidak ditemukan");
    }
  }

  async getAlbumByIdHandler(request) {
    const { id } = request.params;
    const album = await this._service.getAlbumById(id);

    return {
      status: "success",
      data: {
        album: {
          id: album.id,
          name: album.name,
          year: album.year,
          coverUrl: album.coverUrl || null,
        },
      },
    };
  }

  async getAlbumByIdWithSongsHandler(request) {
    const { id } = request.params;
    const album = await this._service.getAlbumByIdWithSongs(id);

    return {
      status: "success",
      data: { album },
    };
  }

  async putAlbumByIdHandler(request, h) {
    this._validator.validateAlbumPayload(request.payload);
    const { id } = request.params;

    await this._service.editAlbumById(id, request.payload);

    return {
      status: "success",
      message: "Album berhasil diperbarui",
    };
  }

  async deleteAlbumByIdHandler(request, h) {
    const { id } = request.params;

    await this._service.deleteAlbumById(id);

    return {
      status: "success",
      message: "Album berhasil dihapus",
    };
  }
}

module.exports = AlbumsHandler;
