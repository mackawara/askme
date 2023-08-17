const indvUsers = require("../../models/individualUsers");
const manualProcessSub = async (msg, client, redisClient) => {
  const msgBody = await msg.body;
  let number = msgBody.replace("processSub:", "").replace(/\s/g, "").trim();
  number += "@c.us";
  console.log(number);
  if (!/^2637\d{8}@c\.us$/.test(number)) {
    msg.reply("The number is inaccurately formmatted");
  } else {
    await indvUsers
      .updateOne(
        { serialisedNumber: number },
        { $set: { isSubscribed: true, isBlocked: false, subTTL: 31 } }
      )
      .then((result) => {
        console.log(result);
        redisClient.hSet(number, {
          calls: 26,
          isBlocked: "0",
          isSubscribed: "1",
        });
        redisClient.expire(number, 86400);
        msg.reply(`${number}, is now subscribed`);
        client.sendMessage(
          number,
          `*Thank you for subscribing to AskMe_AI* \nYou now have increased quota of 25 requests per day,To find out which features are now available to you type reply with features" \n`
        );
      });
  }
};

module.exports = manualProcessSub;
