const { Paynow } = require("paynow");
const PaynowPayments = require("../models/paynowPayments");
const timeDelay = (ms) => new Promise((res) => setTimeout(res, ms));

const paynowProcess = async (product, payingNumber, chatID) => {
    const existingPayments = parseInt(await PaynowPayments.count().exec());
    const invoiceNumber = "AM" + (parseInt(existingPayments + 1));
    const productName = product.toLowerCase().trim();
    let paynow = new Paynow(process.env.PAYNOW_ID, process.env.PAYNOW_KEY);
    let payment = paynow.createPayment(invoiceNumber, "mkawara98@gmail.com");
    //set the product price depending
    const productPrice = productName == "payu" ? 500 : 6000;
    payment.add(product, productPrice);
    const response = await paynow
        .sendMobile(payment, payingNumber, "ecocash")
        .catch(err => {
            console.log(err);
        });

    let paymentComplete;

    await timeDelay(60000)//wait for the client to process  
    if (response.success) {
        let instructions = response.instructions;
        const pollUrl = await response.pollUrl;
        //wait some 30 secs before polling    
        const status = await paynow.pollTransaction(pollUrl).catch((err) => console.log(err))

        if (status.status == "paid") {
            paymentComplete = true
            try {
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
        }
        else {
            try {
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
            paymentComplete = false;

        }



    } else {
        paymentComplete = false;
        console.log("In resnonse no success payment complete =" + paymentComplete);
    }
    return paymentComplete
}
module.exports = paynowProcess;
