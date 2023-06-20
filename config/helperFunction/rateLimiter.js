const { RateLimiterMemory } = require("rate-limiter-flexible");
const rateLimiter = async (chatID, msg) => {
  try {
    await limiter.consume(chatID); 
    console(limiter.points)
    return true//consuming request by ip address
  } catch (err) {
    return false
  
  }
  //console.log(limiter.points)
};

module.exports = rateLimiter;
