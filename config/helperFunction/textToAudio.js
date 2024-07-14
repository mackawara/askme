const openai = require('../openAIconfig.js');
const path = require('path');
const speechFile = path.resolve('./speech.mp3');
const fs = require('fs');
const textToSpeech = async textInput => {
  try {
    const mp3 = await openai.audio.speech.create({
      model: 'tts-1',
      voice: 'nova',
      input: textInput,
    });
    console.log(speechFile);
    const buffer = Buffer.from(await mp3.arrayBuffer());
    fs.writeFileSync(speechFile, buffer);
    return { success: true, path: path.resolve(speechFile) };
  } catch (error) {
    console.log(JSON.parse(error.error.message[0])['msg'])
  //  console.log(JSON.parse(error.error.message[0]).msg);
   // console.log(JSON.stringify(error.error.message[0]).msg);
    return { success: false, path:'there was an error processing request' };
  }
};
module.exports = textToSpeech;
