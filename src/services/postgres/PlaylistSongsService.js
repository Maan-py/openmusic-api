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

  async addSongToPlaylist(playlistId, songId) {
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

    return mapDBToModelPlaylistSongs(result.rows[0], result.rows);
  }

  async deleteSongFromPlaylist(playlistId, songId, userId) {
    // ✅ Pastikan pemilik playlist atau kolaborator bisa menghapus lagu
    try {
      await this.verifyPlaylistOwner(playlistId, userId);
    } catch (error) {
      if (error instanceof AuthorizationError) {
        await this._collaborationsService.verifyCollaborator(playlistId, userId);
      } else {
        throw error;
      }
    }

    const query = {
      text: "DELETE FROM playlist_songs WHERE playlist_id = $1 AND song_id = $2 RETURNING id",
      values: [playlistId, songId],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new InvariantError("Lagu gagal dihapus dari playlist. Id tidak ditemukan");
    }
  }
}

module.exports = PlaylistSongsService;
