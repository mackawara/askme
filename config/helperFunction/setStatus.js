const { Configuration, OpenAIApi } = require("openai");
  const configuration = new Configuration({
    organization: process.env.OPENAI_ORGANISATION_KEY,
    apiKey: process.env.OPENAI_API_KEY,
  });
  const messages=[{role: "system", content:"You are an education cheerleader, your job is to respond with  different motivational messages, inspirational quotes , exam tips for a whatsapp status that will be seen by students . The character limit is 600 characters. Your replies should not have a greeting (anything such as  hi or hello every message you send should be signed Daily motivation from Askme "},{role: "user",content:"hi"}]
  const setStatus=async(client)=>{

  const openai = new OpenAIApi(configuration);
  const statusMessage = await openai
    .createChatCompletion({
      model: "gpt-4",
      messages: messages,
      temperature: 0.5,
      max_tokens: tokenLimit,
      frequency_penalty: 1.5,
      presence_penalty: 1.89,
    })


    client.setStatus(statusMessage)

}
export default setStatus;