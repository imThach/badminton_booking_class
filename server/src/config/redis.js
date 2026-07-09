const Redis = require('ioredis');

let client;
let connectPromise;

exports.getRedisClient = async () => {
    if (!process.env.REDIS_URL) return null;
    if (!client) {
        client = new Redis(process.env.REDIS_URL, {
            lazyConnect: true,
            enableOfflineQueue: false,
            maxRetriesPerRequest: 1,
            connectTimeout: Number(process.env.REDIS_CONNECT_TIMEOUT_MS || 3000),
            keyPrefix: process.env.REDIS_KEY_PREFIX || 'badminton:',
        });
        client.on('error', (error) => console.error('Redis error:', error.message));
    }
    if (client.status === 'ready') return client;
    if (!connectPromise) {
        connectPromise = client.connect().finally(() => { connectPromise = null; });
    }
    await connectPromise;
    return client;
};

exports.closeRedisClient = async () => {
    if (client?.status === 'ready') await client.quit();
};
