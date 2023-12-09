const { geminiPro } = require('../googleAi');

// Access your API key as an environment variable (see "Set up your API key" above)

const googleAi = async prompt => {
  // For text-only input, use the gemini-pro model

  const result = await geminiPro.generateContent(prompt);
  const response = await result.response;
  const text = response.text();
  return;
};

module.exports=googleAi
