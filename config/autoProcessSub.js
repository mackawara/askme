const indvUsers = require('../models/individualUsers');
const redisClient = require('./redisConfig');
const { client } = require('../config/wwebJsConfig');
const Utils = require('../Utils/index');
const system = require('../constants/system');
const tokenUsers = require('../models/tokenUsers');
const addSecs = require('date-fns/addSeconds');
const format = require('date-fns/format');
const autoProcessSub = async (chatID, product, amount) => {
  let purchasedTokens, newExp, tokenUser;
  try {
    if (product == 'monthly') {
      await indvUsers
        .updateOne(
          { serialisedNumber: chatID },
          { $set: { isSubscribed: true, isBlocked: false, subTTL: 31 } }
        )
        .then(async () => {
          redisClient.hSet(chatID, {
            calls: 26,
            isBlocked: '0',
            isSubscribed: '1',
          });
          await redisClient.expire(chatID, 86400);
          await client.sendMessage(
            process.env.ME,
            `Automatic subscribtion alert !!\n${chatID}, is now subscribed`
          );
          await client.sendMessage(
            chatID,
            `*Thank you for subscribing to AskMe_AI* \nYou now have increased quota of 25 requests per day,To find out which features are now available to you type reply with features" \n`
          );
        });
    } else if (product == 'payu') {
      redisClient.hSet(chatID, {
        calls: 55,
        isBlocked: '0',
        isSubscribed: '1',
      });
      redisClient.expire(chatID, 259200);
      client.sendMessage(
        process.env.ME,
        `Automatic subscribtion alert${chatID}, is now subscribed for ${product}`
      );
      client.sendMessage(
        chatID,
        `*Thank you for subscribing to AskMe_AI* \nYou now have purchased a quota of 55 expiring in 72 hours,To find out which features are now available to you type reply with *features*" \n`
      );
    } else if (product == 'token') {
      try {
        purchasedTokens = (amount / system.tokenFactor) * 1000;
        const twoDaysInMS = 172800;
        const fiveDaysInMS = 432000;
        const redisExpiryTime = Utils.getSecsToMidnight();
        const duration = purchasedTokens < 10000 ? twoDaysInMS : fiveDaysInMS;
        newExp = addSecs(Date.now(), duration);

        tokenUser = await tokenUsers.findOne({ userId: chatID });

        if (tokenUser) {
          const existingTokens = tokenUser.availableTokens;
          tokenUser.availableTokens = existingTokens + purchasedTokens;
          tokenUser.expireAt = newExp;
          await tokenUser.save();
        } else {
          const newTokenUser = new tokenUsers({
            availableTokens: purchasedTokens,
            inputTokens: 0,
            outputTokens: 0,
            totalToken: 0,
            userId: chatID,
            createdAt: Date.now(),
            expireAt: newExp,
          });

          await newTokenUser.save();
        }
        await redisClient.hSet(chatID, {
          availableTokens: tokenUser.availableTokens,
          isBlocked: '0',
          isSubscribed: '1',
          calls: 1,
          isTokenUser: '1',
        });
        await redisClient.expire(chatID, redisExpiryTime);

        client.sendMessage(
          chatID,
          `*Thank you for using AskMe_AI* \nYou now have ${
            tokenUser?.availableTokens
              ? tokenUser.availableTokens
              : purchasedTokens
          } tokens expiring on ${format(
            newExp,
            'PPpp'
          )},\n\nYou can check your token balance at any time by sending the word *balance* \n`
        );
      } catch (err) {
        console.log(err);
        client.sendMessage(process.env.ME, `Token user not saved in DB`);
      }
      client.sendMessage(
        process.env.ME,
        `Automatic subscribtion alert ${chatID}, is now subscribed for ${product}`
      );
    }
  } catch (err) {
    console.log(err);
  }
};

module.exports = autoProcessSub;
