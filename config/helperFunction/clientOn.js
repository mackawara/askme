const contactsModel = require("../../models/contactsModel");
const queryAndSave = require("./queryAndSave");
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
      // const message=await

      // console.log(chat);
      const msgBody = msg.body;
      //only use on direct messages
      if (!chat.isGroup && !msg.isStatus) {
        msgBody.split(" ").forEach(async (word) => {
          const keywords = {
            flags: ["porn", "xxx"],
          };

          if (keywords.flags.includes(word)) {
            console.log(msg);
            //do stuff
            msg.reply(
              `flagged words detected in your request please refrain from requesting adult content or cntent that promotes violence. If you believe you have been wrngly flagged please submit your text to us by prefixing you text with wrong flag`
            );
            return;
          }
        });
        const openAiCall = require("./openai");
        const prompt = await msgBody.replace(/openAi:/gi, "");

        const chatID = msg.from;
        const contacts = await contactsModel
          .find({ serialisedNumber: chatID })
          .exec();

        let serialisedNumber, notifyName, number;
        serialisedNumber = contact.id._serialized;
        notifyName = contact.pushname;
        number = contact.number;
        // if contact is not already saved
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
          await newContact.save();
          client.sendMessage(
            serialisedNumber,
            `Hi ${notifyName},thank you for using AskMe, the AI powered virtual assistant.\n*How to use*\n1. *Simply* ask any question and wait for a response. For example you can ask "Explain the theory of relativity"or \n "Give me a step by step procedure of mounting an engine",if the response is incomplete you can just say "continue". Yes, you can chat to *AskMe* as you would to a human (*a super intelligent, all knowing human*) because *Askme* remembers topics that you talked about for the previous 30 minutes.\n\n What *Askme* cannot do\n1.Provide updates on current events (events after October 2021)\n2.Provide opinions on subjective things,\nWe hope you enjoy using the app. Please avoid making too many requests in short period of time, as this may slow down the app and cause your number to be blocked if warnings are not heeded. Your feedback is valued , please send suggestions to 0775231426`
          );
        }
        // else check if already blocked
        else if (contacts[0].isBlocked) {
          contact.block();
        }

        let response = await openAiCall(prompt, chatID, client);
        // response = response[0].text;

        const signOff = `\n\n\n*Thank you ${notifyName}* for using this *trial version* brought to you buy Venta Tech. In this improved version you can chat to our Ai as you would to a person. Send all feedback/suggestions to 0775231426`;
        if (
          response ==
          "*Error!* too many requests made , please try later. You cannot make mutiple requests at the same time"
        ) {
          contact.block();
          //const offender=new

          client.sendMessage(
            `263775231426@c.us`,
            `contact ${chatID} has been blocked for infractions`
          );
          msg.reply(response); //Alert the use of too many messages
        } else {
          msg.reply(response);
        }

        // messages=[]
      }
    });
  }
  //run when group is left
};

module.exports = clientOn;
