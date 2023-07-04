const totalUsageModel = require("../../models/totalUsage");
const ReferalsModel = require("../../models/referals");

//const totalUsage = await totalUsageModel.findOne({}).exec();
const isFlagged = require("./isFlagged");
const docxCreator = require("./docxCreator");
const path = require("path");
const randomAdvert = require("./randomAdvert");

const saveReferal = require("./saveReferal");

const defaultRes = `Thank you for using AskMe, the number 1 app for Students,Parents and Teacher/Lecturers\n*How to get the best results from our AI model*\nYou can use our app to generate almost any written text as long as you povide proper context and use the guidelines below.
        1. Use good information as input - The better the starting point, the better results you'll get. Give examples of what you want, writing style , level etc\n\n2. Choose suitable prompts/messages - Choosing useful sentences or phrases will help get a good response from AI model. Instead of "osmosis", send useful questions such as "Please explain osmosis in point form and provide  3 examples" \n      
        3.Check responses carefully and give feedback. If you did not get the exact answer you needed , you can refine the question or ask for further explanation – Taking time when reviewing output helps detect errors that can be corrected via consistent feedback.\n\nEg you can ask for a shortend response or ask for emphasis on a certain point \n If you have the exact answer you want you can save it in a word document by quoting the message (click on the message dropdown and click on "reply") and typing "createDoc".\n *AskMe* can keep track of messages sent within the latest 2 minutes, so you dont have to start afresh if you dont get what you want, just correct where correction is needed`;
