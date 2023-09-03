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
const manualProcessSub = require("./manualProcessSub");
const processFollower = require("./processFollower");
const processPayment = require("../paynow");
const autoProcessSub = require("../autoProcessSub");
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

      let tokenLimit = 100;
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

          //check if user exists already in the database

          //means in each conversation there is only 1 DB check meaning subsequent calls are faster

          let serialisedNumber, notifyName, number;
          serialisedNumber = await contact.id._serialized;
          notifyName = await contact.pushname;
          number = chatID.slice(0, 12);

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
                `Hi ${notifyName},thank you for using AskMe, the AI powered virtual study assistant.\n\n*Please Read* As a free user you are limited to 1 request/message per 24 hour period.\n . *Simply* ask any question and wait for a response. For example you can ask "Explain the theory of relativity". If the response is incomplete you can just say "continue". \n What *Askme* cannot do\n*Provide updates on current events (events after October 2021)*\n\n To subscribe send *Topup monthly (your ecocash number)* `
              );
            } catch (err) {
              client.sendMessage(me, "Save new user failed");
              console.log(err.errors);
            }
            await redisClient.hSet(chatID, {
              isBlocked: "0",
              isSubscribed: "0",
              isFollower: "1",
              calls: 8
            }); //

            await redisClient.expire(chatID, expiryTime);
          }
          else {
            //user is saved in mongoDB
            if (chatID === !me) {
              await redisClient
                .set(`${chatID}shortTTL`, 1)
              await redisClient.expire(`${chatID}shortTTL`, 30);
            }

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
            const follower = isFollower === "1" ? 3 : 0;
            totalCalls = base + subscriber + follower;
            console.log(totalCalls);
            return totalCalls;
          };
          const maxCallsAllowed = maxCalls();
          await redisClient.hSet(chatID, "calls", maxCallsAllowed)
        }
        const minCallsAllowed = 0
        isSubscribed = await redisClient.hGet(chatID, "isSubscribed");

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
        if (/\bfeatures\b/.test(msgBody)) {
          msg.reply("Use these keywords to access features avaiable to subscribed user\n*createDoc* to create and download word documents from Askme_ai\n*createImage* to create an image provide a description of what you would want,\n*syllabus* : to download a Zimsec syalbaus, supply the subject and the number\n*topup:* to subscribe or topup          ")
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
            manualProcessSub(msg, client, redisClient, "monthly");
            return;
          }
          else if (msgBody.startsWith("processPayu:")) {
            manualProcessSub(msg, client, redisClient, "payu");
            return;
          } else if (msgBody.startsWith("processFollower:")) {
            processFollower(msg, client, redisClient);
            return;
          }
        }
        // process retopup

        if (msgBody.toLowerCase().startsWith("topup")) {
          const errorMessage = "*topup payu 0771234567* for `Pay As You Use` ($500 ecocash for 55 messages)\nOr topup monthly 0771234567 for monthly subscribtion (25 messages per day for 1 month)"
          try {
            const keywords = msgBody.split(" ")
            const product = keywords[1]
            const payingNumber = keywords[2]
            const isValidEconetNumber = /^(07[7-8])(\d{7})$/;

            if (!/\b(payu|month|monthly)\b/gi.test(product)) {
              msg.reply(
                `Your topup could not be captured because you did not specify which *product* (between payu/monthly) please use format shown \n*${errorMessage} `)
              return
            }
            //check if supplied number is ok
            else if (!isValidEconetNumber.test(payingNumber)) {
              msg.reply(`The number you entered ${payingNumber} is not a valid Econet number\nplease use format shown \n${errorMessage}`)
              return
            }
            else {
              msg.reply(`You are subscribing for ${product} subscription. To complete the payment you will be asked to confirm payment by entering your PIN`);
              const result = await processPayment(product, payingNumber, msg)
              console.log("result= " + result)

              if (result) {

                if (product == "payu") {
                  await autoProcessSub(chatID, client, redisClient, "payu")

                  return

                }
                else if (product == "month" || product == "monthly") {
                  autoProcessSub(chatID, client, redisClient, "monthly")
                  return
                }
              }
              else {
                msg.reply("Sorry your topup was not processed successfully please try again. Use the format shown below\n" + errorMessage)
                return
              }


            }
          } catch (err) { console.log(err); msg.reply("Sorry , there was an error processing your request, If you want to top up your account please send message as shown " + errorMessage) }
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



        const calls = await redisClient.hGet(chatID, "calls");

        if (msgBody.startsWith("createImage")) {
          if (isSubscribed === "0") {
            msg.reply("Sorry this service is only available for subscribed users, please subscribe by clicking here and processing your payment of only $6000 ecocash , or contact us on 0775231426 to make other arrangements")
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
              "*Warning , do not send any further messages else you will be blocked from using the platform for at least 48 hours* \nYou have used up your quota. Subscribe to get standard user privileges or Try again tommorow! "
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
        }
        else if (isSubscribed == "1") {
          if (calls > minCallsAllowed) {

            //set token limits based on subscription
            tokenLimit = 350;
          } else {
            msg.reply(
              "*Do not reply*You have exceeded your quota.Your subscription has a total of 25 requests per day. "
            );
            return;
          }
        }
        else if (isSubscribed == "0") {
          if (!calls > minCallsAllowed) {
            msg.reply(
              ` To continue using AskMe_AI  reply with "Topup payu *your ecocash number*"  as in example below \n\n*topup payu 0775456789*.\n\n  $500 (Ecocash) gets 55 messages/requests.`
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
              `*${randomAdvert()}*\n\n${response}`
            );
          }
        }
      }
    });
  }
  //run when group is left
};

module.exports = clientOn;
