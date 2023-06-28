const usersModel = require("../../models/individualUsers");
const referalList = async (msgBody,user) => {
  //user sends a number
  msgBody.replace(/referal|referral/gi,"").replace(/\s/,"").trim()
  // we validate it as a genuine Zim number
 if( /^(?:\+263|0)[17]\d{8}$/.test(msgBody)){
  return "The number is not a valid Zimbabwean mobile number"
 }
  const users = await usersModel.find().exec();

  users.forEach(async (user) => {
    const nowUser = user.referalList.filter((number) => {
        number=isNowUser
    });
  });
};
