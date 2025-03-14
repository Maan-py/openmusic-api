const { Pool } = require("pg");
const { nanoid } = require("nanoid");
const { mapDBToModelPlaylistSongs } = require("../../utils");
const InvariantError = require("../../exceptions/InvariantError");
const NotFoundError = require("../../exceptions/NotFoundError");
const AuthorizationError = require("../../exceptions/AuthorizationError");

class PlaylistSongsService {
  constructor(collaborationsService) {
    this._pool = new Pool();
    this._collaborationsService = collaborationsService;
  }

  async verifySongExists(songId) {
    const query = {
      text: "SELECT id FROM songs WHERE id = $1",
      values: [songId],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError("Lagu tidak ditemukan");
    }
  }

  async verifyPlaylistOwner(playlistId, owner) {
    const query = {
      text: "SELECT owner FROM playlists WHERE id = $1",
      values: [playlistId],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError("Playlist tidak ditemukan");
    }

    const playlist = result.rows[0];

    if (playlist.owner !== owner) {
      throw new AuthorizationError("Anda tidak berhak mengakses resource ini");
    }
  }

  async verifyPlaylistAccess(playlistId, userId) {
    try {
      await this.verifyPlaylistOwner(playlistId, userId);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      try {
        await this._collaborationsService.verifyCollaborator(playlistId, userId);
      } catch {
        throw new AuthorizationError("Anda tidak berhak mengakses resource ini");
      }
    }
  }

  async addSongToPlaylist(playlistId, songId, userId) {
    await this.verifySongExists(songId);
    const id = `playlist_song-${nanoid(16)}`;

    const query = {
      text: "INSERT INTO playlist_songs (id, playlist_id, song_id) VALUES ($1, $2, $3) RETURNING id",
      values: [id, playlistId, songId],
    };

    const result = await this._pool.query(query);
    if (!result.rowCount) {
      throw new InvariantError("Lagu gagal ditambahkan ke playlist");
    }

    await this.addPlaylistActivity(playlistId, songId, userId, "add");

    return result.rows[0].id;
  }

  async getSongsFromPlaylist(playlistId) {
    const query = {
      text: `
      SELECT playlists.id, playlists.name, users.username, songs.id as song_id, songs.title, songs.performer
      FROM playlists
      JOIN users ON playlists.owner = users.id
      JOIN playlist_songs ON playlists.id = playlist_songs.playlist_id
      JOIN songs ON playlist_songs.song_id = songs.id
      WHERE playlists.id = $1
    `,
      values: [playlistId],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError("Playlist tidak ditemukan atau belum berisi lagu.");
    }

    return {
      id: result.rows[0].id,
      name: result.rows[0].name,
      username: result.rows[0].username,
      songs: result.rows.map((row) => ({
        id: row.song_id,
        title: row.title,
        performer: row.performer,
      })),
    };
  }

  async deleteSongFromPlaylist(playlistId, songId, userId) {
    const checkQuery = {
      text: "SELECT id FROM playlist_songs WHERE playlist_id = $1 AND song_id = $2",
      values: [playlistId, songId],
    };
    const checkResult = await this._pool.query(checkQuery);

    if (!checkResult.rowCount) {
      throw new NotFoundError("Lagu tidak ditemukan dalam playlist");
    }

    const query = {
      text: "DELETE FROM playlist_songs WHERE playlist_id = $1 AND song_id = $2 RETURNING id",
      values: [playlistId, songId],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new InvariantError("Lagu gagal dihapus dari playlist");
    }

    await this.addPlaylistActivity(playlistId, songId, userId, "delete");
  }

  async addPlaylistActivity(playlistId, songId, userId, action) {
    const id = `activity-${nanoid(16)}`;

    const query = {
      text: `INSERT INTO playlist_song_activities (id, playlist_id, song_id, user_id, action, time) 
             VALUES ($1, $2, $3, $4, $5, NOW())`,
      values: [id, playlistId, songId, userId, action],
    };

    await this._pool.query(query);
  }
}

module.exports = PlaylistSongsService;
