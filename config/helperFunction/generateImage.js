const { Configuration, OpenAIApi } = require("openai");

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const createImage = async (msgBody, chatID, redisClient) => {
  //test if formatted well
  if (/create Image|createImage/gi.test(msgBody.slice(0, 7))) {
    return "Error Your message is not formatted correctly for createImageeration\n Use the example below\ncreateImage a white cloud covering a mountain ";
  }
  //remove keyword
  const prompt = await msgBody.replace(/createImage|createImage/gi, "").trim();
  //test prompt for flagged
  if (/naked|sex|porn/gi.test(prompt)) {
    return "Error:Your prompt has been rejected beacuse it violates usage policies";
  }
  const openai = new OpenAIApi(configuration);

  const fileName = prompt.slice(0, 8).replace(/\s/gi, "");
  const outputPath = `../../assets/${fileName}${chatID}.jpg`;

  try {
    const response = await openai.createImage({
      prompt: prompt,
      n: 1,
      size: "256x256",
      response_format: "url",
      user: chatID,
    });

    if (response) {

      const url = response.data.data[0].url;
      await redisClient.HINCRBY(chatID, "calls", 15);
      return url
    }
    //console.log(image);
  } catch (err) {
    return `Error : there was an error processing your image please check if it has any harmful content or anything that maybe against our usage policies`;
  }
};
module.exports = createImage;
