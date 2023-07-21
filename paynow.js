const { Paynow } = require("paynow");
let paynow = new Paynow(
  process.env.INTEGRATION_ID,
  process.env.INTEGRATION_KEY
);

const processPayment = (ecocashNumber, product, productPrice) => {
  let payment = paynow.createPayment("Invoice 1", process.env.AUTH_EMAIL);
  payment.add("Bananas", 2.5);
  payment.add("Apples", 1.0);

  paynow
    .sendMobile(payment, 0777000000, "ecocash")
    .then(function (response) {
      if (response.success) {
       
        let instructions = response.instructions; 
        let pollUrl = response.pollUrl;

        console.log(instructions);
      } else {
        console.log(response.error);
      }
    })
    .catch((ex) => {
      // Ahhhhhhhhhhhhhhh
      // *freak out*
      console.log("Your application has broken an axle", ex);
    });

  /*  const response = await paynow
    .sendMobile(payment, 0777000000, "ecocash")
    .catch((err) => console.log(err));
console.log(response)
  if ("success" in response) {
    // These are the instructions to show the user.
    // Instruction for how the user can make payment
    let instructions = response.instructions; // Get Payment instructions for the selected mobile money method

    // Get poll url for the transaction. This is the url used to check the status of the transaction.
    // You might want to save this, we recommend you do it
    let pollUrl = response.pollUrl;
    //save to DB

    return instructions
  } else {
    console.log(response.error);
  } */
};
module.exports = processPayment;
