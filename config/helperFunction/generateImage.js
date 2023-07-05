const { Configuration, OpenAIApi } = require("openai");
const fs = require("fs");
const { json } = require("stream/consumers");
const convertBSonTojpeg = require("./convertBSonToJpeg");
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

  const fileNAme = prompt.slice(0, 8).replace(/\s/gi, "");
  const filepath = `../../assets/${fileNAme}${chatID}.jpg`;
  const imagepath = fs.readFile("../../test.b64_json", (err) => {
    if (err) console.log(err);
    else {
      return;
    }
  });
  try {
    return await convertBSonTojpeg(imagepath, filepath);
  } catch (err) {
    console.log(err);
    return "Error";
  }
  try {
    const response = await openai.createImage({
      prompt: prompt,
      n: 1,
      size: "256x256",
      response_format: "b64_json",
      user: chatID,
    });

    if (response) {
      const image = await response.data.data[0].b64_json;
      console.log(image);
      fs.writeFile(`./test.b64_json`, image, function (err) {
        if (err) throw err;
        console.log("Image saved successfully.");
      });

      redisClient.HINCRBY(chatID, "calls", 10);
      console.log(image);

      // Step 2: Define your base64-encoded JSON string
      const fileNAme = prompt.slice(0, 8).replace(/\s/gi, "");
      const filepath = `../../assets/${fileNAme}${chatID}.jpg`;
      const imagepath = await fs.readFile("../../test.b64_json");
      try {
        convertBSonTojpeg(imagepath, filepath);
      } catch {
        console.log("error happend");
      }

      // Step 3: Decode the Base-64 String
      const jsonDataBuffer = Buffer.from(b65JsonString, "base64");
      const jsonData = jsonDataBuffer.toString();

      // Step 4: Parse the decoded JSON data into an object
      const jsonObject = jsonData;

      // Check if json contains an "image" property with valid Base-64 encoded image data.
      if (jsonObject.image) {
        // Write this image data to disk as .jpg file

        const imageDataBuffer = Buffer.from(jsonObject.image, "base64");

        fs.writeFile(filepath, imageDataBuffer, function (err) {
          if (err) throw err;
          console.log("Image saved successfully.");

          return filepath;
        });
      } else {
        console.log("Invalid or missing image data.");
        return "Error: image could not be processed";
      }
    } else {
      return "Error your image could not be generated";
    }
  } catch (err) {
    console.log(err);
    //console.log(err.data.error.message);
    return `Error : there was an error processing your image please check if it has any harmful content or anything that maybe against our usage policies`;
  }
};
module.exports = createImage;
