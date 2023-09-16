const elevate = async (msg, client, redisClient) => {
  const msgBody = msg.body;
  //const chatID = msg.from;
  if (msgBody.startsWith("elevate")) {
    let number = msgBody.replace("elevate", "").replace(/\s/g, "").trim();
    number += "@c.us";
    
    if (!/^2637\d{8}@c\.us$/.test(number)) {
      msg.reply("The number is inaccurately formatted\nUse this format 263771231334");
      return false
    } else {
      redisClient.hSet(number, {
        calls: 55,
        isBlocked: "0",
        isSubscribed: "1",
      });
      redisClient.expire(number, 259200);
      if (!msg.from == process.env.ME) {
        client.sendMessage(process.env.ME, (`${number}, is now elevated`))
      }
      msg.reply(`${number}, is now elevated`);
      client.sendMessage(
        number,`*Thank you for subscribing to AskMe_AI* \nYou now have purchased a quota of 55 expiring in 72 hours, \n`
      );
    }
    return true;
  }
  else return false
};
module.exports = elevate;
