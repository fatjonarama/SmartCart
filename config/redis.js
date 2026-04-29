const redis = require('redis');
const createBreaker = require('./circuitBreaker');

const redisClient = redis.createClient({
    url: process.env.REDIS_URL
});

// Funksioni që duam të mbrojmë (marrja e të dhënave)
const getFromCache = async (key) => {
    return await redisClient.get(key);
};

// Logjika Fallback nëse Redis dështon
const fallbackAction = () => {
    console.log("🔄 Fallback: Duke anashkaluar Redis, po drejtohemi te DB...");
    return null; 
};

const redisBreaker = createBreaker(getFromCache, fallbackAction);

const connectRedis = async () => {
    try {
        await redisClient.connect();
        console.log("✅ Redis u lidh me sukses në Cloud!");
    } catch (error) {
        console.error("⚠️ Gabim në lidhje me Redis.");
    }
};

module.exports = { redisClient, connectRedis, redisBreaker };