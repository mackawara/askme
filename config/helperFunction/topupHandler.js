const processPaynowPayment = require("../processPaynowPayment")
const redisClient = require("../redisConfig")
const messages = require("../../constants/messages")
const autoProcessSub = require("../autoProcessSub")
const { client } = require("../wwebJsConfig.js")
require("dotenv").config();

const topupHandler = async (msgBody, chatID) => {
    try {
        const topupClient = `${chatID}topup`
        const topupField = await redisClient.hGet(topupClient, 'field')
        const topupNumber = await redisClient.hGet(topupClient, "ecocashNumber")
        const isValidEconetNumber = /^(07[7-8])(\d{7})$/;
        const isValidproduct = /(payu|month|monthly|1|2)/gi
        if (topupField == "processing") {
            client.sendMessage(chatID, "Please wait for Ecocash prompt on your home screen and enter your PIN")
            return
        }
        else if (topupField == "product") {
            if (!isValidproduct.test(msgBody)) {
                client.sendMessage(chatID, messages.INVALID_TOPUP_PRODUCT)
                return
            }
            if (msgBody.includes("2")) {
                await redisClient.hSet(topupClient, "product", "payu")
            }
            else if (msgBody.includes("1")) {
                await redisClient.hSet(topupClient, "product", "monthly")
            }
            else {
                await redisClient.hSet(topupClient, "product", "payu")
            }
            await redisClient.hSet(topupClient, "field", "ecocashNumber")

            await client.sendMessage(chatID, messages.ECOCASH_NUMBER)
            return
        }
        else if (topupField == "ecocashNumber") {
            if (!isValidEconetNumber.test(msgBody)) {
                client.sendMessage(chatID, messages.INVALID_ECOCASH_NUMBER);
                return
            }
            await redisClient.hSet(topupClient, "ecocashNumber", msgBody)
        }
        const selectedTopup = await redisClient.hGet(topupClient, "product")
        await client.sendMessage(chatID, `You are subscribing for ${selectedTopup} subscription. Please wait for an Ecocash online payment pop up on your home screen. \nDo not send any more messages until you receive confirmation`);
        await redisClient.hSet(topupClient, "field", "processing")
        await processPaynowPayment(selectedTopup, topupNumber, chatID)
    }
    catch (err) {
        console.log(err)
        client.sendMessage(process.env.ME, `Topup failure for ${chatID} recorded`)
    }

}
module.exports = topupHandler