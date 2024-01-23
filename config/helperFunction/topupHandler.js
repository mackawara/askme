const processPaynowPayment = require('../processPaynowPayment');
const redisClient = require('../redisConfig');
const messages = require('../../constants/messages');
const autoProcessSub = require('../autoProcessSub');
const { client } = require('../wwebJsConfig.js');
const { isInteger } = require('../../Utils/index');
require('dotenv').config();

const topupHandler = async (msgBody, chatID) => {
  try {
    const topupClient = `${chatID}topup`;
    const topupStage = await redisClient.hGet(topupClient, 'field');

    const isValidEconetNumber = /^(07[7-8])(\d{7})$/;
    const isValidproduct = /(payu|month|monthly|1|2)/gi; //remove token

    switch (topupStage) {
      case 'processing':
        client.sendMessage(chatID, messages.TOPUP_PROCESSING_WAIT);
        break;
      case 'product':
        if (!isValidproduct.test(msgBody)) {
          client.sendMessage(chatID, messages.INVALID_TOPUP_PRODUCT);
          return;
        }
        if (msgBody.includes('2') || /payu|2/gi.test(msgBody)) {
          await redisClient.hSet(topupClient, 'product', 'payu');
        } else if (msgBody.includes('1') || /monthly|1/gi.test(msgBody)) {
          await redisClient.hSet(topupClient, 'product', 'monthly');
        } else if (/token|3/gi.test(msgBody)) {
          await redisClient.hSet(topupClient, 'product', 'token');
          await redisClient.hSet(topupClient, 'field', 'tokenAmount');
          await client.sendMessage(chatID, messages.ENTER_TOKEN_AMOUNT);
          return;
        }
        await redisClient.hSet(topupClient, 'field', 'ecocashNumber');

        await client.sendMessage(chatID, messages.ECOCASH_NUMBER);
        break;
      case 'tokenAmount':
        if (!isInteger(msgBody)) {
          client.sendMessage(chatID, messages.ENTER_VALID_AMOUNT);
          return;
        }
        const tokenAmount = parseInt(msgBody);
        if (tokenAmount < 50) {
          client.sendMessage(chatID, messages.ENTER_MINIMUM_OF_FIFTY);
          return;
        }
        await redisClient.hSet(topupClient, 'tokenAmount', parseInt(msgBody));
        await redisClient.hSet(topupClient, 'field', 'ecocashNumber');
        await client.sendMessage(chatID, messages.ECOCASH_NUMBER);
        break;
      case 'ecocashNumber':
        if (!isValidEconetNumber.test(msgBody)) {
          client.sendMessage(chatID, messages.INVALID_ECOCASH_NUMBER);
          break;
        }
        await redisClient.hSet(topupClient, 'ecocashNumber', msgBody);
        await redisClient.hSet(topupClient, 'field', 'processing');

        const selectedTopup = await redisClient.hGet(topupClient, 'product');
        const topupNumber = await redisClient.hGet(
          topupClient,
          'ecocashNumber'
        );
        await client.sendMessage(
          chatID,
          `You are subscribing for ${selectedTopup} subscription. Please wait for an Ecocash online payment pop up on your home screen. \nDo not send any more messages until you receive confirmation`
        );
        await processPaynowPayment(selectedTopup, topupNumber, chatID);
      default:
        break;
    }
  } catch (err) {
    console.log(err);
    client.sendMessage(process.env.ME, `Topup failure for ${chatID} recorded`);
    await redisClient.del(`${chatID}topup`);
  }
};
module.exports = topupHandler;
