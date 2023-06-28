require("dotenv").config();
const connectDB = require("./config/database");
const createDoc = require("./config/helperFunction/docxCreator");
const indvUsers = require("./models/individualUsers");
const totalUsage = require("./models/totalUsage");
const paynow=require("./paynow")
paynow()

const qrcode = require("qrcode-terminal");
const {
  AggregateSteps,
  AggregateGroupByReducers,
  createClient,
  SchemaFieldTypes,
  redis,
} = require("redis");

//initialise redis
const redisClient = createClient();

// connect to mongodb before running anything on the app
connectDB().then(async () => {
  const { Client, LocalAuth, MessageMedia } = require("whatsapp-web.js");
  let callsPErday = 0;
  // redis clent connections
  redisClient.on("error", (err) => console.log("Redis Client Error", err));
  await redisClient.connect();
  // redisClient.flushDb().then(() => console.log("redis DB flushed"));

  const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
      executablePath: process.env.EXECPATH,
      handleSIGINT: true,
      headless: true,
      args: [
        "--log-level=3", // fatal only
        "--start-maximized",
        "--no-default-browser-check",
        "--disable-infobars",
        "--disable-web-security",
        "--disable-site-isolation-trials",
        "--no-experiments",
        "--ignore-gpu-blacklist",
        "--ignore-certificate-errors",
        "--ignore-certificate-errors-spki-list",
        "--disable-gpu",
        "--disable-extensions",
        "--disable-default-apps",
        "--enable-features=NetworkService",
        "--disable-setuid-sandbox",
        "--no-sandbox",
      ],
    },
  });

  //client2.initialize();
  client.initialize();

  //messaging client resources
  const clientOn = require("./config/helperFunction/clientOn");

  client.on("auth_failure", (msg) => {
    console.error("AUTHENTICATION FAILURE", msg);
  });
  client.on("authenticated", async (session) => {
    console.log(`client authenticated`);
  });

  client.on("qr", (qr) => {
    qrcode.generate(qr, { small: true });
    console.log(qr);
  });

  client.on("ready", async () => {
    const timeDelay = (ms) => new Promise((res) => setTimeout(res, ms));
    console.log("Client is ready!");
    //functions abd resources
    //Helper Functions

    const cron = require("node-cron");
    cron.schedule(`42 17 * * 7`, async () => {
      const allChats = await client.getChats();
      allChats.forEach((chat) => chat.clearMessages());
    });
    await redisClient.setEx(`callsThis30secCycle`, 30, "0");

    //client events and functions
    //decalre variables that work with client here
    clientOn(client, "message", redisClient, MessageMedia);
    //client

    //Db models
    //decalre variables that work with client here
    client.setDisplayName("AskMe, the all knowing assistant");

    //mass messages
    cron.schedule(`10 12 * * Fri`, async () => {
      const broadcastMessage = [
        `Fantastic news! Our app has now upped the game with a brilliant feature that lets you save all your AI-generated notes, letters and resources.\n It's so easy - just chat with our smart AI-powered bot to refine your results, ask for shortening or further explanations if needed. \nAnd when everything is perfect, simply quote/reply to the message using *"createDoc"* as shown and voila!, you'll get a downloadable word docx file in no time.
      Be sure to test out this amazing new function today and let us know what you think on 0775231426. Get organized effortlessly like never before!`,
        `*How to get the best results from our AI model*
      You can use our app to generate almost any written text as long as you povide proper context and use the guidelines below.
      1. Use good information as input - The better the starting point, the better results you'll get. Give examples of what you want, writing style , level etc
      
      2. Choose suitable prompts/messages - Choosing useful sentences or phrases will help get a good response from AI model.
      
      3.Check responses carefully and give feedback – Taking time when reviewing output helps detect errors that can be corrected via consistent feedback.Eg you can ask for a shortend response or ask for emphasis on a certain point`,
        ,
        `We are in the process of adding new features such as exporting word documents and at times while we test, we need to have the software offline. In the event that you do not get a response, just wait and try later`,
      ];
      const askMeClients = await indvUsers.find({});

      askMeClients.forEach(async (askMeclient) => {
        try {
          client.sendMessage(
            askMeclient,
            MessageMedia.fromFilePath("./assets/example.png")
          );

          client.sendMessage(
            askMeclient.serialisedNumber,
            `*Usage Tip*\nTo download a word doc simply quote/reply the message from AskMe (long press on message and click reply) the message with "createDoc", \nWithout the quotation marks `
          );
          await timeDelay(Math.floor(Math.random() * 10) * 1000);
        } catch (err) {
          console.log(err);
        }
      });
    });

    //
    // get the latest updates
    let calls = 0;
    const date = new Date();
    const yestdate = date.setDate(date.getDate() - 1);
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(yestdate).toISOString().slice(0, 10);

    //collect media adverts and send
    //const mediaModel = require("./models/media");

    client.on("disconnected", (reason) => {
      console.log("Client was logged out", reason);
    });
  });
});
