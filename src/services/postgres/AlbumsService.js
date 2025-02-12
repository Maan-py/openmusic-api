const { Pool } = require("pg");
const { nanoid } = require("nanoid");
const { mapDBToModelAlbum } = require("../../utils");
const NotFoundError = require("../../exceptions/NotFoundError");
const InvariantError = require("../../exceptions/InvariantError");

class AlbumsService {
  constructor() {
    this._pool = new Pool();
  }

  async addAlbum({ name, year }) {
    const id = `album-${nanoid(16)}`;

    const query = {
      text: "INSERT INTO albums (id, name, year) VALUES ($1, $2, $3) RETURNING id",
      values: [id, name, year],
    };

    const result = await this._pool.query(query);

    if (!result.rows[0].id) {
      throw new InvariantError("Album gagal ditambahkan");
    }

    return result.rows[0].id;
  }

  async getAlbumById(id) {
    const query = {
      text: "SELECT * FROM albums WHERE id = $1",
      values: [id],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError("Album tidak ditemukan");
    }

    return result.rows.map(mapDBToModelAlbum)[0];
  }

  async getAlbumByIdWithSongs(albumId) {
    const albumQuery = {
      text: "SELECT * FROM albums WHERE id = $1",
      values: [albumId],
    };

    const albumResult = await this._pool.query(albumQuery);

    if (!albumResult.rows.length) {
      throw new NotFoundError("Album tidak ditemukan");
    }

    const songsQuery = {
      text: 'SELECT s.id, s.title, s.performer FROM songs s WHERE s."albumId" = $1',
      values: [albumId],
    };

    const songsResult = await this._pool.query(songsQuery);

    // if (!songsResult.rows.length) {
    //   throw new NotFoundError("Lagu tidak ditemukan");
    // }

    return {
      id: albumResult.rows[0].id,
      name: albumResult.rows[0].name,
      year: albumResult.rows[0].year,
      songs: songsResult.rows,
    };
  }

  async editAlbumById(id, { name, year }) {
    const query = {
      text: "UPDATE albums SET name = $1, year = $2 WHERE id = $3 RETURNING ID",
      values: [name, year, id],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError("Gagal memperbarui album. Album tidak ditemukan");
    }
  }

  async deleteAlbumById(id) {
    const query = {
      text: "DELETE FROM albums WHERE id = $1",
      values: [id],
    };

    const result = await this._pool.query(query);

    if (result.rowCount === 0) {
      throw new NotFoundError("Album gagal dihapus. Id tidak ditemukan");
    }
  }
}

module.exports = AlbumsService;
