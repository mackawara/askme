const {
    createClient,
    redis,
} = require("redis");
const redisClient = createClient();
redisClient.on("error", (err) => console.log("Redis Client Error", err));
module.exports = redisClient