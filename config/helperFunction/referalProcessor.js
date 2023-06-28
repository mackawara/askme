const usersModel = require("../../models/individualUsers");
const referalList = async (user) => {
  //user sends a number
  // we validate it as a genuine Zim number
  const users = await usersModel.find().exec();

  users.forEach(async (user) => {
    const nowUser = user.referalList.filter((number) => {
        number=isNowUser
    });
  });
};
