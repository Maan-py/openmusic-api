const Redis = require("ioredis");

class CacheService {
  constructor() {
    this._redis = new Redis({
      host: process.env.REDIS_SERVER, 
    });
  }

  async set(key, value, ttlInSeconds) {
    await this._redis.setex(key, ttlInSeconds, value); 
  }

  async get(key) {
    const value = await this._redis.get(key);
    return value;
  }

  async del(key) {
    await this._redis.del(key); 
  }
}

module.exports = CacheService;
