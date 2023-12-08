const indvUsers = require('../models/individualUsers');
const totalUsageModel = require('../models/totalUsage');
const tokenUsersModel = require('../models/tokenUsers');
const greetByTime = nameOfClient => {
  const currentTime = new Date();
  const currentHour = currentTime.getHours();

  if (currentHour < 10) {
    return `Good morning ${nameOfClient}, we hope you are having a pleasant start to your day`;
  } else if (currentHour >= 10 && currentHour < 16) {
    return `Good day ${nameOfClient}, We hope you are having a pleasant day`;
  } else {
    // Assuming you meant to say "good evening"
    return `Good evening ${nameOfClient}, we hope you had a splendid day`;
  }
};
const deleteDuplicates = async () => {
  const duplicates = await indvUsers.aggregate([
    {
      $group: {
        _id: '$number',
        uniqueIds: { $addToSet: '$_id' },
        count: { $sum: 1 },
      },
    },
    {
      $match: {
        count: { $gt: 1 },
      },
    },
  ]);
  duplicates.forEach(doc => {
    doc.uniqueIds.shift();
    // delete the remaining using ther IDs
    try {
      indvUsers.deleteMany({ _id: { $in: doc.uniqueIds } }).then(result => {
        console.log(result);
      });
    } catch (err) {
      console.log(err);
    }
  });
};
const isInteger = str => {
  const num = parseInt(str);
  return !isNaN(num) && String(num) === str.trim();
};
const updateDbMetrics = async (chatID, usage) => {
  console.log(usage);
  try {
    const user = await indvUsers.find({ serialisedNumber: chatID });
    const totalUsage = await totalUsageModel.findOne({});
    const tokenUser = await tokenUsersModel.findOne({ userId: chatID });
    console.log(user);
    user.calls++;
    user.callsThisMonth++;
    if (tokenUser) {
      tokenUser.availableTokens = -usage.total_tokens;
      tokenUser.inputTokens = +usage.prompt_tokens;
      tokenUser.inputTokens = +usage.completion_tokens;
      tokenUser.totalTokens = +usage.total_tokens;
      tokenUser.save();
    }

    user.inputTokens = parseInt(user.inputTokens) + usage.prompt_tokens;
    user.completionTokens = +usage.completion_tokens;
    user.totalTokens = +usage.total_tokens;
    //Add to cumulatitive totals
    totalUsage.calls++;
    totalUsage.callsThisMonth++;
    totalUsage.inputTokens = +usage.prompt_tokens;
    totalUsage.completionTokens = +usage.completion_tokens;
    totalUsage.totalTokens = +usage.total_tokens;
    // save the updated metrics
    console.log(user);
    user.save();
    totalUsage.save();
  } catch (err) {
    console.log(err);
  }
};

module.exports = { greetByTime, deleteDuplicates, isInteger, updateDbMetrics };
