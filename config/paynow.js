const { Paynow } = require("paynow")
const PaynowPayments = require("../models/paynowPayments");

const paynowProcess = async (product, payingNumber, msg) => {

    const existingPayments = parseInt(await PaynowPayments.count().exec());
    const invoiceNumber = "AM" + existingPayments + 1
    const productName = product.toLowerCase().trim()
    let paynow = new Paynow(process.env.PAYNOW_ID, process.env.PAYNOW_KEY);
    let payment = paynow.createPayment(invoiceNumber, "mkawara98@gmail.com");
    //set the product price depending


    const productPrice = productName == "payu" ? 500 : 6000
    payment.add(product, productPrice);
    let paymentCompleted = false
    await paynow.sendMobile(payment, payingNumber, "ecocash").then(async (response) => {


        if ("success" in response) {
            if (response.success) {
                let instructions = response.instructions
                //  msg.reply(instructions)
                const pollUrl = response.pollUrl
                setTimeout(() => {
                    const status = paynow.pollTransaction(pollUrl);
                    console.log("status " + status.success)

                    if (status.success) {
                        paymentCompleted = true
                        //save to DB
                        const newPayment = new PaynowPayments({
                            date: new Date().toISOString().slice(0, 10),
                            timeStamp: Date.now(),
                            userNumber: msg.from,
                            product: productName,
                            pollUrl: pollUrl,
                            invoiceNumber: invoiceNumber

                        })
                        try { newPayment.save() } catch (error) { console.log(error) }

                    }
                }, 150000)

            } else {
                console.log(response)
            }
        }
    }).catch((err) => { console.log(err) })

    console.log(paymentCompleted)
    return paymentCompleted
}
module.exports = paynowProcess
