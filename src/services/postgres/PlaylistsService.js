const { Pool } = require("pg");
const { nanoid } = require("nanoid");
const InvariantError = require("../../exceptions/InvariantError");
const NotFoundError = require("../../exceptions/NotFoundError");
const AuthorizationError = require("../../exceptions/AuthorizationError");

class PlaylistsService {
  constructor(songsService) {
    this.pool = new Pool();
    this.songsService = songsService;
  }

  async addPlaylist({ name, owner }) {
    const id = `playlist-${nanoid(16)}`;
    const query = {
      text: "INSERT INTO playlists (id, name, owner) VALUES ($1, $2, $3) RETURNING id",
      values: [id, name, owner],
    };

    const result = await this.pool.query(query);
    if (!result.rows.length) throw new InvariantError("Playlist gagal ditambahkan");

    return result.rows[0].id;
  }

  async getPlaylists(owner) {
    const query = {
      text: `
            SELECT playlists.id, playlists.name, users.username 
            FROM playlists 
            JOIN users ON users.id = playlists.owner 
            WHERE playlists.owner = $1
            GROUP BY playlists.id, playlists.name, users.username`,
      values: [owner],
    };

    const result = await this.pool.query(query);
    return result.rows;
  }

  async deletePlaylistById(id, owner) {
    await this.verifyPlaylistOwner(id, owner);

    const query = {
      text: "DELETE FROM playlists WHERE id = $1 RETURNING id",
      values: [id],
    };

    const result = await this.pool.query(query);
    if (!result.rowCount) throw new NotFoundError("Playlist gagal dihapus. Id tidak ditemukan");
  }

  async verifyPlaylistOwner(playlistId, owner) {
    const query = {
      text: "SELECT owner FROM playlists WHERE id = $1",
      values: [playlistId],
    };

    const result = await this.pool.query(query);
    if (!result.rowCount) throw new NotFoundError("Playlist tidak ditemukan");

    const playlist = result.rows[0];
    if (playlist.owner !== owner) throw new AuthorizationError("Anda tidak berhak mengakses resource ini");
  }

  async addSongToPlaylist(playlistId, songId, userId) {
    await this.verifyPlaylistOwner(playlistId, userId);
    await this.songsService.verifySongExists(songId);

    const id = `playlist-song-${nanoid(16)}`;
    const query = {
      text: "INSERT INTO playlist_songs (id, playlist_id, song_id) VALUES ($1, $2, $3) RETURNING id",
      values: [id, playlistId, songId],
    };

    const result = await this.pool.query(query);
    if (!result.rows.length) throw new InvariantError("Lagu gagal ditambahkan ke playlist");
  }

  async getSongsFromPlaylist(playlistId, userId) {
    await this.verifyPlaylistOwner(playlistId, userId);

    const playlistQuery = {
      text: `SELECT playlists.id, playlists.name, users.username 
             FROM playlists
             JOIN users ON users.id = playlists.owner
             WHERE playlists.id = $1`,
      values: [playlistId],
    };

    const playlistResult = await this.pool.query(playlistQuery);
    if (!playlistResult.rowCount) throw new NotFoundError("Playlist tidak ditemukan");

    const songsQuery = {
      text: `SELECT songs.id, songs.title, songs.performer 
             FROM playlist_songs
             JOIN songs ON songs.id = playlist_songs.song_id
             WHERE playlist_songs.playlist_id = $1`,
      values: [playlistId],
    };

    const songsResult = await this.pool.query(songsQuery);

    return {
      id: playlistResult.rows[0].id,
      name: playlistResult.rows[0].name,
      username: playlistResult.rows[0].username,
      songs: songsResult.rows,
    };
  }

  async deleteSongFromPlaylist(playlistId, songId, userId) {
    await this.verifyPlaylistOwner(playlistId, userId);

    const query = {
      text: "DELETE FROM playlist_songs WHERE playlist_id = $1 AND song_id = $2 RETURNING id",
      values: [playlistId, songId],
    };

    const result = await this.pool.query(query);
    if (!result.rowCount) throw new NotFoundError("Lagu gagal dihapus. Id tidak ditemukan");
  }
}

module.exports = PlaylistsService;
