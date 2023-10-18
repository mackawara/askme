//openai
const indvUsers = require("../../models/individualUsers.js");
const totalUsageModel = require("../../models/totalUsage");
const redisClient = require("../redisConfig.js")
const openai = require("../openAIconfig.js")
const saveNewUser = require("./saveNewUser.js")
const { client } = require("../wwebJsConfig.js")

const openAiCall = async (chatID, tokenLimit, prompt) => {
  let user = await indvUsers.findOne({ serialisedNumber: chatID }).exec();

  let totalUsage = await totalUsageModel.findOne({});
  if (!totalUsage) {
    const ttlUsage = new totalUsageModel({
      date: "2023-06-18",
        calls:  7099 ,
        warnings: 23,
        errorsRec: 0,
        totalTokens: 2894574,
        inputTokens: 1711081,
        completionTokens: 1183493,
        tokensPerCall: 206.43231441048036,
        timestamp: 1687328692928.0,
        callsPerDay: 3156353.194544149,
        costPerCall: 0.0006192969432314411,
        costPerDay: 1954.7198851399855,
        callsThisMonth: 1455
    })
    try{
     await ttlUsage.save()
    }
    catch(err){
      console.log(err)
    }
}
totalUsage = await totalUsageModel.findOne({});
const messagesExists = await redisClient.exists(`${chatID}messages`);
//if there are no current messages
if (!messagesExists) {
  await redisClient.hSet(`${chatID}messages`, {
    messages: JSON.stringify([]),
  });
  //
  if (/(add\smore|continue|add\smore\sinformation\snext)/gi.test(prompt)) {
    return "Please note that messages are only kept in the system for only 5 minutes after which you cant continue from previous conversations ";

  }
  // await redisClient.expire(`${chatID}messages`,300)
}
//convert messages back to an array
let messages = await JSON.parse(
  await redisClient.hGet(`${chatID}messages`, "messages")
);

const system = {
  role: "system",
  content:
    "Role: You are AskMe_AI. You were created by Mac Kawara. You provide answers on education, self-improvement, and related issues."
};
// add sytem message just before sending the message array
messages.push(system);

// add user prompt to messages
messages.push({ role: "user", content: prompt });
const modelVersion = "gpt-3.5-turbo-0613"
try {
  const response = await openai.chat.completions.create({
    model: modelVersion,
    messages: messages,
    temperature: 0.5,
    max_tokens: tokenLimit,
    frequency_penalty: 1.5,
    presence_penalty: 1.89,
  })
  //check if there is any response
  if (response) {
    if ("choices" in response) {
      messages = messages.filter(item => {
        return item !== system
      }); //remove the system message
      messages.push(response.choices[0]["message"]); //add system response to messages

      messages.splice(0, messages.length - 4); //trim messages and remain wit newest 4 only
      // at this point you have system user system user

      redisClient.hSet(
        `${chatID}messages`,
        "messages",
        JSON.stringify(messages)
      )
      redisClient.expire(`${chatID}messages`, 300);
      //Update the DBgit chec
      user.calls++;
      user.callsThisMonth++
      user.inputTokens =
        parseInt(user.inputTokens) + response.usage.prompt_tokens;
      user.completionTokens =
        parseInt(user.completionTokens) + response.usage.completion_tokens;
      user.totalTokens =
        parseInt(user.totalTokens) + response.usage.total_tokens;
      //Add to cumulatitive totals
      totalUsage.calls++
      totalUsage.callsThisMonth++;
      totalUsage.inputTokens =
        parseInt(totalUsage.inputTokens) + response.usage.prompt_tokens;
      totalUsage.completionTokens =
        parseInt(totalUsage.completionTokens) +
        response.usage.completion_tokens;
      totalUsage.totalTokens =
        parseInt(totalUsage.totalTokens) + response.usage.total_tokens;

      user.save();
      totalUsage.save();
      return (response.choices[0]["finish_reason"] == "length") ?
        `${response.choices[0]["message"]["content"]}\n *send "continue" to see the rest of the text*` :
        response.choices[0]["message"]["content"];
    } else {

      totalUsage.errors++;
      totalUsage.calls++;
      //if contact exceeds 10 warnings block them
      if (user.warnings > 10) {
        user.isBlocked = true;

        user.save();
        totalUsage.save();
      }
    }
    return "*Error!* your request could not be processed , please try again later";
  }
  else {
    return "*Error!* your request could not be processed , please try again later";
  }
} catch (err) {
  console.log(err)
  return "*Error!* your request could not be processed , please try again later";
}
};
module.exports = openAiCall;
