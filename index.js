const connectDB = require("./config/database");
const createDoc = require("./config/helperFunction/docxCreator");
const clientsModel = require("./models/contactsModel");
require("dotenv").config();
// connect to mongodb before running anything on the app
connectDB().then(async () => {
  const { Client, LocalAuth, MessageMedia } = require("whatsapp-web.js");
  let callsPErday = 0;
  await clientsModel.deleteMany({ calls: 0 }).exec();
  const askMeClients = await clientsModel.find({}).exec();
  askMeClients.forEach(async (item) => {
    await item
      .calculateTokensPerCallAndSave()
      .then((result) =>
        result
          .calculateCostPerCall()
          .then((data) =>
            data.calculateCallsPerDay().then((res) => res.calculateCostPerDay())
          )
      );
  });

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
  clientOn(client, "authenticated");
  clientOn(client, "auth_failure");
  clientOn(client, "qr");

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

    //client events and functions
    //decalre variables that work with client here
    clientOn(client, "message", "", MessageMedia);
    clientOn(client, "group-join");
    clientOn(client, "group-leave"); //client

    //Db models
    //decalre variables that work with client here
    client.setDisplayName("AskMe, the all knowing assistant");

    //mass messages
    cron.schedule(`59 6 * * 1,7,3`, async () => {
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
      const askMeClients = await clientsModel.find({});

      const iteration = Math.floor(
        Math.floor(Math.random() * 10) * broadcastMessage.length
      );
      askMeClients.forEach(async (askMeclient) => {
        try {
          client.sendMessage(
            askMeclient,
            MessageMedia.fromFilePath("./assets/example.png")
          );

          client.sendMessage(askMeclient.serialisedNumber, broadcastMessage[1]);
          await timeDelay(Math.floor(Math.random() * 10) * 1000);
        } catch (err) {
          console.log(err);
        }
      });
    });

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
