const redis = require('redis');
const config = require('./config');
const logger = require('../utils/logger');

let redisClient = null;

async function connectRedis() {
  if (redisClient) {
    return redisClient;
  }

  redisClient = redis.createClient({
    socket: {
      host: config.redis.host,
      port: config.redis.port
    },
    password: config.redis.password
  });

  redisClient.on('error', (err) => {
    logger.error('Redis Client Error', err);
  });

  redisClient.on('connect', () => {
    logger.info('Redis connected successfully');
  });

  await redisClient.connect();
  return redisClient;
}

function getRedisClient() {
  if (!redisClient) {
    throw new Error('Redis client not initialized. Call connectRedis() first.');
  }
  return redisClient;
}

async function cacheGet(key) {
  try {
    const client = getRedisClient();
    const value = await client.get(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    logger.error('Redis GET error', { key, error });
    return null;
  }
}

async function cacheSet(key, value, expirationSeconds = 3600) {
  try {
    const client = getRedisClient();
    await client.setEx(key, expirationSeconds, JSON.stringify(value));
    return true;
  } catch (error) {
    logger.error('Redis SET error', { key, error });
    return false;
  }
}

async function cacheDelete(key) {
  try {
    const client = getRedisClient();
    await client.del(key);
    return true;
  } catch (error) {
    logger.error('Redis DELETE error', { key, error });
    return false;
  }
}

async function cacheDeletePattern(pattern) {
  try {
    const client = getRedisClient();
    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await client.del(keys);
    }
    return true;
  } catch (error) {
    logger.error('Redis DELETE pattern error', { pattern, error });
    return false;
  }
}

module.exports = {
  connectRedis,
  getRedisClient,
  cacheGet,
  cacheSet,
  cacheDelete,
  cacheDeletePattern
};