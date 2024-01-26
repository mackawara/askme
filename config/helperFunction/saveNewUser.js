const usersModel = require('../../models/individualUsers');
const redisClient = require('../redisConfig');
const { client } = require('../wwebJsConfig');
const Utils = require('../../Utils/index');
const expiryTime = Utils.getSecsToMidnight();
require('dotenv').config();
const saveNewUser = async (chatID, notifyName, number) => {
  const newContact = new usersModel({
    date: new Date().toISOString().slice(0, 10),
    isBlocked: false,
    notifyName: notifyName,
    number: number,
    serialisedNumber: chatID,
    isSubscribed: false,
    referalList: [],
    errorsRec: 0,
    totalTokens: 0,
    inputTokens: 0,
    completionTokens: 0,
    isFollower: false,
    tokensPerCall: 0,
    costPerCall: 0,
    subTTL: 30,
    costPerDay: 0,
    callsPerDay: 0,
    warnings: 0,
    calls: 0,
    callsThisMonth: 0,
    timestamp: Date.now(),
  });
  try {
    await newContact.save();
    await redisClient.hSet(chatID, {
      isBlocked: '0',
      isSubscribed: '0',
      isFollower: '1',
      calls: 3,
    });
    await redisClient.expire(chatID, expiryTime);
    await client.sendMessage('263775231426@c.us', 'new user saved ' + chatID);
    return true;
  } catch (err) {
    client.sendMessage(process.env.ME, 'Save new user failed');
    console.log(err.errors);
    return false;
  }
};

module.exports = saveNewUser;
