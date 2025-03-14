const autoBind = require("auto-bind");
const ClientError = require("../../exceptions/ClientError");

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
    const { id: userId } = request.auth.credentials;

    await this._service.verifyPlaylistAccess(playlistId, userId);
    await this._service.addSongToPlaylist(playlistId, songId, userId);

    const response = h.response({
      status: "success",
      message: "Lagu berhasil ditambahkan ke playlist",
    });
    response.code(201);
    return response;
  }

  async getPlaylistSongsHandler(request, h) {
    const { id: playlistId } = request.params;
    const { id: userId } = request.auth.credentials;

    await this._service.verifyPlaylistAccess(playlistId, userId);
    const playlist = await this._service.getSongsFromPlaylist(playlistId);

    return {
      status: "success",
      data: {
        playlist,
      },
    };
  }

  async deletePlaylistSongHandler(request, h) {
    this._validator.validatePlaylistSongPayload(request.payload);

    const { id: playlistId } = request.params;
    const { songId } = request.payload;
    const { id: userId } = request.auth.credentials;

    await this._service.verifyPlaylistAccess(playlistId, userId);
    await this._service.deleteSongFromPlaylist(playlistId, songId, userId);

    return {
      status: "success",
      message: "Lagu berhasil dihapus dari playlist",
    };
  }
}

module.exports = PlaylistSongsHandler;
