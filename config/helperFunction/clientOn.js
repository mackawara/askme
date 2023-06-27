const totalUsageModel = require("../../models/totalUsage");

//const totalUsage = await totalUsageModel.findOne({}).exec();
const isFlagged = require("./isFlagged");
const docxCreator = require("./docxCreator");
const path = require("path");

const defaultRes = `Thank you for using AskMe, the number 1 app for Students,Parents and Teacher/Lecturers\n*How to get the best results from our AI model*\nYou can use our app to generate almost any written text as long as you povide proper context and use the guidelines below.
        1. Use good information as input - The better the starting point, the better results you'll get. Give examples of what you want, writing style , level etc\n\n2. Choose suitable prompts/messages - Choosing useful sentences or phrases will help get a good response from AI model. Instead of "osmosis", send useful questions such as "Please explain osmosis in point form and provide  3 examples" \n      
        3.Check responses carefully and give feedback. If you did not get the exact answer you needed , you can refine the question or ask for further explanation – Taking time when reviewing output helps detect errors that can be corrected via consistent feedback.\n\nEg you can ask for a shortend response or ask for emphasis on a certain point \n If you have the exact answer you want you can save it in a word document by quoting the message (click on the message dropdown and click on "reply") and typing "createDoc".\n *AskMe* can keep track of messages sent within the latest 2 minutes, so you dont have to start afresh if you dont get what you want, just correct where correction is needed`;
