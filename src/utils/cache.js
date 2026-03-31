import { redisClient } from "../config/redis.config.js";

export const getCache = async (key) => {
  const data = await redisClient.get(key);
  return data ? JSON.parse(data) : null;
};

export const setCache = async (key, value, ttl = 60) => {
  await redisClient.set(key, JSON.stringify(value), {
    EX: ttl, // seconds
  });
};

export const deleteCache = async (pattern) => {
  const keys = await redisClient.keys(pattern);
  if (keys.length > 0) {
    await redisClient.del(keys);
  }
};
