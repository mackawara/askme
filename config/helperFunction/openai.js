const indvUsers = require('../../models/individualUsers.js');
const totalUsageModel = require('../../models/totalUsage');
const redisClient = require('../redisConfig.js');
const openai = require('../openAIconfig.js');
const { updateDbMetrics } = require('../../Utils/index.js');
const {
  ERROR_REQUEST_COULD_NOT_BE_PROCESSED,
} = require('../../constants/messages.js');
const openAiCall = async (chatID, tokenLimit, prompt) => {
  let user = await indvUsers.findOne({ serialisedNumber: chatID }).exec();
  const isTokenUser =
    (await redisClient.hGet(chatID, 'isTokenUser')) == '1' ? true : false;

  let totalUsage = await totalUsageModel.findOne({});

  const messagesExists = await redisClient.exists(`${chatID}messages`);

  if (messagesExists == 0) {
    await redisClient.hSet(`${chatID}messages`, {
      messages: JSON.stringify([]),
    });
    //
    /* if (/^continue$/i.test(prompt)) {
      return 'Please note that messages are only kept in the system for only 5 minutes after which you cant continue from previous conversations ';
    } */
  }
  //convert messages back to an array
  let messages = await JSON.parse(
    await redisClient.hGet(`${chatID}messages`, 'messages')
  );

  const systemPrompt = {
    role: 'system',
    content: `Role: You are AskMe_AI.You ONLY provide answers on education, self-improvement, and related issues.FOLLOW these instructions in answering:1.For VAGUE questions,Ask for CLARIFICATION. 2.For langauges non other than English Spanish, French , Potugese,Chinese and other "international Langauges" DO NOT answer ,3.For long complex problems use a step by step computation.4.For assignment type questions write in continous form wwith each subsection having its small heading and paragraoh , provide citations from scholars IN Havard style. If the message is continue , continue from your last message`,
  };
  // add sytem message just before sending the message array
  messages.push(systemPrompt);

  // add user prompt to messages
  messages.push({ role: 'user', content: prompt });
  const inhouse = [process.env.ME, process.env.VENTA, process.env.TADIEWASHE];
  const modelVersion = inhouse.includes(chatID)
    ? 'gpt-4o-mini'
    : 'gpt-3.5-turbo-0125';
  console.log(modelVersion);
  try {
    const response = await openai.chat.completions.create({
      model: modelVersion,
      messages: messages,
      temperature: 0.5,
      max_tokens: tokenLimit,
      frequency_penalty: 1.5,
      presence_penalty: 1.89,
    });
    //check if there is any response
    if (response) {
      if ('choices' in response) {
        messages.pop();
        messages.push(response.choices[0]['message']); //add system response to messages

        messages.slice(0, 3); //trim messages and remain wit newest 4 only
        // at this point you have system user system user
        console.log(`response received for ${chatID}`);
        await redisClient.hSet(
          `${chatID}messages`,
          'messages',
          JSON.stringify(messages)
        );
        await redisClient.expire(`${chatID}messages`, 180);

        //Update the DBgit chec
        await updateDbMetrics(chatID, response.usage);
        return response.choices[0]['finish_reason'] == 'length'
          ? `${response.choices[0]['message']['content']}\n *send "continue" for more text*`
          : response.choices[0]['message']['content'];
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
      return ERROR_REQUEST_COULD_NOT_BE_PROCESSED;
    } else {
      return ERROR_REQUEST_COULD_NOT_BE_PROCESSED;
    }
  } catch (err) {
    console.log(err);
    return ERROR_REQUEST_COULD_NOT_BE_PROCESSED;
  }
};
module.exports = openAiCall;
