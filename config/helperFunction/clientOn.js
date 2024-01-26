const saveNewUser = require('./saveNewUser');
//const totalUsage = await totalUsageModel.findOne({}).exec();
const isFlagged = require('./isFlagged');
const docxCreator = require('./docxCreator');
const messages = require('../../constants/messages');
const topupHandler = require('./topupHandler');
const Utils = require('../../Utils/index');
const googleAi = require('./googleAi');
const randomUsageTip = require('./randomUsageTip');
const generateImage = require('./generateImage');
const redisClient = require('../redisConfig');
const ignorePatterns =
  /^(ok(ay)?|thank(s| you)?|ouky|thanx|it'?s? ok(ay)?\.? thank(s| you)? so much|hey|h(i|ey|ello)|good (night|evening|morning|day)|noted|welcome|(yo)?u'?re welcome|k(ay)?|night)\W*$/gi;
//helper Functions

const isSystemNotBusy = require('./isSystemNotBusy');
const manualProcessSub = require('./manualProcessSub');
const processFollower = require('./processFollower');
const { client, MessageMedia } = require('../wwebJsConfig');
const processSub = require('./processSub');
const timeDelay = ms => new Promise(res => setTimeout(res, ms));
require('dotenv').config();
const clientOn = async arg1 => {
  const me = process.env.ME;
  const usersModel = require('../../models/individualUsers');

  if (arg1 == 'message') {
    try {
      client.on(`message`, async msg => {
        const chat = await msg.getChat();
        const contact = await msg.getContact();
        const msgBody = msg.body;
        const chatID = msg.from;

        //only use on direct messages

        if (!msg.isStatus && msg.type == 'chat' && !chat.isGroup) {
          console.log(chatID);
          /* if (chat.isGroup) {
             if (chatID == '263772855269-1445013360@g.us') {
              console.log('message found');
              if (msgBody.startsWith('askme:')) {
                console.log('is group');
                let prompt = await msgBody.replace(/askme:/gi, '');
                console.log(msg.getInfo());
                const googleResponse = await googleAi(prompt);
                msg.reply(googleResponse);
                return;
              }
            } else {
              console.log('group message');
              return;
            } 
          } */
          const elevate = require('./elevate');
          const expiryTime = Utils.getSecsToMidnight();
          const user = await usersModel.findOne({ serialisedNumber: chatID });
          let tokenLimit = 120;
          let maxCalls = 1;
          let isSubscribed, isFollower;
          let prompt = await msgBody.replace(/openAi:|createDoc/gi, '');
          const maxDelayTimeInSecs = 9;
          const minDelayTimeInSecs = 3;
          const delayTime =
            (Math.random() * (maxDelayTimeInSecs - minDelayTimeInSecs) +
              minDelayTimeInSecs) *
            1000;
          const tokenUser = await tokenUsersModel.findOne({ userId: chatID });
          console.log(delayTime);
          // if user is not already in Redis
          const exists = await redisClient.exists(chatID);
          const isInTopupMode = await redisClient.exists(`${chatID}topup`);
          const isInAdminMode = await redisClient.exists('admin');

          await Utils.timeDelay(delayTime);
          if (isInTopupMode) {
            await topupHandler(msgBody, chatID);
            return;
          }
          if (isInAdminMode) {
            await processSub(msg);
            return;
          }

          //check the redis DB if there is an entry from the number
          if (!exists) {
            //check if user exists already in the database
            //means in each conversation there is only 1 DB check meaning subsequent calls are faster
            let notifyName, number;
            serialisedNumber = contact.id._serialized;
            notifyName = contact.pushname;
            number = chatID.slice(0, 12);
            // if contact is not already saved save to DB
            if (!user) {
              //check if the user is in the referals
              const saved = await saveNewUser(chatID, notifyName, number);
              if (saved) {
                await client.sendMessage(
                  chatID,
                  `Hi ${notifyName} \n\n` + messages.WELCOME_MESSAGE
                );
              } else if (!saved) {
                client.sendMessage(me, 'Save new user failed');
                return;
              } //save them to DB
            } else {
              // const greeting = greetByTime(notifyName);
              if (!user) {
                await saveNewUser(chatID, notifyName, number);
              }
              msg.reply(`${greeting}\n\n ${randomUsageTip()}`);

              if (chatID === !me) {
                await redisClient.set(`${chatID}shortTTL`, 1);
                await redisClient.expire(`${chatID}shortTTL`, 30);
              }
              if (tokenUser) {
                const tokensAvailableToUser = await tokenUser.availableTokens;
                console.log('is token user');
                await redisClient.hSet(chatID, {
                  isBlocked: '0',
                  isSubscribed: '0',
                  isTokenUser: '1',
                  calls: 1,
                  availableTokens: tokensAvailableToUser,
                });
                client.sendMessage(
                  chatID,
                  `You have ${tokensAvailableToUser} tokens remaining. To check remaining tokens simply send the word *balance*`
                );
              } else {
                console.log('token user not found found');
              }
              if (user.isBlocked) {
                await redisClient.hSet(chatID, {
                  isBlocked: '1',
                });
              } else {
                await redisClient.hSet(chatID, {
                  isBlocked: '0',
                });
              }

              //check in mongoDb if is Subscibed
              if (!user.isSubscribed && user.callsThisMonth > 3 && !tokenUser) {
                client.sendMessage(chatID, messages.TOP_UP_MESSAGE);
                await redisClient.hSet(chatID, {
                  isBlocked: '1',
                  isSubscribed: '0',
                  calls: 0,
                });
                return;
              }
              if (user.isSubscribed) {
                await redisClient.hSet(chatID, {
                  isBlocked: '0',
                  isSubscribed: '1',
                  isTokenUser: '0',
                });
              } else {
                await redisClient.hSet(chatID, {
                  isBlocked: '0',
                  isSubscribed: '0',
                });
              }
              //check if is a follower
              if (user.isFollower) {
                await redisClient.hSet(chatID, {
                  isFollower: '1',
                });
              } else {
                await redisClient.hSet(chatID, {
                  isFollower: '0',
                });
              }
              await redisClient.expire(chatID, expiryTime);
            }
            // user is already in redis cache
            isSubscribed = await redisClient.hGet(chatID, 'isSubscribed');
            isFollower = await redisClient.hGet(chatID, 'isFollower');
            maxCalls = () => {
              let totalCalls;
              const base = 1;
              const subscriber = isSubscribed === '1' ? 25 : 0;
              const follower = isFollower === '1' ? 1 : 0;
              totalCalls = base + subscriber + follower;
              return tokenUser ? 1 : totalCalls;
            };
            const maxCallsAllowed = maxCalls();
            await redisClient.hSet(chatID, 'calls', maxCallsAllowed);
            // await redisClient.hSet(chatID, 'availableTokens', maxCallsAllowed * tokenLimit)
          }
          //admin now sorted
          const minAvailableCallsAllowed = 0;
          isSubscribed = await redisClient.hGet(chatID, 'isSubscribed');
          const availableTokens = parseInt(
            await redisClient.hGet(chatID, 'availableTokens')
          );
          const isBlocked = await redisClient.hGet(chatID, 'isBlocked');
          const isTokenUser = await redisClient.hGet(chatID, 'isTokenUser');
          await redisClient
            .incrBy(`${chatID}shortTTL`, 1)
            .then(async result => {});
          await redisClient.expire(`${chatID}shortTTL`, 30);

          if (
            msgBody.toLowerCase().startsWith('topup') ||
            msgBody.toLowerCase().startsWith('*topup') ||
            msgBody.toLowerCase().includes('topup payu') ||
            msgBody.toLowerCase().includes('top-up payu') ||
            topupRegex.test(msgBody.replace(' ', ''))
          ) {
            console.log('topup');
            await redisClient.hSet(`${chatID}topup`, 'field', 'product');
            await redisClient.expire(`${chatID}topup`, 180);
            await msg.reply(messages.TOPUP_PRODUCT);
            return;
          }
          //Check if system is not going over API limits
          if (!isSystemNotBusy(msg)) {
            return;
          }
          if (/^balance$/i.test(msgBody)) {
            if (isTokenUser == '1') {
              msg.reply(
                `You have ${availableTokens} tokens remaining.\n\nTo add more tokens please send the word *topup*`
              );
              return;
            } else {
              msg.reply(
                `This feature is only available for users with a token subscription`
              );
              return;
            }
          }
          const shortTTL = await redisClient.get(`${chatID}shortTTL`);
          // process retopup

          if (parseInt(shortTTL) > 2) {
            //if user has made  more than  2 block
            client.sendMessage(chatID, messages.TOO_MANY_REQUESTS_TRY_LATER);
            await user.warnings++;
            try {
              user.save();
            } catch (err) {
              console.log(err);
            }
            return;
          }

          //check if there are ignoable message
          if (ignorePatterns.test(msgBody.toLowerCase())) {
            client.sendMessage(chatID, messages.DO_NOT_SEND_THANK_YOU);
            return;
          }
          if (/\bfeatures\b/gi.test(msgBody.slice(0, 6))) {
            client.sendMessage(chatID, messages.USE_THESE_KEY_WORDS);
            return;
          }
          //check if it is not elevation message
          //Admin level tasks
          if (
            chatID == process.env.ME ||
            chatID == process.env.PRECISE ||
            chatID == process.env.TADIEWASHE
          ) {
            if (await elevate(msg, client, redisClient)) {
              return;
            } else if (msgBody.startsWith('broadcast:')) {
              // for sending Broadcast messages
              const broadcast = msgBody.replace(/broadcast:/gi, '');
              const users = await usersModel.find().exec();
              users.forEach(async user => {
                try {
                  client.sendMessage(user.serialisedNumber, broadcast);
                  await timeDelay(Utils.delayTime);
                } catch (err) {
                  console.log(err);
                }
              });

              return;
            } else if (msgBody.startsWith('processSub:')) {
              await redisClient.hSet('admin', 'subField', 'number');
              await redisClient.expire('admin', '60');
              msg.reply('What is the number you want to process');
              return;
            } else if (msgBody.startsWith('processPayu:')) {
              manualProcessSub(msg, 'payu');
              return;
            } else if (msgBody.startsWith('processFollower:')) {
              processFollower(msg, client, redisClient);
              return;
            }
          }
          // create docs

          if (
            /^creat(e)?\s*doc(ument)?\s*$/gi.test(
              msgBody.trim().replace(' ', '').toLowerCase().slice(0, 9)
            )
          ) {
            const timestamp = msg.timestamp;
            const messagesExists = await redisClient.exists(
              `${chatID}messages`
            );
            let targetMessage;
            if (msg.hasQuotedMsg) {
              const message = await msg.getQuotedMessage();
              targetMessage = message.body;
            } else if (messagesExists) {
              const messages = await JSON.parse(
                await redisClient.hGet(`${chatID}messages`, 'messages')
              );
              const index = messages.length - 1;
              targetMessage = await messages[index].content;
            } else {
              msg.reply(messages.ERROR_NO_QUOTED_MESSAGES_FOUND);
              return;
            }
            client.sendMessage(
              chatID,
              messages.BE_PATIENT_WHILE_SYSTEM_GENERATES_DOC
            );
            const pathRet = await docxCreator(targetMessage, chatID, timestamp);
            client.sendMessage(chatID, MessageMedia.fromFilePath(pathRet));
            return;
          }
          //Check if melissage has media
          if (msg.hasMedia) {
            client.sendMessage(chatID, messages.NO_MEDIA_REQUEST_SEND_TEXT);
            return;
          }

          if (isFlagged(msgBody)) {
            client.sendMessage(chatID, messages.MESSAGE_FLAGGED);
            client.sendMessage(
              me,
              `review msg from ${chatID.slice(0, 12)} ${msgBody} flagged `
            );
            return;
          }
          const calls = await redisClient.hGet(chatID, 'calls');

          if (msgBody.startsWith('createImage')) {
            if (isSubscribed === '0' || isTokenUser == '0') {
              client.sendMessage(
                chatID,
                messages.ONLY_AVAILABLE_FOR_SUBSCRIBED
              );
              return;
            }
            const callsNeedForImageGen = 12;
            if (
              (await redisClient.hGet(chatID, calls)) < callsNeedForImageGen &&
              !chatID == me
            ) {
              client.sendMessage(
                chatID,
                messages.NOT_ENOUGH_CALLS_TO_PROCESS_IMAGE
              );
              return;
            } else {
              client.sendMessage(
                chatID,
                messages.WAIT_WHILE_MESSAGE_IS_BEING_PROCESSED
              );
            }
            const response = await generateImage(msgBody, chatID, redisClient);

            if (response.startsWith('Error')) {
              client.sendMessage(chatID, response);
              return;
            } else {
              const media = await MessageMedia.fromUrl(response);
              client.sendMessage(chatID, media, {
                caption: messages.GENERATED_BY_ASKME_AI,
              });
            }
            return;
          }

          // check if blocked   const isBlocked = await redisClient.hGet(chatID, "isBlocked");
          //subtract 1 usage call
          await redisClient.HINCRBY(chatID, 'calls', -1);
          console.log(
            'remaining calls for' +
              chatID +
              (await redisClient.hGet(chatID, 'calls'))
          );
          if (isBlocked === '1') {
            if (calls < -3) {
              client.sendMessage(
                chatID,
                messages.WARNING_DO_NOT_SEND_ANY_MORE_MESSAGES
              );
            }
            if (calls < -5) {
              return;
            }
            if (calls < -6) {
              await client.sendMessage(chatID, messages.BLOCKED_MESSAGE);
              await contact.pushname;
              contact.block().then(result => {
                console.log(result);
                client.sendMessage(admin, messages.USER_BANNED + ` ${chatID}`);
              });

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

          /* if (chatID === '263775231426@c.us') {
            //check if admin and set admin level limits
            tokenLimit = 2048;
          } */
          // Subscribed users
          if (isSubscribed == '1') {
            if (calls >= minAvailableCallsAllowed) {
              //set token limits based on subscription
              tokenLimit = 600;
            } else {
              client.sendMessage(chatID, messages.SUBSCRIPTION_QUOTA_EXCEDED);
              return;
            }
          }
          //free users
          else if (isSubscribed == '0') {
            if (calls < 1) {
              client.sendMessage(chatID, messages.FREE_QUOTA_EXCEDED);
              redisClient.del(`${chatID}messages`, 'messages');
              await redisClient.hSet(chatID, 'isBlocked', '1');
              return;
            }
          }
          // if user is subscribed
          else {
            client.sendMessage(chatID, messages.UNABLE_TO_PROCESS_REQUEST);
            return;
          }

          if (msgBody.length > 300 && !isSubscribed == '1') {
            client.sendMessage(chatID, messages.MESSAGE_TOO_LONG);
            return;
          }
          //check if there is messages

          //make opena API cal
          const openAiCall = require('./openai');

          const response = await openAiCall(chatID, tokenLimit, prompt);
          if (
            response == messages.UNABLE_TO_PROCESS_REQUEST ||
            response == messages.NO_CONTEXT_TO_CONTINUE
          ) {
            redisClient.HINCRBY(chatID, 'calls', +1);
            //client.sendMessage(chatID,response);
            client.sendMessage(chatID, response);
            return;
          } else {
            if (chatID == '263775231426@c.us' || isSubscribed == '1') {
              msg.reply(response);
            } else {
              msg.reply(`${messages.REPLY_WITH_TOPUP}\n\n${response}`);
            }
          }
        }
      });
    } catch (err) {
      console.log(err);
      process.exit(1);
    }
  }
};
module.exports = clientOn;
