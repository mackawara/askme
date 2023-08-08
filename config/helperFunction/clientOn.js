const totalUsageModel = require("../../models/totalUsage");
const ReferalsModel = require("../../models/referals");

//const totalUsage = await totalUsageModel.findOne({}).exec();
const isFlagged = require("./isFlagged");
const docxCreator = require("./docxCreator");

const randomAdvert = require("./randomAdvert");
const generateImage = require("./generateImage")

const saveReferal = require("./saveReferal");

const ignorePatterns =
  /^(ok|oky|thank you|ok thank you|ouky|thanx|It's ok. Thank you so much|hey|hi ask me|noted|hello|good night|ok thank you|k|night|Youre welcome|welcome|hey|you welcome|Hie|hy|thanks?|k|[hi]+|\bhey\b)\W*$/gi;
//helper Functions
const getSecsToMidNight = require("./getSecsToMidnight");
const isSystemNotBusy = require("./isSystemNotBusy");
const processSub = require("./processSub");
const processFollower = require("./processFollower");
const timeDelay = (ms) => new Promise((res) => setTimeout(res, ms));
const clientOn = async (client, arg1, redisClient, MessageMedia) => {
  const me = process.env.ME;
  const usersModel = require("../../models/individualUsers");

  if (arg1 == "message") {
    client.on(`message`, async (msg) => {
      const elevate = require("./elevate");
      const chat = await msg.getChat();
      const contact = await msg.getContact();
      const msgBody = msg.body;
      const chatID = msg.from;
      const expiryTime = getSecsToMidNight();

      let tokenLimit = 180;
      let maxCalls = 1
      let isSubscribed, isFollower

      const expTime = getSecsToMidNight();

      let prompt = await msgBody.replace(/openAi:|createDoc/gi, "");
      //only use on direct messages

      if (!chat.isGroup && !msg.isStatus) {
        // if user is not already in Redis
        const exists = await redisClient.exists(chatID);
        const user = await usersModel
          .findOne({ serialisedNumber: chatID })
          .exec();

        //check the redis DB if there is an entry from the number

        if (!(await exists)) {
          console.log("number not in redis DB");
          //check if user exists already in the database

          //means in each conversation there is only 1 DB check meaning subsequent calls are faster

          let serialisedNumber, notifyName, number;
          serialisedNumber = await contact.id._serialized;
          notifyName = await contact.pushname;
          number = chatID.slice(0, 12);
          // console.log(notifyName, msgBody);

          // if contact is not already saved save to DB

          if (!user) {
            //check if the user is in the referals
            const referal = await ReferalsModel.findOne({
              targetSerialisedNumber: chatID,
            }).exec();

            //if it has been previously referred update to now User
            if (referal) {

              try {
                await referal.set({ isNowUser: true });
                await referal.save();
              } catch (err) {
                console.log(err);
              }
            }

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
              isFollower: false,
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
                `Hi ${notifyName},thank you for using AskMe, the AI powered virtual study assistant.\n\n*Please Read* As a free user you are limited to 1 request/message per 24 hour period.\n Subscribe here https://bit.ly/askME_AI_payment to upgrade to 25 messages per day and longer, more complete messages\n*How to use*\n1. *Simply* ask any question and wait for a response. For example you can ask "Explain the theory of relativity"or \n "Give me a step by step procedure of mounting an engine",if the response is incomplete you can just say "continue". Yes, you can chat to *AskMe* as you would to a human (*a super intelligent, all knowing human*) because *Askme* remembers topics that you talked about for the previous 30 minutes.\n\n What *Askme* cannot do\n1.Provide updates on current events (events after October 2021)\n2.Provide opinions on subjective things,\nWe hope you enjoy using the app. Please avoid making too many requests in short period of time, as this may slow down the app and cause your number to be blocked if warnings are not heeded. If your refer 3 people that eventually become users of AskME you fet additional usage priviledges simply send referal and their number e.g referal 263774111111,  Join our group to stay up to date https://chat.whatsapp.com/I5RNx9PsfYjE0NV3vNijk3 `
              );
            } catch (err) {
              client.sendMessage(me, "Save new user failed");
              console.log(err.errors);
            }
            await redisClient.hSet(chatID, {
              isBlocked: "0",
              isSubscribed: "0",
              isFollower: "1",
            }); //

            await redisClient.expire(chatID, expiryTime);
          }
          else {
            //user is saved in mongoDB
            if (chatID === !me) {
              await redisClient
                .set(`${chatID}shortTTL`, 1)
                .then(async (result) => {
                  console.log(`short ttl`, result);
                });
              await redisClient.expire(`${chatID}shortTTL`, 30);
            }
            console.log("not found in redis but ther in DB");

            //Check if blocked in mongoodb

            if (user.isBlocked) {
              await redisClient.hSet(chatID, {
                isBlocked: "1",

              });
              await redisClient.expire(chatID, expiryTime);
            } else {
              await redisClient.hSet(chatID, {
                isBlocked: "0",

              });
              await redisClient.expire(chatID, expiryTime);
            }
            //check in mongoDb if is Subscibed
            if (user.isSubscribed) {
              await redisClient.hSet(chatID, {
                isBlocked: "0",

                isSubscribed: "1",
              });
              await redisClient.expire(chatID, expiryTime);
            } else {
              await redisClient.hSet(chatID, {
                isBlocked: "0",

                isSubscribed: "0",
              });
              await redisClient.expire(chatID, expiryTime);
            }
            //check if is a follower
            if (user.isFollower) {
              await redisClient.hSet(chatID, {
                isFollower: "1",
              });
              await redisClient.expire(chatID, expiryTime);
            } else {
              await redisClient.hSet(chatID, {
                isFollower: "0",
              });
              await redisClient.expire(chatID, expiryTime);
            }
          }
          isSubscribed = await redisClient.hGet(chatID, "isSubscribed");
          isFollower = await redisClient.hGet(chatID, "isFollower");
          maxCalls = () => {
            let totalCalls;
            const base = 1;
            const subscriber = isSubscribed === "1" ? 25 : 0;
            const follower = isFollower === "1" ? 2 : 0;
            totalCalls = base + subscriber + follower;
            console.log(totalCalls);
            return totalCalls;
          };
          const maxCallsAllowed = maxCalls();
          await redisClient.hSet(chatID, "calls", maxCallsAllowed)
        }
        const minCallsAllowed = 0
        //else if the user is already logged IN redis memory cache

        //  the  shortTTL represents the number of calls in previos 30 secons
        //check if short term TTL
        const isBlocked = await redisClient.hGet(chatID, "isBlocked");
        await redisClient
          .incrBy(`${chatID}shortTTL`, 1)
          .then(async (result) => { });
        await redisClient.expire(`${chatID}shortTTL`, 30);

        const shortTTL = await redisClient.get(`${chatID}shortTTL`);

        if (/referal|referral/.test(msgBody.slice(0, 8).toLowerCase().trim())) {
          const res = await saveReferal(msgBody, chatID, client);
          msg.reply(res);
          return;
        }



        // console.log(`This is the max calls ${maxCallsAllowed}`);

        if (parseInt(shortTTL) > 2) {
          //if user has made  more than  2 block

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

        //check if there are ignoable message
        if (ignorePatterns.test(msgBody.toLowerCase())) {
          msg.reply(
            "*System message*\n Thank you for using AskMe. Do not send greeting messages or messages such as thank you or you are welcome etc... The will use up your quota"
          );
          return;
        }

        //check if it is not elevation message
        //Admin level tasks
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
          } else if (msgBody.startsWith("processFollower:")) {
            processFollower(msg, client, redisClient);
            return;
          }
        }
        // process referalls

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

        const calls = await redisClient.hGet(chatID, "calls");

        if (msgBody.startsWith("createImage")) {
          if (isSubscribed === "0") {
            msg.reply("Sorry this service is only available for subscribed users, please subscribe by clicking here https://bit.ly/AskMeSub and processing your payment of only $6000 ecocash , or contact us on 0775231426 to make other arrangements")
            return
          }
          const callsNeedForImageGen = 12
          if ((await redisClient.hGet(chatID, calls)) < callsNeedForImageGen) {
            msg.reply(
              "Sorry you do not have enough calls remaing today to make this request. Image generation requires 10 or more remain calls per day"
            );
          } else {
            msg.reply(
              "Please wait while your image is being processed, This may take several minutes, please do not send any other message before it finishes. Image generation is equivalent to 15 messages on your quota"
            );
          }
          const response = await generateImage(msgBody, chatID, redisClient);
          console.log(response);
          if (response.startsWith("Error")) {
            msg.reply(response);
            return;
          } else {
            const media = await MessageMedia.fromUrl(response)
            client.sendMessage(
              chatID,
              media, { caption: "Generated by Askme_AI" }
            )
          }
          return;
        }

        // check if blocked   const isBlocked = await redisClient.hGet(chatID, "isBlocked");
        //subtract 1 usage call
        await redisClient.HINCRBY(chatID, "calls", -1);
        console.log("remaining calls=" + await redisClient.hGet(chatID, "calls"))
        if (isBlocked === "1") {

          if (calls < - 3) {
            msg.reply(
              "*Warning , do not send any further messages else you will be blocked from using the platform for at least 48 hours* \nYou have used up your quota. Subscribe here https://bit.ly/AskMeSub to get standard user privileges or Try again tommorow! "
            );
          }
          if (calls < - 5) {
            return;
          }
          if (calls < - 6) {
            msg.reply(
              "You have now been *blocked* for abusing the system and will not be able to use the platform for the next 48 hours, Further messages will result in permanent blocking "
            );
            redisClient.expire(chatID, 172800);
            user.warnings += 3;
            try {
              user.save();
            } catch (err) {
              console.log(err);
            }
          }

          return;
        }

        if (chatID === "263775231426@c.us") {
          //check if admin and set admin level limits
          tokenLimit = 2048;
        } else if (isSubscribed === "1") {
          if (calls > minCallsAllowed) {
            console.log("and is subscribed so set limit to 500");
            //set token limits based on subscription
            tokenLimit = 300;
          } else {
            msg.reply(
              "*Do not reply*You have exceeded your quota.Your subscription has a total of 25 requests per day. "
            );
            return;
          }
        } else if (isSubscribed === "0") {
          console.log("user not subbed");
          if (calls > minCallsAllowed) {
            console.log(calls);
            console.log("is under the quota");
          } else if (calls < minCallsAllowed) {
            msg.reply(
              `*Choose from our flexible *Pay As You Use* (click here https://bit.ly/Askme-Payu ) option for just $500 Ecocash, giving you 55 message requests valid for 3 days. Or opt for the incredible value of our *monthly subscription* (click here https://bit.ly/AskMe_Monthly) at only $6000 ecocash, providing up to 25 daily requests over a span of 30 days.`
            );
            redisClient.del(`${chatID}messages`, "messages");
            await redisClient.hSet(chatID, "isBlocked", "1");
            return;
          }
        }
        // if user is subscribed
        else {
          msg.reply("sorry system was unable to complete your request");
          return;
        }

        if (msgBody.length > 300 && !isSubscribed == "1") {
          msg.reply(
            "Your message is too long. Upgrade to subscription service if you want longer scope and higher quotas. You can break it down into smaller bits or summarise. "
          );
          return;
        }
        if (/continue/gi.test(msgBody)) {
          if (await redisClient.exists(`${chatID}messages`)) {
            msg.reply(
              `Sorry , there is no history to continue from, Messages are only kept in the system for 5 minutes,After that you canoot use the *continue* keyword`
            );
            redisClient.HINCRBY(chatID, "calls", +1);
            return;
          }
        }
        //check if there is messages

        //make opena API cal
        const openAiCall = require("./openai");

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
          redisClient.HINCRBY(chatID, "calls", +1);
          msg.reply(response);
          return;
        } else {
          if (chatID == "263775231426@c.us" || isSubscribed == "1") {
            msg.reply(response);
          } else {
            msg.reply(
              `*${randomAdvert()}*\n\n${response}\n \n*AskMe_AI a VentaAI production*\nCall us on 0775231426 (for enquiries only) for Website and software development*`
            );
          }
        }
      }
    });
  }
  //run when group is left
};

module.exports = clientOn;
