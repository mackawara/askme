const elevate = async (msg, chatID, redisClient) => {
  const msgBody = msg.body;
  //const chatID = msg.from;

  if (msgBody.startsWith("elevate")) {
    let number = msgBody.replace("elevate", "").replace(/\s/g, "").trim();
    number += "@c.us";
    console.log(number);
    if (!/^2637\d{8}@c\.us$/.test(number)) {
      msg.reply("The number is inaccurately formmatted");
    } else {
      console.log(result);
      redisClient.hSet(chatID, {
        calls: 55,
        isBlocked: "0",
        isSubscribed: "1",
      });
      redisClient.expire(chatID, 259200);
      msg.reply(`${number}, is now elevated`);
      client.sendMessage(
        number,
        `*Thank you for subscribing to AskMe_AI* \nYou now have purchased a quota of 55 expiring in 72 hours, \n`
      );

    }

    return true;
  }
};
module.exports = elevate;
