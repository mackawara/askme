const totalUsageModel = require("../../models/totalUsage");
const ReferalsModel = require("../../models/referals");

//const totalUsage = await totalUsageModel.findOne({}).exec();
const isFlagged = require("./isFlagged");
const docxCreator = require("./docxCreator");
const messages = require('../../constants/messages')

const randomAdvert = require("./randomAdvert");
const topupMessage = require('../../constants')
const generateImage = require("./generateImage");
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
    try {
      client.on(`message`, async (msg) => {
        const elevate = require("./elevate");
        const chat = await msg.getChat();
        const contact = await msg.getContact();
        const msgBody = msg.body;
        const chatID = msg.from;
        const expiryTime = getSecsToMidNight();

        let tokenLimit = 120;
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
                callsThisMonth: 0,
                timestamp: Date.now(),
              });
              try {
                await newContact.save();
                client.sendMessage(me, "New user added  " + chatID);
                client.sendMessage(
                  serialisedNumber,
                  `Hi ${notifyName},thank you for using AskMe, the AI powered virtual study assistant.\n\n*Please Read* As a free user you are limited to 5 free request/message per month (1 per day).\n . *Simply* ask any question and wait for a response. For example you can ask "Explain the theory of relativity". If the response is incomplete you can just say "continue". \n What *Askme* cannot do\n*Provide updates on current events (events after October 2021)*\n\n To subscribe send *Topup monthly (your ecocash number)* `
                );
              } catch (err) {
                client.sendMessage(me, "Save new user failed");
                console.log(err.errors);
              }
              await redisClient.hSet(chatID, {
                isBlocked: "0",
                isSubscribed: "0",
                isFollower: "1",
                calls: 3
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
              if (!user.isSubscribed && user.callsThisMonth > 5) {
                client.sendMessage(chatID, messages.TOP_UP_MESSAGE)
                await redisClient.hSet(chatID, {
                  isBlocked: "1",
                  isSubscribed: "0",
                  calls: 0,
                });
                return
              }
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
            // user is already in redis cache
            isSubscribed = await redisClient.hGet(chatID, "isSubscribed");
            isFollower = await redisClient.hGet(chatID, "isFollower");
            maxCalls = () => {
              let totalCalls;
              const base = 1;
              const subscriber = isSubscribed === "1" ? 25 : 0;
              const follower = isFollower === "1" ? 1 : 0;
              totalCalls = base + subscriber + follower;
              console.log(totalCalls);
              return totalCalls;
            };
            const maxCallsAllowed = maxCalls();
            await redisClient.hSet(chatID, "calls", maxCallsAllowed)
          }
          const minAvailableCallsAllowed = 0
          isSubscribed = await redisClient.hGet(chatID, "isSubscribed");

          const isBlocked = await redisClient.hGet(chatID, "isBlocked");
          await redisClient
            .incrBy(`${chatID}shortTTL`, 1)
            .then(async (result) => { });
          await redisClient.expire(`${chatID}shortTTL`, 30);

          const shortTTL = await redisClient.get(`${chatID}shortTTL`);
          // process retopup
          if (msgBody.toLowerCase().startsWith("topup") ||
            msgBody.toLowerCase().startsWith("*topup") ||
            msgBody.toLowerCase().includes("topup payu") ||
            msgBody.toLowerCase().includes("top-up payu")
          ) {
            const errorMessage = "*topup payu 0771234567* for `Pay As You Use` ($500 ecocash for 55 messages)\nOr topup monthly 0771234567 for monthly subscribtion (25 messages per day for 1 month)"
            try {
              const keywords = msgBody.split(" ")
              const product = keywords[1]
              const payingNumber = keywords[2]
              const isValidEconetNumber = /^(07[7-8])(\d{7})$/;

              if (!/\b(payu|month|monthly)\b/gi.test(product)) {
                client.sendMessage(chatID,
                  `Your topup could not be captured because you did not specify which *product* (between payu/monthly) please use format shown \n*${errorMessage} `)
                return
              }
              //check if supplied number is ok
              else if (!isValidEconetNumber.test(payingNumber)) {
                client.sendMessage(chatID, `The number you entered ${payingNumber} is not a valid Econet number\nplease use format shown \n${errorMessage}`)
                return
              }
              else {
                client.sendMessage(chatID, `You are subscribing for ${product} subscription. To complete the payment you will be asked to confirm payment by entering your PIN`);
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
                  client.sendMessage(chatID, "Sorry your topup was not processed successfully please try again. Use the format shown below\n" + errorMessage)
                  return
                }
              }
            } catch (err) {
              console.log(err); client.sendMessage(chatID, "Sorry , there was an error processing your request, If you want to top up your account please send message as shown " + errorMessage)
              return
            }
          }


          if (/referal|referral/.test(msgBody.slice(0, 8).toLowerCase().trim())) {
            const res = await saveReferal(msgBody, chatID, client);
            client.sendMessage(chatID, res);
            return;
          }
          // console.log(`This is the max calls ${maxCallsAllowed}`);

          if (parseInt(shortTTL) > 2) {
            //if user has made  more than  2 block

            client.sendMessage(chatID,
              messages.TOO_MANY_REQUESTS_TRY_LATER
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
            client.sendMessage(chatID,
              messages.DO_NOT_SEND_THANK_YOU
            );
            return;
          }
          if (/\bfeatures\b/.test(msgBody)) {
            client.sendMessage(chatID, messages.USE_THESE_KEY_WORDS)
          }
          //check if it is not elevation message
          //Admin level tasks
          if (chatID == process.env.ME || chatID == process.env.PRECISE || chatID == process.env.TADIEWASHE) {
            if (await elevate(msg, client, redisClient)) {
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

              client.sendMessage(chatID,

              );
              const pathRet = await docxCreator(qtdMsgBody, chatID, timestamp);

              client.sendMessage(chatID, MessageMedia.fromFilePath(pathRet));
              return;
            } else {
              client.sendMessage(chatID,
                messages.ERROR_NO_QUOTED_MESSAGES_FOUND
              );
            }
            return;
          }
          //Check if melissage has media
          if (msg.hasMedia) {
            client.sendMessage(chatID,
              messages.NO_MEDIA_REQUEST_SEND_TEXT
            );
            return;
          }

          //Check if system is not going over API limits
          if (!isSystemNotBusy(msg, redisClient)) {
            return;
          }


          if (isFlagged(msgBody)) {
            client.sendMessage(chatID,
              messages.MESSAGE_FLAGGED
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
              client.sendMessage(chatID, messages.ONLY_AVAILABLE_FOR_SUBSCRIBED)
              return
            }
            const callsNeedForImageGen = 12
            if ((await redisClient.hGet(chatID, calls)) < callsNeedForImageGen && !chatID == me) {
              client.sendMessage(chatID,
                messages.NOT_ENOUGH_CALLS_TO_PROCESS_IMAGE
              );
              return
            } else {
              client.sendMessage(chatID,
                messages.WAIT_WHILE_MESSAGE_IS_BEING_PROCESSED
              );
            }
            const response = await generateImage(msgBody, chatID, redisClient);

            if (response.startsWith("Error")) {
              client.sendMessage(chatID, response);
              return;
            } else {
              const media = await MessageMedia.fromUrl(response)
              client.sendMessage(
                chatID,
                media, { caption: messages.GENERATED_BY_ASKME_AI }
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
              client.sendMessage(chatID,
                messages.WARNING_DO_NOT_SEND_ANY_MORE_MESSAGES
              );
            }
            if (calls < - 5) {
              return;
            }
            if (calls < - 6) {
              client.sendMessage(chatID,
                messages.BLOCKED_MESSAGE
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
          // Subscribed users
          else if (isSubscribed == "1") {
            if (calls > minAvailableCallsAllowed) {
              //set token limits based on subscription
              tokenLimit = 300;
            } else {
              client.sendMessage(chatID,

              );
              return;
            }
          }
          //free users
          else if (isSubscribed == "0") {
            if (calls < 1) {
              client.sendMessage(chatID,
                topupMessage
              );
              redisClient.del(`${chatID}messages`, "messages");
              await redisClient.hSet(chatID, "isBlocked", "1");
              return;
            }
          }
          // if user is subscribed
          else {
            client.sendMessage(chatID, messages.UNABLE_TO_PROCESS_REQUEST)
            return;
          }

          if (msgBody.length > 300 && !isSubscribed == "1") {
            client.sendMessage(chatID,
              messages.MESSAGE_TOO_LONG
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
            messages.UNABLE_TO_PROCESS_REQUEST ||
            response ==
            messages.NO_CONTEXT_TO_CONTINUE
          ) {
            redisClient.HINCRBY(chatID, "calls", +1);
            //client.sendMessage(chatID,response);
            client.sendMessage(chatID, response)
            return;
          } else {
            if (chatID == "263775231426@c.us" || isSubscribed == "1") {
              client.sendMessage(chatID, response);
            } else {
              client.sendMessage(chatID, `${randomAdvert()}\n\n${response}`
              );
            }
          }

        }
      });
    } catch (err) { console.log(err); process.exit(1) }
    //run when group is left
  };
}
module.exports = clientOn;
