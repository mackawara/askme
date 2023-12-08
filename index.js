require('dotenv').config();
const connectDB = require('./config/database');
const indvUsers = require('./models/individualUsers');
const totalUsage = require('./models/totalUsage');
const addSecs = require('date-fns/addSeconds');
const autoProcessSub = require('./config/autoProcessSub');
//const setStatus = require("./config/helperFunction/setStatus")
const { client, MessageMedia } = require('./config/wwebJsConfig');
const qrcode = require('qrcode-terminal');
const tokenUsers = require('./models/tokenUsers');
//initialise redis
const redisClient = require('./config/redisConfig');
const messages = require('./constants/messages');
const format = require('date-fns/format');
// connect to mongodb before running anything on the app
connectDB().then(async () => {
  let callsPErday = 0;

  const deleteDuplicates = async () => {
    const duplicates = await indvUsers.aggregate([
      {
        $group: {
          _id: '$number',
          uniqueIds: { $addToSet: '$_id' },
          count: { $sum: 1 },
        },
      },
      {
        $match: {
          count: { $gt: 1 },
        },
      },
    ]);
    duplicates.forEach(doc => {
      doc.uniqueIds.shift();
      // delete the remaining using ther IDs
      try {
        indvUsers.deleteMany({ _id: { $in: doc.uniqueIds } }).then(result => {
          console.log(result);
        });
      } catch (err) {
        console.log(err);
      }
    });
  };
  // redis clent connections

  await redisClient.connect();
  // redisClient.flushDb().then(() => console.log("redis DB flushed"));
  //client2.initialize();
  client.initialize();

  //messaging client resources
  const clientOn = require('./config/helperFunction/clientOn');

  client.on('auth_failure', msg => {
    console.error('AUTHENTICATION FAILURE', msg);
  });
  client.on('authenticated', async session => {
    console.log(`client authenticated`);
  });

  client.on('qr', qr => {
    qrcode.generate(qr, { small: true });
    console.log(qr);
  });

  client.on('ready', async () => {
    const timeDelay = ms => new Promise(res => setTimeout(res, ms));
    console.log('Client is ready!');

    const cron = require('node-cron');
    cron.schedule(`25 0 * * * `, async () => {
      deleteDuplicates();

      // expireSubs after 1 mmonth
      const subscribed = await indvUsers.find({ isSubscribed: true });
      (await subscribed).forEach(async subscriber => {
        const ttL = await subscriber.subTTL;
        const serialisedNumber = await subscriber.serialisedNumber;
        console.log(ttL);
        if (ttL < 0) {
          subscriber.set({ isSubscribed: false });
          try {
            subscriber.save();
          } catch (err) {
            console.log(err);
          }
          client.sendMessage(
            serialisedNumber,
            `Hi ${subscriber.notifyName}, ` + messages.SUBSCRIPTION_EXPIRED
          );
        } else if (ttL < 2) {
          client.sendMessage(
            serialisedNumber,
            `Hi ${subscriber.notifyName}` + messages.SUBSCRIPTION_EXPIRING_SOON
          );
        } else if (ttL % 7 == 0) {
          //
          client.sendMessage(
            serialisedNumber,
            `Hey there, ${subscriber.notifyName}!` +
              `Rise and shine to a world of knowledge with AskMe - AI.You've got ${ttL} days left on your standard subscription, giving you 25 chances to expand your mind through the power of AI education.Let's make every request count!`
          );
        }
      });
      //set Status
      const randomStatus = require('./assets/statuses');
    });
    cron.schedule(`5 0 * * *`, async () => {
      const totalUsageValues = await totalUsage.findOne({});
      try {
        await totalUsageValues.calculateTokensPerCallAndSave();
        await totalUsageValues.calculateCallsPerDay();
        await totalUsageValues.calculateCostPerCall();
        await totalUsageValues.calculateCostPerDay();
      } catch (err) {
        console.log(err);
        client.sendMessage(process.env.ME, 'error updating DB metrics');
      }
      const individualUsers = await indvUsers.find({});
      individualUsers.forEach(async user => {
        try {
          await user.calculateTokensPerCallAndSave();
          await user.calculateCallsPerDay();
          await user.calculateCostPerDay();
          await user.calculateSubTTL();
        } catch (err) {
          console.log(err);
          client.sendMessage(process.env.ME, 'error updating DB metrics');
        }
      });
    });
    //creset calls this month every start of the month
    cron.schedule('0 0 1 * *', () => {
      totalUsage.updateOne({}, { $set: { callsThisMonth: 0 } });
      indvUsers.updateMany({}, { $set: { callsThisMonth: 0 } });
    });

    cron.schedule(`42 17 * * 7`, async () => {
      const allChats = await client.getChats();
      allChats.forEach(chat => chat.clearMessages());
    });
    await redisClient.setEx(`callsThis30secCycle`, 30, '0');
    clientOn('message');
    //client

    //Db models
    //decalre variables that work with client here
    client.setDisplayName('AskMe, the all knowing assistant');

    let calls = 0;
    const date = new Date();
    const yestdate = date.setDate(date.getDate() - 1);
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(yestdate).toISOString().slice(0, 10);

    //collect media adverts and send
    //const mediaModel = require("./models/media");

    client.on('disconnected', reason => {
      console.log('Client was logged out', reason);
    });
  });
});
