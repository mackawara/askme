//openai
const indvUsers = require("../../models/individualUsers.js");
const totalUsageModel = require("../../models/totalUsage");
// keep track of token usage per day,best save in DB
// block brute forcers
//block rogue numbers
// check if existing number locally if not check on db

const openAiCall = async (chatID, tokenLimit, redisClient, prompt) => {
  let user = await indvUsers.findOne({ serialisedNumber: chatID }).exec();
  const totalUsage = await totalUsageModel.findOne({});

  const { Configuration, OpenAIApi } = require("openai");
  const configuration = new Configuration({
    organization: process.env.OPENAI_ORGANISATION_KEY,
    apiKey: process.env.OPENAI_API_KEY,
  });

  const openai = new OpenAIApi(configuration);
  let messages = await JSON.parse(await redisClient.hGet(chatID, "messages"));
  await redisClient.hSet(
    chatID,
    "messages",
    JSON.stringify(messages),
    (result) => console.log(`reuslt`, result)
  );
  //console.log(messages);
  const system = {
    role: "system",
    content:
      "Role: You are AskMe, provide answers appropriate for pupils/students questions on educational,sport,business,religion or related issues. You dont answer on movies,music, celebrities,relationships,romance.Sex and romance,politics are strictly prohibited.Political questions are only answered in the constext of history",
  };
  messages.push(system);
  console.log(messages);
  messages.push({ role: "user", content: prompt });
  setTimeout(async () => {}, 3000);
  const response = await openai
    .createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: messages,
      temperature: 0.5,
      max_tokens: tokenLimit,
      frequency_penalty: 1.5,
      presence_penalty: 1.89,
    })
    .catch((err) => {
      // console.log("Error recorded " + err.response.data.error.message);
      console.log(err);
      // error = err.response;
      return;
    });
  //check if there is any response
  if (response) {
    if ("data" in response) {
      messages = messages.filter((item) => item !== system); //remove the system message
      messages.push(response.data.choices[0]["message"]); //add system response to messages

      messages.splice(0, messages.length - 4); //trim messages and remain wit newest 6 only

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
      return `Error , request could not be processed, please try again later`;
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
