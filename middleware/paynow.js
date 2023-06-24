const { Paynow } = require("paynow");
let paynow = new Paynow("INTEGRATION_ID", "INTEGRATION_KEY");

const processPayment = async (ecocashNumber, product, productPrice) => {
  let payment = paynow.createPayment("Invoice 35");
  payment.add(product, productPrice);

  paynow
    .sendMobile(
      // The payment to send to Paynow
      payment,

      // The phone number making payment
      ecocashNumber,

      // The mobile money method to use.
      "ecocash"
    )
    .then(function (response) {
      if (response.success) {
        // These are the instructions to show the user.
        // Instruction for how the user can make payment
        let instructions = response.instructions; // Get Payment instructions for the selected mobile money method

        // Get poll url for the transaction. This is the url used to check the status of the transaction.
        // You might want to save this, we recommend you do it
        let pollUrl = response.pollUrl;

        return instructions;
      } else {
        console.log(response.error);
      }
    })
    .catch((err) => {
      // Ahhhhhhhhhhhhhhh
      // *freak out*
      console.log("Your application has broken an axle", err);
    });
};
module.exports = processPayment;
