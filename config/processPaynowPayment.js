const { Paynow } = require("paynow");
const PaynowPayments = require("../models/paynowPayments");
const autoProcessSub = require("./autoProcessSub")
const messages = require("../constants/messages")
const { client } = require("./wwebJsConfig")
const redisClient = require("./redisConfig")
require("dotenv").config();
const timeDelay = (ms) => new Promise((res) => setTimeout(res, ms));

const paynowProcess = async (product, payingNumber, chatID) => {
    const existingPayments = parseInt(await PaynowPayments.count().exec());
    const invoiceNumber = "AM" + (parseInt(existingPayments + 1));
    const productName = product.toLowerCase().trim();
    let paynow = new Paynow(process.env.PAYNOW_ID, process.env.PAYNOW_KEY);
    let payment = paynow.createPayment(invoiceNumber, process.env.AUTH_EMAIL);
    //set the product price depending
    const productPrice = productName == "payu" ? 500 : 6000;
    payment.add(product, productPrice);
    const response = await paynow
        .sendMobile(payment, payingNumber, "ecocash")
        .catch(err => {
            console.log(err);
        });
    let paymentComplete;

    await timeDelay(30000)//wait for the client to process  
    if (response.success) {
        console.log(response)
        //means the user was successfully prompted
        let instructions = response.instructions;
        const pollUrl = await response.pollUrl;
        //wait some 30 secs before polling   
        // check if it the poll result is paid
        let polls = 0
        const status = await paynow.pollTransaction(pollUrl).catch((err) => console.log(err))
        while (polls < 10) {
            console.log(status.status)
            if (status.status == "paid" || status.status == "cancelled") {
                break
            }
            polls++
            console.log(polls)
            await timeDelay(3000)
        }
        console.log(status)
        switch (status.status) {
            case "paid":
                paymentComplete = true
                try {
                    await autoProcessSub(chatID, client, product)
                    await redisClient.del(`${chatID}topup`) // delete the topup client
                    const newPayment = new PaynowPayments({
                        date: new Date().toISOString().slice(0, 10),
                        userNumber: chatID,
                        product: productName,
                        timestamp: new Date(),
                        pollUrl: pollUrl,
                        invoiceNumber: invoiceNumber,
                    });

                    newPayment.save();
                } catch (error) {
                    console.log(error);
                }
                paymentComplete = true;
                console.log("Payment status " + status.success);
                break
            case "cancelled":
            default:
                await client.sendMessage(chatID, messages.TOPUP_WAS_NOT_PROCESSED)
                await client.sendMessage(process.env.ME, "Failed topup alert: From " + chatID)
                await redisClient.del(`${chatID}topup`)

                paymentComplete = false;
                break;

        }
        try {
            const newPayment = new PaynowPayments({
                date: new Date().toISOString().slice(0, 10),
                userNumber: chatID,
                product: productName,
                timestamp: new Date(),
                pollUrl: pollUrl,
                invoiceNumber: invoiceNumber,
                status: status.status
            });
            newPayment.save();
        } catch (error) {
            console.log(error);
        }
    } else {
        paymentComplete = false;
        console.log("In resnonse no success payment complete =" + paymentComplete);
    }
    return paymentComplete
}
module.exports = paynowProcess;
