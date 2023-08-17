const { Paynow } = require("paynow")
const PaynowPayments = require("../models/paynowPayments");

const paynowProcess = async (product, payingNumber, chatID) => {

    const existingPayments = parseInt(await PaynowPayments.count().exec());
    console.log(existingPayments)
    const invoiceNumber = "AM" + existingPayments + 1
    const productName = product.toLowerCase().trim()
    let paynow = new Paynow(process.env.PAYNOW_ID, process.env.PAYNOW_KEY);
    let payment = paynow.createPayment("Invoice 35", "mkawara98@gmail.com");
    //set the product price depending


    const productPrice = product == "payu" ? 500 : 6000
    payment.add(product, productPrice);
    let paymentCompleted = false
    await paynow.sendMobile(payment, payingNumber, "ecocash").then(async (response) => {
        console.log("paymeent processing")

        if ("success" in response) {
            if (response.success) {
                let instructions = response.instructions
                console.log(instructions)
                const pollUrl = response.instructions
                //const status = await paynow.pollTransaction(pollUrl);

                paymentCompleted = true
               /*  if (status.paid()) {
                    //save to DB
                    const newPayment = new PaynowPayments({
                        date: new Date().toISOString().slice(0, 10),
                        timeStamp: Date.now(),
                        userNumber: chatID,
                        product: productName,
                        pollUrl: pollUrl,
                        invoiceNumber: invoiceNumber

                    })
                    try { newPayment.save() } catch (error) { console.log(error) }

                } */
            } else {
                console.log(response)
            }
        }
    }).catch((err) => { console.log(err) })
    
    console.log(paymentCompleted)
    return paymentCompleted
}
module.exports = paynowProcess
