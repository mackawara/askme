const usersModel = require("../../models/individualUsers");
const ReferalsModel = require("../../models/referals");

const saveReferal = async (msgBody, chatID) => {
  //remove the key word and spaces
  console.log("save ref line 6");
  const number = msgBody
    .replace(/referal|referral/gi, "")
    .replace(/\s/, "")
    .trim();
  const numberSerialised = number + "@c.us";
  // we validate it as a genuine Zim number
  console.log("save ef line 14");
  console.log(numberSerialised);
  if (!/^(?:263)[7]\d{8}$/.test(number)) {
    console.log("number did not pass testt");
    return "The number is not a valid Zimbabwean mobile number . send the number in this format 263 773 111 111";
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
      nowUser: false,
      date: new Date().toISOString().slice(0, 10),
      redeemed: false,
    });
    try {
      //save to the referals Document
      newReferral.save().then((result) => {
        console.log("referal saved");
        if (user) {
          user.referalList.push({
            targetSerialisedNumber: numberSerialised,
          });
        }//save to users referal list
        user.save(() => {
          return `Please forward this to ${number}.You have referred number ${number} and AskMe team will send them an automated message to join more than 500 students that are already using AskMe. Tou use AskMe simply send whatever question you wish to get an answer.`;
        });

        //save to the referrer
      });
    } catch (err) {
      console.log(err);
      return "Error occured while processing the referal";
    }
  }
};
module.exports = saveReferal;
