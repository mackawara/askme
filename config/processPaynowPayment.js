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
    const prices = {
        payu: 500,
        monthly: 6000,
    }
    const productPrice = prices[product];
    console.log(productPrice)
    payment.add(product, productPrice);
    const response = await paynow
        .sendMobile(payment, payingNumber, "ecocash")
        .catch(err => {
            console.log(err);
        });
    let paymentComplete;

    await timeDelay(3000)//wait for the client to process  

    if (response.success) {

        //means the user was successfully prompted
        let instructions = response.instructions;
        const pollUrl = await response.pollUrl;
        //wait some 30 secs before polling   
        // check if it the poll result is paid
        let polls = 0
        let status;

        while (polls < 15) {
            status = await paynow.pollTransaction(pollUrl).catch((err) => console.log(err))
            // use swtch case herenpm start
            if (status.status == "paid" || status.status == "awaiting delivery"|| status.status == "cancelled") {
                console.log(status.status)
                break
            }
            polls++

            await timeDelay(5000)
        }
        try {

            const newPayment = new PaynowPayments({
                date: new Date().toISOString().slice(0, 10),
                userNumber: chatID,
                product: productName,
                timestamp: new Date(),
                pollUrl: pollUrl,
                invoiceNumber: invoiceNumber,
                status: status.status,
                success: status.success
            });

            newPayment.save();
        } catch (error) {
            console.log(error);
        }

        console.log("Payment status " + status.status);
        switch (status.status) {
            case "paid":
            case "awaiting delivery":    
                await autoProcessSub(chatID, client, product)
                break
            case "cancelled":
            default:
                await client.sendMessage(chatID, messages.TOPUP_WAS_NOT_PROCESSED+ `\nYour payment status is *${status.status}*`)
                await client.sendMessage(process.env.ME, "Failed topup alert: From " + chatID)
                await redisClient.del(`${chatID}topup`)
                paymentComplete = false;
                break;

        }

    } else {
        console.log("payment was not sent to client");
    }
    return paymentComplete
}
module.exports = paynowProcess;
