const { Pool } = require("pg");
const CacheService = require("../redis/CacheService");

class LikesService {
  constructor() {
    this._pool = new Pool();
    this._cache = new CacheService(); 
  }

  async checkIfAlbumLiked(userId, albumId) {
    const query = {
      text: "SELECT * FROM user_album_likes WHERE user_id = $1 AND album_id = $2",
      values: [userId, albumId],
    };

    const result = await this._pool.query(query);
    return result.rows.length > 0; 
  }

  async addAlbumLike(userId, albumId) {
    const query = {
      text: "INSERT INTO user_album_likes (user_id, album_id) VALUES ($1, $2)",
      values: [userId, albumId],
    };

    await this._pool.query(query);

    const cacheKey = `album_likes_count:${albumId}`;
    await this._cache.del(cacheKey); 
  }

  async removeAlbumLike(userId, albumId) {
    const query = {
      text: "DELETE FROM user_album_likes WHERE user_id = $1 AND album_id = $2",
      values: [userId, albumId],
    };

    await this._pool.query(query);

    const cacheKey = `album_likes_count:${albumId}`;
    await this._cache.del(cacheKey); 
  }

  async getAlbumLikesCount(albumId) {
    const cacheKey = `album_likes_count:${albumId}`;

    const cachedResult = await this._cache.get(cacheKey);
    if (cachedResult) {
      console.log(`Cache hit for album ${albumId}: ${cachedResult}`);
      return cachedResult; 
    }

    const query = {
      text: "SELECT COUNT(*) FROM user_album_likes WHERE album_id = $1",
      values: [albumId],
    };

    const result = await this._pool.query(query);
    const likeCount = result.rows[0].count;

    await this._cache.set(cacheKey, likeCount, 1800); 
    return likeCount;
  }

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
