const openai = require('../openAIconfig.js');
const messages = require('../../constants/messages.js');
const createImage = async (msgBody, chatID, redisClient) => {
  if (/create Image|createImage/gi.test(msgBody.slice(0, 7))) {
    return messages.MESSAGE_NOT_FORMATTED_FOR_IMAGE_GENERATION;
  }
  //remove keyword
  const prompt = await msgBody.replace(/createImage|createImage/gi, '').trim();
  const enhancePrompt = async prompt => {
    console.log('enhancng prompt');
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4-0613',
        messages: [
          {
            role: 'system',
            content:
              'your task is to take a user`s prompt and IMPROVE on it by enhancing the description such that a AI image generator can produce a higher quality image. TAKE TIME to think how you would prduce the best image and then describe the image in best detail.You MAY add descriptions of the surrounding or background according to the users prompt IF  you do not have anything to add or you do not understand how you can improve on it return the user`s PROMP VERBATIM IF the users prompt is unclear ,incomplete or ambiguous DO NOT ASK FOR MORE INFORMATION OR CLARITY just return AN EXACT COPY of the user`s prompt.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.5,
        max_tokens: 300,
        frequency_penalty: 1.5,
        presence_penalty: 1.89,
      });
      return response.choices[0]['message']['content'];
    } catch (err) {
      console.log(err);
      return prompt;
    }
  };
  let enhancedPrompt = await enhancePrompt(prompt);

  console.log(enhancedPrompt);
  //test prompt for flagged
  if (/naked|sex|porn/gi.test(prompt)) {
    return messages.PROMPTS_VIOLATES_POLICIES;
  }

  try {
    const response = await openai.images.generate({
      prompt: enhancedPrompt,
      model: 'dall-e-3',
      n: 1,
      size: '1024x1024',
      style: 'vivid',
      response_format: 'url',
      user: chatID,
    });

    if (response) {
      const url = response.data[0].url;
      await redisClient.HINCRBY(chatID, 'calls', -15);
      return url;
    }
    //console.log(image);
  } catch (err) {
    console.log(err);
    return messages.ERROR_IMAGE_NOT_PROCESSED;
  }
};
module.exports = createImage;
