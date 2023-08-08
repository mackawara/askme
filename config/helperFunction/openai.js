//openai
const indvUsers = require("../../models/individualUsers.js");
const totalUsageModel = require("../../models/totalUsage");

const openAiCall = async (chatID, tokenLimit, redisClient, prompt) => {
  let user = await indvUsers.findOne({ serialisedNumber: chatID }).exec();
  const totalUsage = await totalUsageModel.findOne({});

  const { Configuration, OpenAIApi } = require("openai");
  const configuration = new Configuration({
    organization: process.env.OPENAI_ORGANISATION_KEY,
    apiKey: process.env.OPENAI_API_KEY,
  });

  const openai = new OpenAIApi(configuration);
  const messagesExists = await redisClient.exists(`${chatID}messages`);
  //if there are no current messages
  if (!messagesExists) {
    await redisClient.hSet(`${chatID}messages`, {
      messages: JSON.stringify([]),
    });
    // await redisClient.expire(`${chatID}messages`,300)
  }

  let messages = await JSON.parse(
    await redisClient.hGet(`${chatID}messages`, "messages")
  );
  if (prompt == "Continue" && messages == []) {
    return "I can only continue based on previous 3 messages if they were made within the last 3 minutes";
  }
  await redisClient.hSet(
    `${chatID}messages`,
    "messages",
    JSON.stringify(messages),
    result => console.log(`reuslt`, result)
  );
  //console.log(messages);
  const system = {
    role: "system",
    content:
      "Role: You are AskMe_AI. You were created by Mac Kawara. You provide answers on education, self-improvement, and related issues."
  };

  messages.push(system);
  console.log(messages);
  messages.push({ role: "user", content: prompt });
  setTimeout(async () => { }, 3000);
  const response = await openai
    .createChatCompletion({
      model: "gpt-3.5-turbo-0613",
      messages: messages,
      temperature: 0.5,
      max_tokens: tokenLimit,
      frequency_penalty: 1.5,
      presence_penalty: 1.89,
    })
    .catch(err => {
      // console.log("Error recorded " + err.response.data.error.message);
      console.log(err);
      // error = err.response;
      return;
    });
  //check if there is any response
  if (response) {
    if ("data" in response) {
      messages = messages.filter(item => {
        return item !== system
      }); //remove the system message
      messages.push(response.data.choices[0]["message"]); //add system response to messages

      messages.splice(0, messages.length - 6); //trim messages and remain wit newest 6 only

      redisClient.hSet(
        `${chatID}messages`,
        "messages",
        JSON.stringify(messages)
      );
      redisClient.expire(`${chatID}messages`, 300);
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
