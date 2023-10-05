const openai = require("../openAIconfig.js")
const messages = require("../../constants/messages.js")
const createImage = async (msgBody, chatID, redisClient) => {
  if (/create Image|createImage/gi.test(msgBody.slice(0, 7))) {
    return messages.MESSAGE_NOT_FORMATTED_FOR_IMAGE_GENERATION
  }
  //remove keyword
  const prompt = await msgBody.replace(/createImage|createImage/gi, "").trim();
  //test prompt for flagged
  if (/naked|sex|porn/gi.test(prompt)) {
    return messages.PROMPTS_VIOLATES_POLICIES
  }

  try {
    const response = await openai.images.generate({
      prompt: prompt,
      n: 1,
      size: "256x256",
      response_format: "url",
      user: chatID,
    });

    if (response) {
      const url = response.data[0].url;
      await redisClient.HINCRBY(chatID, "calls", -15);
      return url
    }
    //console.log(image);
  } catch (err) {
    console.log(err)
    return messages.ERROR_IMAGE_NOT_PROCESSED
  }
};
module.exports = createImage;
