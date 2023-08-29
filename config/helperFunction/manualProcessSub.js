const indvUsers = require("../../models/individualUsers");
const manualProcessSub = async (msg, client, redisClient, product) => {

  const msgBody = await msg.body;

  if (/payu/gi.test(product)) {
    let number = msgBody.replace("processPayu:", "").replace(/\s/g, "").trim();
    number += "@c.us";
    if (!/^2637\d{8}@c\.us$/.test(number)) {
      msg.reply("The number is inaccurately formmatted");
      return
    }
    redisClient.hSet(number, {
      calls: 55,
      isBlocked: "0",
      isSubscribed: "1",
    });
    redisClient.expire(number, 259200);
    client.sendMessage(process.env.ME, `Subscribtion alert${number}, is now subscribed for ${product}`);
    client.sendMessage(
      number,
      `*Thank you for subscribing to AskMe_AI* \nYou now have purchased a quota of 55 expiring in 72 hours, \n`
    );
    return
  } else {
    let number = msgBody.replace("processSub:", "").replace(/\s/g, "").trim();
    number += "@c.us";
    if (!/^2637\d{8}@c\.us$/.test(number)) {
      msg.reply("The number is inaccurately formmatted");
      return
    }
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