const ignorePatterns =
  /^(ok|oky|thank you|ok thank you|ouky|thanx|It's ok. Thank you so much|hi ask me|noted|hello|good night|ok thank you|k|night|Youre welcome|welcome|you welcome|Hie|hy|thanks?|k|[hi]+|\bhey\b)\W*$/gi;
//helper Functions
const getSecsToMidNight = require("./getSecsToMidnight");
const isSystemNotBusy = require("./isSystemNotBusy");
const processSub = require("./processSub");

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
      const expiryTime = await getSecsToMidNight();
      console.log(expiryTime);

      const user = await usersModel
        .findOne({ serialisedNumber: chatID })
        .exec();
      let tokenLimit = 140;

      const expTime = getSecsToMidNight();
      //  console.log(`the user ${user}`);

      let prompt = await msgBody.replace(/openAi:|createDoc/gi, "");
      //only use on direct messages
      console.log(chatID, msgBody);
      if (!chat.isGroup && !msg.isStatus) {
        // if user is not already in Redis
        const exists = await redisClient.exists(chatID);
        console.log(`does exists `, await exists);
        //check the redis DB if there is an entry from the number

        if (!(await exists)) {
          console.log("number not in redis DB");
          //check if user exists already in the database

          //means in each conversation there is only 1 DB check meaning subsequent calls are faster

          let serialisedNumber, notifyName, number;
          serialisedNumber = await contact.id._serialized;
          notifyName = await contact.pushname;
          number = chatID.slice(0, 12);
          console.log(notifyName, number, serialisedNumber);
          let isSubscribed, isBlocked;
          // if contact is not already saved save to DB
          if (!user) {
            console.log(!user);
            //check if the user is in the referals
            const referal = ReferalsModel.findOne({
              targetSerialisedNumber: chatID,
            });
            //if it has been previously referred update to now User
            if (referal) {
              const referer = await referal.referingNumber;
              try {
                referal.set({ isNowUser: user });
                referal.save();
              } catch (err) {
                console.log(err);
              }
            }

            console.log(`${chatID}, was not found in the DB`);
            //save them to DB
            const newContact = new usersModel({
              date: new Date().toISOString().slice(0, 10),
              isBlocked: false,
              notifyName: notifyName,
              number: number,
              serialisedNumber: serialisedNumber,
              isSubscribed: false,
              referalList: [],
              errorsRec: 0,
              totalTokens: 0,
              inputTokens: 0,
              completionTokens: 0,
              tokensPerCall: 0,
              costPerCall: 0,
              subTTL: 30,
              costPerDay: 0,
              callsPerDay: 0,
              warnings: 0,
              calls: 0,
              timestamp: Date.now(),
            });
            try {
              await newContact.save();
              client.sendMessage(me, "New user added  " + chatID);
              client.sendMessage(
                serialisedNumber,
                `Hi ${notifyName},thank you for using AskMe, the AI powered virtual study assistant.\n Join our group to stay up to date https://chat.whatsapp.com/I5RNx9PsfYjE0NV3vNijk3 \n*Please Read* As a free user you are limited to 3 requests/messages per 24 hour period.\n Subscribe here https://bit.ly/askME_AI_payment to upgrade to 25 messages per day and longer, more complete messages\n*How to use*\n1. *Simply* ask any question and wait for a response. For example you can ask "Explain the theory of relativity"or \n "Give me a step by step procedure of mounting an engine",if the response is incomplete you can just say "continue". Yes, you can chat to *AskMe* as you would to a human (*a super intelligent, all knowing human*) because *Askme* remembers topics that you talked about for the previous 30 minutes.\n\n What *Askme* cannot do\n1.Provide updates on current events (events after October 2021)\n2.Provide opinions on subjective things,\nWe hope you enjoy using the app. Please avoid making too many requests in short period of time, as this may slow down the app and cause your number to be blocked if warnings are not heeded. If your refer 3 people that eventually become users of AskME you fet additional usage priviledges simply send referal and their number e.g referal 263774111111`
              );
            } catch (err) {
              client.sendMessage(me, "Save new user failed");
              console.log(err.errors);
            }
            await redisClient.hSet(chatID, {
              isBlocked: "0",
              calls: 0,
              isSubscribed: "0",
            }); //

            await redisClient.expire(chatID, expiryTime);
          } else {
            await redisClient
              .set(`${chatID}shortTTL`, 1)
              .then(async (result) => {
                console.log(`short ttl`, result);
              });
            await redisClient.expire(`${chatID}shortTTL`, 30);

            console.log("not found in redis but ther in DB");
            // console.log(`Line subscribed`, user.isBlocked, user.isSubscribed);

            if (user.isBlocked) {
              console.log("use is blocke in mongodb");
              isBlocked = "1";
            } else {
              console.log("user is not blocke" + user.isBlocked);
              isBlocked = "0";
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
              calls: 0,
              isSubscribed: isSubscribed,
            });
            await redisClient.expire(chatID, expiryTime);
          }
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
            user.warnings++;
            try {
              user.save();
            } catch (err) {
              console.log(err);
            }
            return;
          }
          //if found in redis DB
          // update the number of calls made

          //  check if blocked
          if ((await redisClient.hGet(chatID, "isBlocked")) == "1") {
            msg.reply(
              "*Do not reply to this message* \nSorry , you have used up your quota,Subscribe to get standard user privileges or Try again tommorow!! You can gain standard user priviledges ( with up to 20 requests per day) if you refer 3 people to use AskMe\nJust send the number *referal number*\n For example \n referal 26377111111\n . Join our group to find out how it works.  https://chat.whatsapp.com/I5RNx9PsfYjE0NV3vNijk3 "
            );
            return;
          }
        }
        console.log("line 182");
        //check if there are ignoable message
        if (ignorePatterns.test(msgBody.toLowerCase())) {
          msg.reply(
            "*System message*\n Thank you for using AskMe. Do not send greeting messages or messages such as thank you or you are welcome etc... The will use up your quota"
          );
          return;
        }

        //check if it is not elevation message

        if (chatID == process.env.ME) {
          if (await elevate(msg, chatID, redisClient)) {
            return;
          } else if (msgBody.startsWith("broadcast:")) {
            // for sending Broadcast messages
            const broadcast = msgBody.replace(/broadcast:/gi, "");
            const users = await usersModel.find().exec();
            users.forEach(async (user) => {
              try {
                client.sendMessage(user.serialisedNumber, broadcast);
                await timeDelay(Math.floor(Math.random() * 10) * 1000);
              } catch (err) {
                console.log(err);
              }
            });

            return;
          } else if (msgBody.startsWith("processSub:")) {
            processSub(msg, client, redisClient);
            return;
          }
        }
        // process referalls

        console.log(msgBody.slice(0, 8).toLowerCase().trim());
        if (/referal|referral/.test(msgBody.slice(0, 8).toLowerCase().trim())) {
          console.log("processing ref");
          const res = await saveReferal(msgBody, chatID, client);
          msg.reply(res);
          return;
        }

        // create docs
        if (
          /createDoc|create doc|creat doc|Create doc/gi.test(
            msgBody.trim().toLowerCase()
          )
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
              "*Error!! No quoted message found*\n If you would like to *download a word document* from the response generated by Askme , simply *reply* (by swiping right or click on reply arrow on the message with the content) and  *create doc* This will allow you to save what AskMe has given you in a word document . Watch this demonstration on our Tiktok https://vm.tiktok.com/ZM25Htygr/) "
            );
          }
          return;
        }
        //Check if melissage has media
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
            `review msg from ${chatID.slice(0, 12)} ${msgBody} flagged `
          );
          return;
        }

        //aINCREASE THE COUNT
        await redisClient.HINCRBY(chatID, "calls", 1);
        const calls = await redisClient.hGet(chatID, "calls");
        //let messages = JSON.parse(await redisClient.hGet(chatID, "messages"));
        //messages.push({ role: "user", content: prompt });

        //for unsubscribed users check if they have exceeded daily limit of 3 calls
        const isSubscribed = await redisClient.hGet(chatID, "isSubscribed");
        console.log(
          `current calls are`,
          await redisClient.hGet(chatID, "calls")
        );
        //if user is not sunscribed
        if (isSubscribed == "0") {
          console.log("user not subbed");
          if (parseInt(JSON.parse(calls)) < 3) {
            console.log("is under the quota");
            tokenLimit = 125;
          } else {
            redisClient.del(`${chatID}messages`, "messages");
            msg.reply(
              "*To continue, Click here to subscribe* \n https://bit.ly/askME_AI_payment . \nStandard subcription costs 12000 Ecocash\n\n Standard users get the following \n \n*25 requests per month*\n*Access to advanced features such as image generation*\n *Longer and more complete answers*\n *No adverts*  \n\nTo get additional requests on a free tier you can promote AskMe by sending *referal + number of a friend* whom you think can benefit from using AI in their study. Once you gain 3 converted referalls you will gain 2 days as a standard user with less restrictions"
            );
            await redisClient.hSet(chatID, "isBlocked", "1");
            return;
          }
        }
        // if user is subscribed
        else if (isSubscribed == "1") {
          if (parseInt(JSON.parse(calls)) < 26) {
            console.log("and is subscribed so set limit to 500");
            //set token limits based on subscription
            tokenLimit = 300;
          } else {
            msg.reply(
              "*Do not reply*You have exceeded your quota.Your subscription has a total of 25 requests per day. If you ne"
            );
            return;
          }
        }

        if (msgBody.length > 300 && isSubscribed == "0") {
          msg.reply(
            "Your message is too long. Upgrade to subscription service if you want longer scope and higher quotas. You can break it down into smaller bits or summarise. "
          );
          return;
        }

        //check if there is messages

        //make opena API cal
        const openAiCall = require("./openai");
        console.log("test line 222");
        const response = await openAiCall(
          chatID,
          tokenLimit,
          redisClient,
          prompt
        );
        if (
          response ==
            "Error , request could not be processed, please try again later" ||
          response ==
            "I can only continue based on previous 3 messages if they were made within the last 3 minutes"
        ) {
          redisClient.HINCRBY(chatID, "calls", -1);
          msg.reply(response);
          return;
        } else {
          if (chatID == "263775231426@c.us" || isSubscribed == "1") {
            msg.reply(response);
          } else {
            msg.reply(
              `*${randomAdvert()}*\n\n${response}\n \n*Unlock knowledge, AskMe!*`
            );
          }
        }
      }
    });
  }
  //run when group is left
};

module.exports = clientOn;
