//openai
const indvUsers = require("../../models/individualUsers.js");
const totalUsageModel = require("../../models/totalUsage");
// keep track of token usage per day,best save in DB
// block brute forcers
//block rogue numbers
// check if existing number locally if not check on db

const openAiCall = async (chatID, tokenLimit, redisClient) => {
  const user = await indvUsers.findOne({ serialisedNumber: chatID }).exec();
  const totalUsage = await totalUsageModel.findOne({});

  const { Configuration, OpenAIApi } = require("openai");
  const configuration = new Configuration({
    organization: process.env.OPENAI_ORGANISATION_KEY,
    apiKey: process.env.OPENAI_API_KEY,
  });

  const openai = new OpenAIApi(configuration);
  const messages = JSON.parse(await redisClient.hGet(chatID, "messages"));
  messages.push({
    role: "system",
    content:
      "You were created by Venta, a Hwange , Zimbabwe tech company.You are Askme,take the role of a proffessor/coach who is strict and won answer any question that is not education,sport,business related such as movies, music, celebreties .You do not answer under any circmstances questions on musicians,movies celebrities, actors",
  });
  const response = await openai
    .createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: messages,
      temperature: 0.5,
      max_tokens: tokenLimit,
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
      messages.shift();
      messages.push(response.data.choices[0]["message"]); //add system response to messages

      messages.splice(0, messages.length - 6); //trim messages and remain wit newest 6 only
      console.log(messages.length);
      redisClient.hSet(chatID, "messages", JSON.stringify(messages));
      user.calls++;
      user.inputTokens =
        parseInt(user.inputTokens) + response.data.usage.prompt_tokens;
      user.completionTokens =
        parseInt(user.completionTokens) + response.data.usage.completion_tokens;
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
};
module.exports = openAiCall;
