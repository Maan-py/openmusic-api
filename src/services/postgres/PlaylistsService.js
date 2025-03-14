const { Pool } = require("pg");
const { nanoid } = require("nanoid");
const InvariantError = require("../../exceptions/InvariantError");
const NotFoundError = require("../../exceptions/NotFoundError");
const AuthorizationError = require("../../exceptions/AuthorizationError");

class PlaylistsService {
  constructor(collaborationsService) {
    this._pool = new Pool();
    this._collaborationsService = collaborationsService;
  }

  async addPlaylist({ name, owner }) {
    const id = `playlist-${nanoid(16)}`;
    const query = {
      text: "INSERT INTO playlists (id, name, owner) VALUES ($1, $2, $3) RETURNING id",
      values: [id, name, owner],
    };

    const result = await this._pool.query(query);
    if (!result.rows.length) {
      throw new InvariantError("Playlist gagal ditambahkan");
    }

    return result.rows[0].id;
  }

  async getPlaylists(owner) {
    const query = {
      text: `
        SELECT playlists.id, playlists.name, users.username 
        FROM playlists 
        JOIN users ON users.id = playlists.owner 
        LEFT JOIN collaborations ON playlists.id = collaborations.playlist_id
        WHERE playlists.owner = $1 OR collaborations.user_id = $1
        GROUP BY playlists.id, playlists.name, users.username
      `,
      values: [owner],
    };

    const result = await this._pool.query(query);
    return result.rows;
  }

  async deletePlaylistById(id, owner) {
    await this.verifyPlaylistOwner(id, owner);

    await this._pool.query({
      text: "DELETE FROM playlist_song_activities WHERE playlist_id = $1",
      values: [id],
    });

    const query = {
      text: "DELETE FROM playlists WHERE id = $1 RETURNING id",
      values: [id],
    };

    const result = await this._pool.query(query);
    if (!result.rowCount) {
      throw new NotFoundError("Playlist gagal dihapus. Id tidak ditemukan");
    }
  }

  async verifyPlaylistOwner(playlistId, owner) {
    const query = {
      text: "SELECT owner FROM playlists WHERE id = $1",
      values: [playlistId],
    };

    const result = await this._pool.query(query);
    if (!result.rowCount) {
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
      await this._collaborationsService.verifyCollaborator(playlistId, userId);
    }
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

  async getPlaylistActivities(playlistId) {
    const query = {
      text: `
            SELECT users.username, songs.title, action, time 
            FROM playlist_song_activities
            JOIN users ON users.id = playlist_song_activities.user_id
            JOIN songs ON songs.id = playlist_song_activities.song_id
            WHERE playlist_song_activities.playlist_id = $1
            ORDER BY time ASC
        `,
      values: [playlistId],
    };

    const result = await this._pool.query(query);
    return result.rows;
  }
}

module.exports = PlaylistsService;
