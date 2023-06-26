const usersModel = require("../../models/individualUsers");
const referalList = async (user) => {
  const users = await usersModel.find().exec();

  users.forEach(async (user) => {
    const nowUser = user.referalList.filter((number) => {
        number=isNowUser
    });
  });
};
