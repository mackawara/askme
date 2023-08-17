const { Configuration, OpenAIApi } = require("openai");

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const createImage = async (msgBody, chatID, redisClient) => {

  /* const messages=[{role:"system", content: "you will be given a prompt to create an image, this  prompt may not be having sufficent detail for creation of a good detailed, accurate image. If that is the case you will  for image generation model to"}]
    const response = await openai
      .createCompletion({
        model: "gpt-4",
        messages: messages,
        temperature: 0.5,
        max_tokens: tokenLimit,
        frequency_penalty: 1.5,
        presence_penalty: 1.89,
      }) */
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
      size: "512x512",
      response_format: "url",
      user: chatID,
    });

    if (response) {

      const url = response.data.data[0].url;
      await redisClient.HINCRBY(chatID, "calls", -15);
      return url
    }
    //console.log(image);
  } catch (err) {
    console.log(err)
    return `Error : there was an error processing your image please check if it has any harmful content or anything that maybe against our usage policies`;
  }
};
module.exports = createImage;
