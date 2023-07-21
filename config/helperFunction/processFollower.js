const indvUsers = require("../../models/individualUsers");
const processFollower = async (msg, client, redisClient) => {
  const msgBody = await msg.body;
  let number = msgBody
    .replace("processFollower:", "")
    .replace(/\s/g, "")
    .trim();
  number += "@c.us";
  console.log(number);
  if (!/^2637\d{8}@c\.us$/.test(number)) {
    msg.reply("The number is inaccurately formmatted");
  } else {
    await indvUsers
      .updateOne({ serialisedNumber: number }, { $set: { isFollower: true } })
      .then((result) => {
        console.log(result);
        redisClient.hSet(number, {
          calls: 0,
          isBlocked: "0",
          isSubscribed: "1",
          isFollower: "1",
        });
        // redisClient.expire(number, 86400);
        msg.reply(`${number}, is now a reg Follower`);
        client.sendMessage(
          number,
          `*Thank you for following AskMe_AI* \nYou now have increased quota of 3 requests per day,You can get additional referal bonus by referring your friends/classmates. simply send us "referal 2637*******" replace ** with the actual number \n`
        );
      });
  }
};

module.exports = processFollower;