const ignorePatterns =
  /^(ok|oky|thank you|ok thank you|It's ok. Thank you so much|hi ask me|noted|hello|good night|ok thank you|k|night|Youre welcome|welcome|you welcome|thanks?|k|[hi]+|\bhey\b)\W*$/i;
//helper Functions
const getSecsToMidNight = require("./getSecsToMidnight");
const isSystemNotBusy = require("./isSystemNotBusy");

let messages = [];

const timeDelay = (ms) => new Promise((res) => setTimeout(res, ms));
const clientOn = async (client, arg1, redisClient, MessageMedia) => {
  const fs = require("fs/promises");
  const me = process.env.ME;
  const usersModel = require("../../models/individualUsers");
  //const { MessageMedia } = require("whatsapp-web.js");

  // let groupName, grpDescription;
  if (arg1 == "message") {
    client.on(`message`, async (msg) => {
      const elevate = require("./elevate");
      const chat = await msg.getChat();
      const contact = await msg.getContact();
      const msgBody = msg.body;
      const chatID = msg.from;

      const user = await usersModel
        .findOne({ serialisedNumber: chatID })
        .exec();
      let tokenLimit = 150;

      const expTime = getSecsToMidNight();
      //  console.log(`the user ${user}`);

      let prompt = await msgBody.replace(/openAi:|createDoc/gi, "");
      //only use on direct messages
      console.log(chatID, msgBody);
      if (!chat.isGroup && !msg.isStatus) {
        // if user is not already in
        const exists = await redisClient.exists(chatID);
        console.log(`does exists `, await exists);
        //check the redis DB if there is an entry from the number

        if (!(await exists)) {
          console.log("number not in redis DB");
          //check if user exists already in the database

          //means in each conversation there is only 1 DB check meaning subsequent calls are faster

          let serialisedNumber, notifyName, number;
          serialisedNumber = contact.id._serialized;
          notifyName = contact.pushname;
          number = contact.number;
          let isSubscribed, isBlocked;
          // if contact is not already saved save to DB
          if (!user) {
            console.log(!user);
            //check if the user is in the DB
            console.log(`${chatID}, was not found in the DB`);
            //save them to DB
            const newContact = new usersModel({
              date: new Date().toISOString().slice(0, 10),
              isBlocked: false,
              number: number,
              notifyName: notifyName,
              serialisedNumber: serialisedNumber,
              isSubscribed: false,
              referalList: [],
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
              await newContact
                .save()
                .then((result) =>
                  client.sendMessage(me, "New user added  " + chatID)
                );
              client.sendMessage(
                serialisedNumber,
                `Hi ${notifyName},thank you for using AskMe, the AI powered virtual assistant.\n As a free user you are limited to 3 requests/messages per 24 hour period.\n*How to use*\n1. *Simply* ask any question and wait for a response. For example you can ask "Explain the theory of relativity"or \n "Give me a step by step procedure of mounting an engine",if the response is incomplete you can just say "continue". Yes, you can chat to *AskMe* as you would to a human (*a super intelligent, all knowing human*) because *Askme* remembers topics that you talked about for the previous 30 minutes.\n\n What *Askme* cannot do\n1.Provide updates on current events (events after October 2021)\n2.Provide opinions on subjective things,\nWe hope you enjoy using the app. Please avoid making too many requests in short period of time, as this may slow down the app and cause your number to be blocked if warnings are not heeded. Your feedback is valued , please send suggestions to 0775231426`
              );
            } catch (err) {
              console.log(err);
            }
            await redisClient.hSet(chatID, {
              isBlocked: "0",
              calls: 1,
              isSubscribed: "0",
              messages: JSON.stringify([]),
            });
          } else {
            console.log("not found in redis but ther in DB");
            console.log(`Line subscribed`, user.isBlocked, user.isSubscribed);

            if (!user.isBlocked) {
              isBlocked = "0";
            } else {
              console.log("user is blocke" + user.isBlocked);
              isBlocked = "1";
            }

            if (user.isSubscribed) {
              console.log("Use is subscribed now setting to 1");
              isSubscribed = "1";
            } else {
              console.log(`${user.isSubscribed} is the one we are setting`);
              isSubscribed = "0";
            }

            console.log(isBlocked, isSubscribed);
            await redisClient.hSet(chatID, {
              isBlocked: isBlocked,
              calls: 1,
              isSubscribed: isSubscribed,
              messages: JSON.stringify([]),
            });

            await redisClient.expire(chatID, 86400);
          }
          await redisClient.set(`${chatID}shortTTL`, 1).then(async (result) => {
            console.log(`short ttl`, result);
          });
          await redisClient.expire(`${chatID}shortTTL`, 30);
        }
        //else if the user is already logged IN
        else {
          //  the  shortTTL represents the number of calls in previos 30 secons
          //check if short term TTL
          await redisClient
            .incrBy(`${chatID}shortTTL`, 1)
            .then(async (result) => {
              console.log(`short ttl`, result);
            });
          await redisClient.expire(`${chatID}shortTTL`, 30);

          const shortTTL = await redisClient.get(`${chatID}shortTTL`);
          console.log(`line 108`, shortTTL);
          if (parseInt(shortTTL) > 2) {
            //if user has made  more than  2 block
            console.log("is more than 2");
            msg.reply(
              `*Error*, you have made too many requests within a short space of time, Wait at least 1 minute!!`
            );
            return;
          }
          //if found in redis DB
          // update the number of calls made

          //  check if blocked
          if ((await redisClient.hGet(chatID, "isBlocked")) == "1") {
            msg.reply(
              "You are currently blocked ,perhaps you have exceeded your daily quota, Please try again  in 24 hours.\n You are only allowed 3 requests per day, use them sparingly.Repeated attempts will result in suspension or permanent blocking.Participating tester can request for increased quotas on this number 0775231426"
            );
            return;
          }
        }
        console.log("line 182");
        //check if there are ignoable message
        if (ignorePatterns.test(msgBody.toLowerCase())) {
          // msg.reply(defaultRes);
          return;
        }

        //check if it is not elevation message

        if (chatID == process.env.ME) {
          if (await elevate(msg, redisClient)) {
            return;
          } else if (msgBody.startsWith("broadcast:")) {
            // for sending Broadcast messages
            const broadcast = msgBody.replace(/broadcast:/gi, "");
            const users = await usersModel.find().exec();
            users.forEach((user) => {
              try {
                client.sendMessage(user.serialisedNumber, broadcast);
              } catch (err) {
                console.log(err);
              }
            });
          }
        }

        // create docs
        if (
          /createDoc|create doc|Create doc/gi.test(msgBody.trim().toLowerCase())
        ) {
          if (msg.hasQuotedMsg) {
            const message = await msg.getQuotedMessage();
            const qtdMsgBody = message.body;
            const timestamp = message.timestamp;

            msg.reply(
              "Please be patient while system generates your docx file"
            );
            const pathRet = await docxCreator(qtdMsgBody, chatID, timestamp);

            client.sendMessage(chatID, MessageMedia.fromFilePath(pathRet));
            return;
          } else {
            msg.reply(
              "*Error!! No quoted message found*\n If you would like to *download a word document* from the response generated by Askme , simply *reply* the message with the content with create doc(be sure to the *reply* button to *quote* the message) "
            );
          }
          return;
        }
        //Check if message has media
        if (msg.hasMedia) {
          msg.reply(
            "Our apologies, current version is not yet able to process media such as images and audio, please make a textual request"
          );
          return;
        }
        //Check if system is not going over API limits
        if (!isSystemNotBusy(msg, redisClient)) {
          return;
        }
        console.log(`is flagged`, isFlagged(msgBody));
        if (isFlagged(msgBody)) {
          msg.reply(
            "Sorry!,Your request has been flagged because it has words identified as having potential to be used for illicit/immoral uses and has been sent to the adminstrator for review. If you feel you have been wrongly flagged do appeal to our admin on this number 0775231426"
          );
          client.sendMessage(
            me,
            `review msg from ${chatID} ${msgBody} flagged `
          );
          return;
        }

        //add messages to list in prep for AI call
        let callsMade = await redisClient.hGet(chatID, "calls");
        callsMade = parseInt(callsMade) + 1;
        await redisClient.hSet(chatID, "calls", callsMade);
        //let messages = JSON.parse(await redisClient.hGet(chatID, "messages"));
        //messages.push({ role: "user", content: prompt });

        //for unsubscribed users check if they have exceeded daily limit of 3 calls
        const isSubscribed = await redisClient.hGet(chatID, "isSubscribed");

        if (isSubscribed == "0") {
          console.log("user not subbed");
          if (callsMade < 3) {
            console.log("is under the quota");
            tokenLimit = 100;
          } else {
            redisClient.del(chatID, "messages");
            msg.reply(
              "*You have exceed your daily quota*\n Users on free subscription are limited to 10 requests per 24 hour period.\nIf you are a tester from any one of the schools/institutions we are currently working with and have been mistakenly restricted please contact us on 0775231426"
            );
            await redisClient.hSet(chatID, "isBlocked", "1");
            return;
          }
        }
        // if user is subscribed
        else {
          if (callsMade < 20) {
            console.log("and is subscribed so set limit to 500");
            //set token limits based on subscription
            tokenLimit = 400;
          } else {
            return;
          }
        }

        //make opena API cal
        const openAiCall = require("./openai");
        console.log("test line 222");
        const response = await openAiCall(
          chatID,
          tokenLimit,
          redisClient,
          prompt
        );
        msg.reply(response);
      }
    });
  }
  //run when group is left
};

module.exports = clientOn;
