const { Pool } = require("pg");

class LikesService {
  constructor() {
    this._pool = new Pool();
  }

  // Cek apakah pengguna sudah menyukai album
  async checkIfAlbumLiked(userId, albumId) {
    const query = {
      text: "SELECT * FROM user_album_likes WHERE user_id = $1 AND album_id = $2",
      values: [userId, albumId],
    };

    const result = await this._pool.query(query);
    return result.rows.length > 0; // Jika ada baris, berarti album sudah disukai
  }

  // Menambahkan like ke album
  async addAlbumLike(userId, albumId) {
    const query = {
      text: "INSERT INTO user_album_likes (user_id, album_id) VALUES ($1, $2)",
      values: [userId, albumId],
    };

    await this._pool.query(query);
  }

  // Menghapus like dari album
  async removeAlbumLike(userId, albumId) {
    const query = {
      text: "DELETE FROM user_album_likes WHERE user_id = $1 AND album_id = $2",
      values: [userId, albumId],
    };

    await this._pool.query(query);
  }

  // Menghitung jumlah yang menyukai album
  async getAlbumLikesCount(albumId) {
    const query = {
      text: "SELECT COUNT(*) FROM user_album_likes WHERE album_id = $1",
      values: [albumId],
    };

    const result = await this._pool.query(query);
    return result.rows[0].count;
  }

  // Mendapatkan album berdasarkan id
  async getAlbumById(id) {
    const query = {
      text: "SELECT * FROM albums WHERE id = $1",
      values: [id],
    };

    const result = await this._pool.query(query);
    if (!result.rows.length) {
      throw new Error("Album tidak ditemukan");
    }
    return result.rows[0];
  }
}

module.exports = LikesService;
