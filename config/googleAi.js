const { GoogleGenerativeAI } = require('@google/generative-ai');

// Access your API key as an environment variable (see "Set up your API key" above)
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_KEY);

// ...
const geminiProVision = genAI.getGenerativeModel({
  model: 'gemini-pro-vision',
});

const geminiPro = genAI.getGenerativeModel({ model: 'gemini-pro' });

module.exports = { geminiPro, geminiProVision };

// ...
