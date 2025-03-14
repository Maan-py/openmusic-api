const { Pool } = require("pg");
const InvariantError = require("../../exceptions/InvariantError");
const NotFoundError = require("../../exceptions/NotFoundError");
const AuthorizationError = require("../../exceptions/AuthorizationError");
const { nanoid } = require("nanoid");

class CollaborationsService {
  constructor() {
    this._pool = new Pool();
  }

  async verifyPlaylistAccess(playlistId, userId) {
    const ownerQuery = {
      text: "SELECT owner FROM playlists WHERE id = $1",
      values: [playlistId],
    };

    const ownerResult = await this._pool.query(ownerQuery);

    if (!ownerResult.rowCount) {
      throw new NotFoundError("Playlist tidak ditemukan");
    }

    if (ownerResult.rows[0].owner === userId) {
      return;
    }

    const collabQuery = {
      text: "SELECT 1 FROM collaborations WHERE playlist_id = $1 AND user_id = $2",
      values: [playlistId, userId],
    };

    const collabResult = await this._pool.query(collabQuery);

    if (!collabResult.rowCount) {
      throw new AuthorizationError("Anda tidak memiliki akses ke playlist ini");
    }
  }

  async verifyCollaborator(playlistId, userId) {
    const query = {
      text: "SELECT 1 FROM collaborations WHERE playlist_id = $1 AND user_id = $2",
      values: [playlistId, userId],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new AuthorizationError("Anda tidak memiliki akses ke playlist ini");
    }
  }

  async addCollaboration(playlistId, userId) {
    const userCheckQuery = {
      text: "SELECT id FROM users WHERE id = $1",
      values: [userId],
    };
    const userCheckResult = await this._pool.query(userCheckQuery);

    if (!userCheckResult.rowCount) {
      throw new NotFoundError("User tidak ditemukan");
    }

    const playlistCheckQuery = {
      text: "SELECT owner FROM playlists WHERE id = $1",
      values: [playlistId],
    };
    const playlistCheckResult = await this._pool.query(playlistCheckQuery);

    if (!playlistCheckResult.rowCount) {
      throw new NotFoundError("Playlist tidak ditemukan");
    }

    const { owner } = playlistCheckResult.rows[0];

    if (owner === userId) {
      throw new InvariantError("Pemilik playlist tidak bisa menjadi kolaborator");
    }

    const existingCollabQuery = {
      text: "SELECT 1 FROM collaborations WHERE playlist_id = $1 AND user_id = $2",
      values: [playlistId, userId],
    };

    const existingCollabResult = await this._pool.query(existingCollabQuery);

    if (existingCollabResult.rowCount) {
      throw new InvariantError("User sudah menjadi kolaborator dalam playlist ini");
    }

    const id = `collab-${nanoid(16)}`;
    const insertQuery = {
      text: "INSERT INTO collaborations (id, playlist_id, user_id) VALUES($1, $2, $3) RETURNING id",
      values: [id, playlistId, userId],
    };

    const result = await this._pool.query(insertQuery);

    if (!result.rowCount) {
      throw new InvariantError("Kolaborasi gagal ditambahkan");
    }

    return result.rows[0].id;
  }

  async deleteCollaboration(playlistId, userId) {
    const checkQuery = {
      text: "SELECT id FROM collaborations WHERE playlist_id = $1 AND user_id = $2",
      values: [playlistId, userId],
    };

    const checkResult = await this._pool.query(checkQuery);
    if (!checkResult.rowCount) {
      throw new NotFoundError("Kolaborasi tidak ditemukan");
    }

    const deleteQuery = {
      text: "DELETE FROM collaborations WHERE playlist_id = $1 AND user_id = $2 RETURNING id",
      values: [playlistId, userId],
    };

    const deleteResult = await this._pool.query(deleteQuery);
    if (!deleteResult.rowCount) {
      throw new InvariantError("Kolaborasi gagal dihapus");
    }

    return deleteResult.rows[0].id;
  }
}

module.exports = CollaborationsService;
