const totalUsageModel = require("../../models/totalUsage");

//const totalUsage = await totalUsageModel.findOne({}).exec();
const isFlagged = require("./isFlagged");
const docxCreator = require("./docxCreator");
const path = require("path");

const chats = require("../../chats");

//helper Functions
const getSecsToMidNight = require("./getSecsToMidnight");

let messages = [];
const timeDelay = (ms) => new Promise((res) => setTimeout(res, ms));
const clientOn = async (client, arg1, redisClient, MessageMedia) => {
  const fs = require("fs/promises");
  const me = process.env.ME;
  const usersModel = require("../../models/individualUsers");
  //const { MessageMedia } = require("whatsapp-web.js");

  if (arg1 == "auth_failure") {
    client.on("auth_failure", (msg) => {
      // Fired if session restore was unsuccessful
      console.error("AUTHENTICATION FAILURE", msg);
    });
  }
  if (arg1 == "authenticated") {
    client.on("authenticated", async (session) => {
      console.log(`client authenticated`);
    });
  }
  const qrcode = require("qrcode-terminal");
  if (arg1 == "qr") {
    client.on("qr", (qr) => {
      qrcode.generate(qr, { small: true });
      console.log(qr);
    });
  }

  // let groupName, grpDescription;
  if (arg1 == "message") {
    client.on(`message`, async (msg) => {
      const chat = await msg.getChat();
      const contact = await msg.getContact();
      const chatID = msg.from;
      let tokenLimit = 150;

      const expTime = getSecsToMidNight();
      //  console.log(`the user ${user}`);

      const msgBody = msg.body;
      //only use on direct messages

      if (!chat.isGroup && !msg.isStatus) {
        console.log(chatID);

        const getNestedValue = async (key, subKey) => {
          return new Promise((resolve, reject) => {
            redisClient.hGetAll(key, (err, result) => {
              if (err || !result[subKey]) {
                reject(err);
              } else {
                resolve(result[subKey]);
              }
            });
          });
        };
        console.log("line 93");

        // if user is not already in
        const exists = await redisClient.exists(chatID);
        console.log(exists);
        if (!exists) {
          console.log("user not found");
          await redisClient.hSet(chatID, {
            isBlocked: "0",
            calls: 1,
            isSubscribed: "0",
            messages: JSON.stringify([{ role: "user", content: msgBody }]),
          });
          //check if user exists already in the database
          const contacts = await usersModel
            .find({ serialisedNumber: chatID })
            .exec();
          //means in each conversation there is only 1 DB check meaning subsequent calls are faster

          let serialisedNumber, notifyName, number;
          serialisedNumber = contact.id._serialized;
          notifyName = contact.pushname;
          number = contact.number;
          // if contact is not already saved save to DB
          if (contacts.length < 1) {
            const newContact = new usersModel({
              date: new Date().toISOString().slice(0, 10),
              isBlocked: false,
              number: number,
              notifyName: notifyName,
              serialisedNumber: serialisedNumber,
              isSubscribed: false,
              errorsRec: 0,
              totalTokens: 0,
              inputTokens: 0,
              completionTokens: 0,
              tokensPerCall: 0,
              warnings: 0,
              calls: 0,
              timestamp: Date.now(),
            });
            try {
              await newContact.save();
              client.sendMessage(
                serialisedNumber,
                `Hi ${notifyName},thank you for using AskMe, the AI powered virtual assistant.\n*How to use*\n1. *Simply* ask any question and wait for a response. For example you can ask "Explain the theory of relativity"or \n "Give me a step by step procedure of mounting an engine",if the response is incomplete you can just say "continue". Yes, you can chat to *AskMe* as you would to a human (*a super intelligent, all knowing human*) because *Askme* remembers topics that you talked about for the previous 30 minutes.\n\n What *Askme* cannot do\n1.Provide updates on current events (events after October 2021)\n2.Provide opinions on subjective things,\nWe hope you enjoy using the app. Please avoid making too many requests in short period of time, as this may slow down the app and cause your number to be blocked if warnings are not heeded. Your feedback is valued , please send suggestions to 0775231426`
              );
            } catch (err) {
              console.log(err);
            }
          }
        } else {
          //if found in redis DB
          console.log("user was found in the DB");
          let callsMade = await redisClient.hGet(chatID, "calls");
          callsMade++;
          await redisClient.hSet(
            chatID,
            "calls",
            callsMade,
            (result) => console.log(result)
            // console.log("calls updated to " + this.callsMade)
          );
          let messages = JSON.parse(await redisClient.hGet(chatID, "messages"));
          messages.push({ role: "user", content: msgBody });
          await redisClient.hSet(
            chatID,
            "messages",
            JSON.stringify(messages),
            (result) => console.log(result)
            // console.log("calls updated to " + this.callsMade)
          );
          console.log("line 140");
          console.log(await redisClient.hGetAll(chatID));
          //  await redisClient.incr(chatID, "calls");
          //  check if blocked
          if ((await redisClient.hGet(chatID, "isBlocked")) == "1") {
            msg.reply(
              "You have exceeded your daily quota, Please try again  tommorow.\n You are only allowed 5 requests per day, use them sparingly"
            );
            return;
          }
          console.log("line 149");
          //for unsubscribed users check if they have exceeded daily limit of 5 calls
          const isSubscribed = await redisClient.hGet(chatID, "isSubscribed");
          if (isSubscribed == "0") {
            console.log("user not subbed");
            if (callsMade < 5) {
              console.log("is under the quota");
              tokenLimit = 100;
            } else {
              msg.reply("You have exceed your daily quota");
              await redisClient.hSet(chatID, "isBlocked", "1");
              return;
            }
          } /* else {
            // if user is subscribed
            if (callsMade < 30) {
              console.log("and is subscribed so set limit to 500");
              //set token limits based on subscription
              tokenLimit = 400;
            }
          } */
        }
        console.log("line 168");
        console.log(tokenLimit);
        const defaultRes = `Thank you for using AskMe, the number 1 app for Students,Parents and Teacher/Lecturers\n*How to get the best results from our AI model*\nYou can use our app to generate almost any written text as long as you povide proper context and use the guidelines below.
        1. Use good information as input - The better the starting point, the better results you'll get. Give examples of what you want, writing style , level etc\n\n2. Choose suitable prompts/messages - Choosing useful sentences or phrases will help get a good response from AI model. Instead of "osmosis", send useful questions such as "Please explain osmosis in point form and provide  3 examples" \n      
        3.Check responses carefully and give feedback. If you did not get the exact answer you needed , you can refine the question or ask for further explanation – Taking time when reviewing output helps detect errors that can be corrected via consistent feedback.\n\nEg you can ask for a shortend response or ask for emphasis on a certain point \n If you have the exact answer you want you can save it in a word document by quoting the message (click on the message dropdown and click on "reply") and typing "createDoc".\n *AskMe* can keep track of messages sent within the latest 2 minutes, so you dont have to start afresh if you dont get what you want, just correct where correction is needed`;
        const ignorePatterns =
          /^(ok|thank you|Youre welcome|welcome|you welcome|thanks?|k|[hi]+|\bhey\b)\W*$/i;
        if (ignorePatterns.test(msgBody.toLowerCase())) {
          msg.reply(defaultRes);
          return;
        } //for tracking messages, check if there is an existing call log for the chat ID
        // check if message has any flagged word

        const openAiCall = require("./openai");

        let prompt = await msgBody.replace(/openAi:|createDoc/gi, "");
        const response = await openAiCall(
          prompt,
          chatID,
          tokenLimit,
          redisClient
        );
        msg.reply(response);
      }
    });
  }
  //run when group is left
};

module.exports = clientOn;
