const { Paynow } = require("paynow");
const PaynowPayments = require("../models/paynowPayments");
const timeDelay = (ms) => new Promise((res) => setTimeout(res, ms));

const paynowProcess = async (product, payingNumber, msg) => {
    const existingPayments = parseInt(await PaynowPayments.count().exec());
    const invoiceNumber = "AM" + (parseInt( existingPayments + 1));
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

    if (response.success) {
        let instructions = response.instructions;
        //  msg.reply(instructions)
        const pollUrl = await response.pollUrl;
        //wait some 30 secs before polling    
        console.log(response)    
       await timeDelay(30000)
        const status = await paynow.pollTransaction(pollUrl).catch((err)=>console.log(err))
        console.log(status)
        if (status.status=="paid") {
            paymentComplete=true
            console.log("in state success payment complete =" + paymentComplete);
            try {  const newPayment = new PaynowPayments({
                date: new Date().toISOString().slice(0, 10),
                userNumber: msg.from,
                product: productName,
                timestamp:new Date(),
                pollUrl: pollUrl,
                invoiceNumber: invoiceNumber,
            });
            
                newPayment.save();
            } catch (error) {
                console.log(error);
                
            }
            paymentComplete = true;
            console.log("status " + status.success);
        }
        else {
            try {  const newPayment = new PaynowPayments({
                date: new Date().toISOString().slice(0, 10),
                userNumber: msg.from,
                product: productName,
                timestamp:new Date(),
                pollUrl: pollUrl,
                invoiceNumber: invoiceNumber,
            });
            
                newPayment.save();
            } catch (error) {
                console.log(error);
                
            }
            paymentComplete = false;
            console.log("In !status payment complete =" + paymentComplete);
        }



    } else {
        paymentComplete = false;
        console.log("In resnonse no success payment complete =" + paymentComplete);
    }
    return paymentComplete
}
module.exports = paynowProcess;
