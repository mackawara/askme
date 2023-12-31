const usersModel = require("../../models/individualUsers");
const ReferalsModel = require("../../models/referals");

const saveReferal = async (msgBody, chatID, client) => {
  //remove the key word and spaces

  let number = msgBody
    .replace(/referal|referral/gi, "")
    .replace(/\s/, "")
    .trim();

  if (number.startsWith("+263")) {
    console.log("does not start with 263");
    number = number.replace(/\D/g, "").trim();
    console.log(number);
  } else if (number.startsWith("0")) {
    number = number.replace("0", "263");
    console.log(number);
  }
  const numberSerialised = number + "@c.us";
  // we validate it as a genuine Zim number
  console.log(numberSerialised);
  if (!/^(0|263)[7]\d{8}$/.test(number)) {
    console.log("number did not pass testt");
    return "For your referral to be saved it has to be in the right format as in the example below. *Do not send a contact*\n\nPlease send a valid Zimbabwean mobile number . Send the your referal message like this \n referal 263773111111";
  }

  //check if number has already been added
  const user = await usersModel.findOne({ serialisedNumber: chatID }).exec();
  const existingUser = await usersModel
    .findOne({ serialisedNumber: numberSerialised })
    .exec();
  //console.log(user);
  const referal = await ReferalsModel.findOne({
    targetSerialisedNumber: numberSerialised,
  });

  //check the referals if the user has already been referred
  if (existingUser) {
    return "The number being referred is already a user";
  }
  //check if the number being reffered is already reffred
  if (referal) {
    return "This number has already been used as a referal";
  } else {
    console.log("processing");

    const newReferral = new ReferalsModel({
      referingNumber: chatID,
      targetNumber: number,
      targetSerialisedNumber: numberSerialised,
      isNowUser: false,
      date: new Date().toISOString().slice(0, 10),
      redeemed: false,
    });
    try {
      //save to the referals Document
      await newReferral.save();
      console.log("referal saved");
      if (user) {
        user.referalList.push({
          targetSerialisedNumber: numberSerialised,
        });
      } //save to users referal list
      await user.save();
      client.sendMessage(
        numberSerialised,
        `Hi ,\n Your friend with the number ${chatID
          .replace("263", "0")
          .slice(
            0,
            -5
          )} is already using AskMe the AI powered study chatbot and has referred the app to you, the best thing since sliced bread. AskME answers all questions that you can think of, from grade 1 to University level... Just ask the question on here https://wa.me/263711489602 and join the group for updates https://chat.whatsapp.com/I5RNx9PsfYjE0NV3vNijk3.\n\n *if ${chatID
          .replace("263", "0")
          .slice(
            0,
            -5
          )} is not yur friend/classmate/colleague and you do not wish to use AI in your study or work , simply ignore this message , you will not receive any other message!!* \nYours \nAskME team`
      );
      return `*Do not reply*\n Referral was successfully saved. Once you get 3 converted referrals you will get standard user prvildges for 2 days.You have referred number ${number} and AskMe team will send them an automated message to join more than 500 students that are already using AskMe.`;

      //save to the referrer
    } catch (err) {
      console.log(err);
      return "Error occured while processing the referal";
    }
  }
};
module.exports = saveReferal;
