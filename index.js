require('dotenv').config();
const connectDB = require('./config/database');
const indvUsers = require('./models/individualUsers');
const totalUsage = require('./models/totalUsage');
const { client } = require('./config/wwebJsConfig');
const qrcode = require('qrcode-terminal');
const redisClient = require('./config/redisConfig');
const messages = require('./constants/messages');
const Utils = require('./Utils/index');

// connect to mongodb before running anything on the app
connectDB().then(async () => {
  await redisClient.connect();
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
    console.log('Client is ready!');
    client.sendMessage(process.env.ME, 'Deployed successfully Askme');
    clientOn('message');
    //functions abd resources
    //Helper Functions

    client.on('call', async call => {
      call.reject();
      client.sendMessage(
        call.from,
        '*System message*:\n This number does not take calls, Please refrain from calling.*Each attempt at calling counts as 2 requests*'
      );
    });
    const cron = require('node-cron');

    cron.schedule(` 5 2 * * * `, async () => {
      // expireSubs after 1 mmonth
      const maxDelayTimeInSecs = 9;
      const minDelayTimeInSecs = 3;
      const delayTime =
        (Math.random() * (maxDelayTimeInSecs - minDelayTimeInSecs) +
          minDelayTimeInSecs) *
        1000;
      const subscribed = await indvUsers.find({ isSubscribed: true });
      (await subscribed).forEach(async subscriber => {
        await subscriber.calculateSubTTL();

        const ttL = await subscriber.subTTL;
        const serialisedNumber = await subscriber.serialisedNumber;

        if (ttL < 0) {
          subscriber.set({ isSubscribed: false });
          try {
            subscriber.save();
          } catch (err) {
            console.log(err);
          } /* /* 
          client.sendMessage(
            serialisedNumber,
            `Hi ${subscriber.notifyName}, ` + messages.SUBSCRIPTION_EXPIRED 
          ); 
        } else if (ttL < 2) {
          client.sendMessage(
            serialisedNumber,
            `Hi ${subscriber.notifyName}` + messages.SUBSCRIPTION_EXPIRING_SOON
          );
        } /* else if (ttL % 7 == 0) {
          //
          client.sendMessage(
            serialisedNumber,
            `Hey there, ${subscriber.notifyName}!` +
              `Rise and shine to a world of knowledge with AskMe - AI.You've got ${ttL} days left on your standard subscription, giving you 25 chances to expand your mind through the power of AI education.Let's make every request count!`
          );*/
        }
        Utils.timeDelay(delayTime);
      });

      //creset calls this month every start of the month
      cron.schedule('0 0 1 * *', () => {
        totalUsage.updateOne({}, { $set: { callsThisMonth: 0 } });
        indvUsers.updateMany({}, { $set: { callsThisMonth: 0 } });
        tot;
      });

      cron.schedule(`42 17 * * 7`, async () => {
        const allChats = await client.getChats();
        allChats.forEach(chat => chat.clearMessages());
      });
      await redisClient.setEx(`callsThis30secCycle`, 30, '0');

      //client events and functions
      //decalre variables that work with client here

      client.setDisplayName('AskMe, the all knowing assistant');
      client.on('disconnected', reason => {
        console.log('Client was logged out', reason);
      });
    });
  });
});
