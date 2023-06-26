const indvUsers = require("../../models/individualUsers");
const elevate = async (msg, redisClient) => {
  const msgBody = msg.body;
  //const chatID = msg.from;

  if (msgBody.startsWith("elevate")) {
    let number = msgBody.replace("elevate", "").replace(/\s/g, "").trim();
    number += "@c.us";
    console.log(number);
    if (number.length !== 17 || /^2637\d{7}@c\.us$/.test(number)) {
      msg.reply("The number is inaccurately formmatted");
    } else {
      const user = await indvUsers.findOne({ serialisedNumber: number }).exec();
      user.isSubscribed = true;
      user.isBlocked = false;
      try {
        user.save().then((result) => {
          msg.reply(`${number}, is now elevated`);
        });
      } catch (err) {
        msg.reply("user no elevated");
      }
      await redisClient.hSet(number, {
        isSubscribed: "1",
      });
    }

    return true;
  }
};
module.exports = elevate;
