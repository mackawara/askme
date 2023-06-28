const indvUsers = require("../../models/individualUsers");
const elevate = async (msg,chatID redisClient) => {
  const msgBody = msg.body;
  //const chatID = msg.from;

  if (msgBody.startsWith("elevate")) {
    let number = msgBody.replace("elevate", "").replace(/\s/g, "").trim();
    number += "@c.us";
    console.log(number);
    if (number.length !== 17 || /^2637\d{7}@c\.us$/.test(number)) {
      msg.reply("The number is inaccurately formmatted");
    } else {
      await indvUsers
        .updateOne(
          { serialisedNumber: number },
          { $set: { isSubscribed: true, isBlocked: false } }
        )
        .then((result) => {
          console.log(result);
          redisClient.hSet(chatID,{
            calls:0,
            isBlocked:"0",
            isSubscribed:"1",
            messages: JSON.stringify([]),
          })
          redisClient.expire(chatID,86400)
          msg.reply(`${number}, is now elevated`);
        });
    }

    return true;
  }
};
module.exports = elevate;
