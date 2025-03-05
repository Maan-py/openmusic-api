const autoBind = require("auto-bind");

class PlaylistSongsHandler {
  constructor(service, validator) {
    this._service = service;
    this._validator = validator;

    autoBind(this);
  }

  async postPlaylistSongHandler(request, h) {
    this._validator.validatePlaylistSongPayload(request.payload);
    const { songId } = request.payload;
    const { id: playlistId } = request.params;
    const { id: owner } = request.auth.credentials;

    await this._service.verifyPlaylistOwner(playlistId, owner);

    await this._service.addSongToPlaylist(playlistId, songId);

    const response = h.response({
      status: "success",
      message: "Lagu berhasil ditambahkan ke playlist",
    });
    response.code(201);
    return response;
  }

  async getPlaylistSongsHandler(request, h) {
    const { id: playlistId } = request.params;
    const { id: owner } = request.auth.credentials;

    await this._service.verifyPlaylistOwner(playlistId, owner);

    const playlist = await this._service.getSongsFromPlaylist(playlistId);

    return {
      status: "success",
      data: {
        playlist,
      },
    };
  }

  async deletePlaylistSongHandler(request, h) {
    const { id: playlistId } = request.params;
    const { songId } = request.payload;
    const { id: owner } = request.auth.credentials;

    await this._service.verifyPlaylistOwner(playlistId, owner);

    await this._service.deleteSongFromPlaylist(playlistId, songId);

    return {
      status: "success",
      message: "Lagu berhasil dihapus dari playlist",
    };
  }
}

module.exports = PlaylistSongsHandler;
