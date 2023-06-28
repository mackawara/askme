const usersModel = require("../../models/individualUsers");
const ReferalsModel = require("../../models/referals");

const saveReferal = async (msgBody, chatID) => {
  //remove the key word and spaces
  const number = msgBody
    .replace(/referal|referral/gi, "")
    .replace(/\s/, "")
    .trim();
  const numberSerialised = number + "@c.us";
  // we validate it as a genuine Zim number
  if (/^(?:\+263|0)[17]\d{8}$/.test(number)) {
    return "The number is not a valid Zimbabwean mobile number";
  }
  //check if number has already been added
  const user = await usersModel.findOne({ serialiseNumber: chatID }).exec();
  const referal = await ReferalsModel.findOne({ targetNumber: number });
  if (referal) {
    return "This number has already been used as a referal";
  } else {
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
        //save to the referrer
        user.referalList.push({
          targetSerialisedNumber: numberSerialised,
        });
        try {
          //save to users referal list
          user.save();
          return "referal saved successfully, Once the referred number is captured as a user you will get addional tokens to use";
        } catch (err) {
          console.log(err);
        }
        console.log("referal saved successfuly");
      });
    } catch (err) {
      console.log(err);
      return "Error could not be saved";
    }
  }
};
