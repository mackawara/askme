const contactsModel = require("../../models/contactsModel");
const queryAndSave = require("./queryAndSave");
const isFlagged = require("./isFlagged");
const docxCreator = require("./docxCreator");
const path = require("path");

const chats = require("../../chats");

let messages = [];
const timeDelay = (ms) => new Promise((res) => setTimeout(res, ms));
const clientOn = async (client, arg1, arg2, MessageMedia) => {
  const fs = require("fs/promises");
  const me = process.env.ME;
  const contactsModel = require("../../models/contactsModel");
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
      console.log(arg1, arg2, MessageMedia);
      // const message=await

      // console.log(chat);
      const msgBody = msg.body;
      //only use on direct messages

      if (!chat.isGroup && !msg.isStatus) {
        // check if message has any flagged word
        if (isFlagged(msgBody)) {
          //if flaged reply with warning
          msg.reply(
            "System has detected flagged keywords which are deemed inappropriate for this platform \nIf you feel this message has been wrongly flagged kindly send a query to our team on 0775231426"
          );
          //send to adminstrator
          client.sendMessage(
            "263775231426@c.us",
            `This user ${contact.number} has been flagged for this message \n ${msgBody}`
          );
          return;
        }
        const openAiCall = require("./openai");
        let prompt = await msgBody.replace(/openAi:|createDoc/gi, "");
        console.log(prompt);
        const chatID = msg.from;
        //for tracking messages, check if there is an existing call log for the chat ID
        if (!chats[chatID]) {
          console.log("no previous found");
          //if not in chat logs check if they are in DB
          const contacts = await contactsModel
            .find({ serialisedNumber: chatID })
            .exec();
          //means in each conversation there is only 1 DB check meaning subsequent calls are faster

          let serialisedNumber, notifyName, number;
          serialisedNumber = contact.id._serialized;
          notifyName = contact.pushname;
          number = contact.number;
          // if contact is not already saved save to DB
          if (contacts.length < 1) {
            const newContact = new contactsModel({
              date: new Date().toISOString().slice(0, 10),
              isBlocked: false,
              number: number,
              notifyName: notifyName,
              serialisedNumber: serialisedNumber,
              isSubscribed: false,
              tokens: 0,
              warnings: 0,
              calls: 0,
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
          // else check if already blocked
          else if (contacts[0].isBlocked) {
            //contact.block();
          }
          //then add to the chat logs
          Object.assign(chats, {
            [chatID]: {
              messages: [{ role: "user", content: prompt }],
              calls: 0,
            },
          });
          console.log(chats);
        } else {
          //
          console.log("found existing chat");
          chats[chatID].messages.push({ role: "user", content: prompt });
          chats[chatID]["calls"]++;
        }

        // check if the user has exceeded the rate limit imposed in users and execute
        if (chats[chatID]["calls"] < 2) {
          let response = await openAiCall(prompt, chatID, client);
          if (!msg.hasMedia) {
            // system is yet unable to read images so check if message has media
            if (msgBody.startsWith("createDoc") && msg.hasQuotedMsg) {
              const message = await msg.getQuotedMessage();
              const qtdMsgBody = message.body;
              const timestamp = message.timestamp;
              console.log(qtdMsgBody);
              console.log(timestamp);
              msg.reply(
                "Please be patient while system generates your docx file"
              );
              const pathRet = await docxCreator(qtdMsgBody, chatID, timestamp);

              client.sendMessage(chatID, MessageMedia.fromFilePath(pathRet));
            } else {
              if (
                response ==
                "*Error!* too many requests made , please try later. You cannot make mutiple requests at the same time"
              ) {
                client.sendMessage(
                  `263775231426@c.us`,
                  `contact ${chatID} has been blocked for infractions`
                );
                msg.reply(response); //Alert the use of too many messages
              } else {
                msg.reply(response);
              }
            }
            // response = response[0].text;

            //   const signOff = `\n\n\n*Thank you ${notifyName}* for using this *trial version* brought to you buy Venta Tech. In this improved version you can chat to our Ai as you would to a person. Send all feedback/suggestions to 0775231426`;
          } else {
            msg.reply(
              "Our apologies, current version is not yet able to process media such as images and audio, please make a textual request"
            );
            return;
          }
        } else {
          console.log("the number of calls made " + chats[chatID]["calls"]);
          //if contact exceeds 10 warnings block them
          contact.warnings = contact.warnings + 1;
          if (contact.warnings > 10) {
            contact.isBlocked = true;
            try {
              contact.save();
            } catch (error) {
              console.log(error);
            }
          }
          return "*Error!* too many requests made , please try later. You cannot make multiple requests (more than 2 per minute) at the same time";
        }
      }
    });
  }
  //run when group is left
};

module.exports = clientOn;
