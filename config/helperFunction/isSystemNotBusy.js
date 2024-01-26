const redisClient = require('../redisConfig');
const isSystemNotBusy = async msg => {
  await redisClient.incrBy(`callsThis30secCycle`, 1).then(async result => {
    await redisClient.expire('callsThis30secCycle', 30).then(async result => {
      console.log(result);
      if ((await redisClient.get('callsThis30secCycle')) > 5) {
        //  delay execution by 10 seconds
        msg.reply(
          '*Error!!* System busy ,please try again in a few minute\n *Do not reply to this message* as this will count towards your daily quota and will delay your ability to use the system'
        );
        return false;
      } else return true;
    });
  });
};

module.exports = isSystemNotBusy;
