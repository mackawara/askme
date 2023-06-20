//openai
const indvUsers = require("../../models/individualUsers.js");
const totalUsageModel = require("../../models/totalUsage");
// keep track of token usage per day,best save in DB
// block brute forcers
//block rogue numbers
// check if existing number locally if not check on db

let chats = require("../../chats");
const openAiCall = async (prompt, chatID) => {
  const user = await indvUsers.findOne({ serialisedNumber: chatID }).exec();

  const totalUsage = await totalUsageModel.findOne({});
  

  //check if there is an existing chat from that number and create if not

  const { Configuration, OpenAIApi } = require("openai");
  const configuration = new Configuration({
    organization: process.env.OPENAI_ORGANISATION_KEY,
    apiKey: process.env.OPENAI_API_KEY,
  });

  const openai = new OpenAIApi(configuration);
  let error;

  if (chats[chatID]["calls"] < 2) {
   
    const response = await openai
      .createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: chats[chatID]["messages"],
        temperature: 1,
        max_tokens: 180,
        frequency_penalty: 1.7,
        presence_penalty: 1.89,
      })
      .catch((err) => {
        // console.log("Error recorded " + err.response.data.error.message);
        console.log(err);
        error = err.response;
        return;
      });
    //check if there is any response
    if (response) {
      if ("data" in response) {
        chats[chatID].messages.push(response.data.choices[0]["message"]); //add system response to messages
        chats[chatID].messages.splice(0, chats[chatID].messages.length - 10); //trim messages and remain wit newest 6 only
       
        setTimeout(() => {
          chats[chatID]["calls"] = 0;
        }, 15000); // reset the calls in local store
        setTimeout(() => {
          chats[chatID]["messages"] = [];
        }, 120000); // messages are forgotten after 30mins
        //update database
        user.calls++;
        user.inputTokens =
          parseInt(user.inputTokens) + response.data.usage.prompt_tokens;
        user.completionTokens =
          parseInt(user.completionTokens) +
          response.data.usage.completion_tokens;
        user.totalTokens =
          parseInt(user.totalTokens) + response.data.usage.total_tokens;
        //Add to cumulatitive totals
        totalUsage.calls++;
        totalUsage.inputTokens =
          parseInt(totalUsage.inputTokens) + response.data.usage.prompt_tokens;
        totalUsage.completionTokens =
          parseInt(totalUsage.completionTokens) +
          response.data.usage.completion_tokens;
        totalUsage.totalTokens =
          parseInt(totalUsage.totalTokens) + response.data.usage.total_tokens;
        try {
          user.save();
          totalUsage.save();
        } catch (err) {
          console.log(err);
        }

        return response.data.choices[0]["message"]["content"];
      } else {
        return ` Error , request could not be processed, please try again later`;
      }
    } else {
      totalUsage.errors++;
      totalUsage.calls++;
      //if contact exceeds 10 warnings block them
      if (user.warnings > 10) {
        user.isBlocked = true;
        try {
          user.save();
          totalUsage.save();
        } catch (error) {
          console.log(error);
        }
      }
      return "*Error!* your request could not be processed , please try again later";
    }
  } else {
    user.calls++;
    user.warnings++;
    totalUsage.warnings++;
    totalUsage.calls++;
    try {
      user.save();
      totalUsage.save();
    } catch (err) {
      console.log(err);
    }
    setTimeout(() => {
      chats[chatID]["calls"] = 0;
    }, 15000); // reset the calls in local store
    setTimeout(() => {
      chats[chatID]["messages"] = [];
    }, 90000); // messages are forgotten after 30mins
    return `*Error!* too many requests made , please try later. You cannot make mutiple requests at the same time`;
  }
};
module.exports = openAiCall;
