//openai
const indvUsers = require("../../models/individualUsers.js");
const totalUsageModel = require("../../models/totalUsage");
const redisClient = require("../redisConfig.js")
const openai = require("../openAIconfig.js")
const {client}= require("../wwebJsConfig.js")
const {continuePattern}= require("../../constants/regexPatterns.js")

const openAiCall = async (chatID, tokenLimit, prompt) => {
  let user = await indvUsers.findOne({ serialisedNumber: chatID }).exec();
  const totalUsage = await totalUsageModel.findOne({});

  const messagesExists = await redisClient.exists(`${chatID}messages`);
  //if there are no current messages
  if (!messagesExists) {
    await redisClient.hSet(`${chatID}messages`, {
      messages: JSON.stringify([]),
    });
    //
    if(continuePattern.test(prompt)){
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

  const response = await openai.chat.completions.create({
    model: modelVersion,
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
    if ("choices" in response) {
      messages = messages.filter(item => {
        return item !== system
      }); //remove the system message
      messages.push(response.choices[0]["message"]); //add system response to messages

      messages.splice(0, messages.length - 4); //trim messages and remain wit newest 4 only
      // at this point you have system user system user
      try {
        redisClient.hSet(
          `${chatID}messages`,
          "messages",
          JSON.stringify(messages)
        )
        redisClient.expire(`${chatID}messages`, 300);
      }
      catch (err) {
        console.log(err)
      }
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
      totalUsage.calls++;
      totalUsage.callsThisMonth++;
      totalUsage.inputTokens =
        parseInt(totalUsage.inputTokens) + response.usage.prompt_tokens;
      totalUsage.completionTokens =
        parseInt(totalUsage.completionTokens) +
        response.usage.completion_tokens;
      totalUsage.totalTokens =
        parseInt(totalUsage.totalTokens) + response.usage.total_tokens;
      try {
        user.save();
        totalUsage.save();
      } catch (err) {
        console.log(err);
      }
       return (response.choices[0]["finish_reason"]=="length")?
       `${response.choices[0]["message"]["content"]}\n *send "continue" to see the rest of the text*`: 
        response.choices[0]["message"]["content"];
      

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
