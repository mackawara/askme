const { Paynow } = require("paynow");
let paynow = new Paynow(
  process.env.INTEGRATION_ID,
  process.env.INTEGRATION_KEY
);

const processPayment = async (ecocashNumber, product, productPrice) => {
  let payment = paynow.createPayment(" invoice 1", process.env.AUTH_EMAIL);
  payment.add("standard", 12000);
  console.log(payment);

  const response = await paynow
    .sendMobile(payment, 0771111111, "ecocash")
    .catch((err) => console.log(err));

  if (response.success) {
    // These are the instructions to show the user.
    // Instruction for how the user can make payment
    let instructions = response.instructions; // Get Payment instructions for the selected mobile money method

    // Get poll url for the transaction. This is the url used to check the status of the transaction.
    // You might want to save this, we recommend you do it
    let pollUrl = response.pollUrl;
    //save to DB

    return instructions;
  } else {
    console.log(response.error);
  }
};
module.exports = processPayment;
