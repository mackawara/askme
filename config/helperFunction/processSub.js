const indvUsers = require('../../models/individualUsers');
const { client } = require('../wwebJsConfig');
const redisClient = require('../redisConfig');
const processSub = async msg => {
  const processSubField = await redisClient.hGet('admin', 'subField');
  const number = await redisClient.hGet('admin', 'number');
  const days = await redisClient.hGet('admin', 'days');
  const msgBody = await msg.body;

  if (processSubField == 'number') {
    if (!/^2637\d{8}$/.test(msgBody.replace(/\s/gi,""))) {
      msg.reply('The number is inaccurately formmatted');
      return;
    } else {
      await redisClient.hSet('admin', "number", msgBody.replace(/\s/gi,""));
      await redisClient.hSet('admin', 'subField', 'days');
      msg.reply('Please enter the number of subscription days');
      return;
    }
  } else if (processSubField == 'days') {
    const submittedDays=parseInt(msgBody.replace(/\s/g,""))
    if (submittedDays>31 ||submittedDays<1) {
      msg.reply('Please enter a number between 1-31');
      return;
    } else {
      const daysSubmited = parseInt(msgBody.replace(/\s/gi, ''));
      await redisClient.hSet('admin', 'days', daysSubmited);
    }
  }

  try {
    await indvUsers
      .updateOne(
        { number: number },
        { $set: { isSubscribed: true, isBlocked: false, subTTL: days } }
      )
      .then(async(result) => {
        console.log(result);
        redisClient.hSet(number, {
          calls: 26,
          isBlocked: '0',
          isSubscribed: '1',
        });
        await redisClient.expire(number, 86400);
        await msg.reply(`${number}, is now subscribed`);
        await client.sendMessage(
          number+"@c.us",
          `*Thank you for subscribing to AskMe_AI* \nYou now have increased quota of 25 requests per day,To find out which features are now available to you type reply with features" \n`
        );
      });
  } catch (err) {
    console.log(err);
    msg.reply('not subbed successfully');
  }
};

module.exports = processSub;
