const processPaynowPayment = require("../processPaynowPayment")
const redisClient = require("../redisConfig")
const messages = require("../../constants/messages")
const topupHandler = async (client, msgBody, chatID) => {
    const topupClient = `${chatID}topup`
    const topupField = redisClient.hGet(topupClient, 'field')
    const topupNumber = await redisClient.hGet(topupClient, "ecocashNumber")
    const topupProduct = await redisClient.hGet(topupClient, "product")
    const isValidEconetNumber = /^(07[7-8])(\d{7})$/;
    const isValidproduct = /\b(payu|month|monthly|1|2|1.|2)\b/gi
    if (topupField === "ecocashNumber") {
        if (!isValidEconetNumber.test(msgBody)) {
            client.sendMessage(chatID, messages.INVALID_ECOCASH_NUMBER);
            return
        }
        await redisClient.hSet(topupClient, "ecocashNumber", msgBody)
        await redisClient.hSet(topupClient, "field", "product")
        await client.sendMessage(chatID, messages.TOPUP_PRODUCT)
        return
    }
    else if (topupField === "product") {
        if (isValidproduct.test(msgBody)) {
            client.sendMessage(chatID, messages.INVALID_TOPUP_PRODUCT)
            return
        }
        await redisClient.hSet(msgBody, "product", msgBody)
    }
    await client.sendMessage(chatID, `You are subscribing for ${product} subscription. To complete the payment you will be asked to confirm payment by entering your PIN`);
    const paymentResult = await processPaynowPayment(topupProduct, topupNumber, chatID)
    if (paymentResult) {
        await autoProcessSub(chatID, client, topupProduct)
        redisClient.del(topupClient)
        return
    }
    else {
        client.sendMessage(chatID, "Sorry your topup was not processed successfully please try again. Use the format shown below\n" + errorMessage)
        return
    }

}
module.export = topupHandler