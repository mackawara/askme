const { Configuration, OpenAIApi } = require("openai");
const fs = require("fs");
const { json } = require("stream/consumers");
const convertBSonTojpeg = require("./convertBSonToJpeg");
const { url } = require("inspector");
const downloadImageFromURL = require("./downloadImageFromUrl");
const http = require("http");
const https = require("https");
const contactsModel = require("../../models/individualUsers");
const Stream = require("stream").Transform;
//keyword createImage
//remove keyword from prompt
//process image
//end back
//housekeeping
//only subscribers
//equal to 10 calls
// params chatID,redis,msg
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
  //const imagepath = fs.readFile("../../test.b64_json", (err) => {

  try {
    const response = await openai.createImage({
      prompt: prompt,
      n: 1,
      size: "256x256",
      response_format: "url",
      user: chatID,
    });

    if (response) {
    //  const image = response.data.data[0].b64_json;
     const url = response.data.data[0].url;
    //const url = `ttps://oaidalleapiprodscus.blob.core.windows.net/private/org-oeCrRII36xNn3U62fpPpolbS/user-91BXWXmwnqRHsuzR1Z9gEF0Q/img-cVf2NsrlXOgQgK88Ic1eDcTs.png?st=2023-07-06T09%3A14%3A33Z&se=2023-07-06T11%3A14%3A33Z&sp=r&sv=2021-08-06&sr=b&rscd=inline&rsct=image/png&skoid=6aaadede-4fb3-4698-a8f6-684d7786b067&sktid=a48cca56-e6da-484e-a814-9c849652bcb3&skt=2023-07-05T20%3A11%3A32Z&ske=2023-07-06T20%3A11%3A32Z&sks=b&skv=2021-08-06&sig=DZNMjBwtv42v1AVnxbCc3G0CRcx6RAQ5ZUV5rMdlJjY%3D`;
    let finalPath = `../../assets/${prompt.replace(" ", "").slice(0, 6)}.jpeg`;
    //download the url
    return  url
    }
    //console.log(image);
  } catch (err) {
    return `Error : there was an error processing your image please check if it has any harmful content or anything that maybe against our usage policies`;
  }
};
module.exports = createImage;
