const { createClient } = require("redis");

let client;

async function connectRedis() {
	// prevent multiple connections
	if (client && client.isOpen) {
		return client;
	}

	client = createClient({
		url: process.env.REDIS_URL,
	});

	client.on("error", (err) => {
		console.log("Redis error", err);
	});

	await client.connect();

	console.log("✅ Redis connected");
}

async function getRedisClient() {
	if (!client) {
		throw new Error("Redis not connected yet!");
	}
	return client;
}

module.exports = { getRedisClient, connectRedis };
