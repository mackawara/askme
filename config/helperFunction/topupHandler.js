const processPaynowPayment = require("../processPaynowPayment")
const redisClient = require("../redisConfig")
const messages = require("../../constants/messages")
const topupHandler = async (client, msgBody, chatID) => {
    console.log("this is msgbody" + msgBody)
    const topupClient = `${chatID}topup`
    const topupField = await redisClient.hGet(topupClient, 'field')
    console.log("this is topup field" + topupField)
    const topupNumber = await redisClient.hGet(topupClient, "ecocashNumber")
    console.log("the number is" + topupNumber)
    const topupProduct = await redisClient.hGet(topupClient, "product")
    const isValidEconetNumber = /^(07[7-8])(\d{7})$/;
    const isValidproduct = /(payu|month|monthly)/gi
    if (topupField == "ecocashNumber") {
        if (!isValidEconetNumber.test(msgBody)) {
            client.sendMessage(chatID, messages.INVALID_ECOCASH_NUMBER);
            return
        }
        await redisClient.hSet(topupClient, "ecocashNumber", msgBody)

        await redisClient.hSet(topupClient, "field", "product")
        await client.sendMessage(chatID, messages.TOPUP_PRODUCT)
        return
    }
    else if (topupField == "product") {
        if (!isValidproduct.test(msgBody)) {
            client.sendMessage(chatID, messages.INVALID_TOPUP_PRODUCT)
            return
        }
        await redisClient.hSet(topupClient, "product", msgBody)

        await client.sendMessage(chatID, `You are subscribing for ${msgBody} subscription. To complete the payment you will be asked to confirm payment by entering your PIN`);
        const paymentResult = await processPaynowPayment(msgBody, topupNumber, chatID)
        if (paymentResult) {
            await autoProcessSub(chatID, client, msgBody)
            await redisClient.del(topupClient)
            return
        }
        else {
            client.sendMessage(chatID, messages.TOPUP_WAS_NOT_PROCESSED)
            await redisClient.del(topupClient)
            return
        }
    }
    else {
        client.sendMessage(chatID, 'Field not founf')
    }
}
module.exports = topupHandler