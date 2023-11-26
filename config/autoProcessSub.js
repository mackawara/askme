const indvUsers = require("../models/individualUsers");
const redisClient = require("./redisConfig")
const client=require("../config/wwebJsConfig");
const system = require("../constants/system");
const systemConstants=("../constants/system")
const autoProcessSub = async (chatID, product,amount) => {
    try {
        if (product == "monthly") {
            await indvUsers
                .updateOne(
                    { serialisedNumber: chatID },
                    { $set: { isSubscribed: true, isBlocked: false, subTTL: 31 } }
                )
                .then(async () => {

                    redisClient.hSet(chatID, {
                        calls: 26,
                        isBlocked: "0",
                        isSubscribed: "1",
                    });
                    await redisClient.expire(chatID, 86400);
                    await client.sendMessage(process.env.ME, `Automatic subscribtion alert !!\n${chatID}, is now subscribed`);
                    await client.sendMessage(
                        chatID,
                        `*Thank you for subscribing to AskMe_AI* \nYou now have increased quota of 25 requests per day,To find out which features are now available to you type reply with features" \n`
                    );
                });
        }
        else if (product == "payu") {
            redisClient.hSet(chatID, {
                calls: 55,
                isBlocked: "0",
                isSubscribed: "1",
            });
            redisClient.expire(chatID, 259200);
            client.sendMessage(process.env.ME, `Automatic subscribtion alert${chatID}, is now subscribed for ${product}`);
            client.sendMessage(
                chatID,
                `*Thank you for subscribing to AskMe_AI* \nYou now have purchased a quota of 55 expiring in 72 hours,To find out which features are now available to you type reply with *features*" \n`
            );

        }
        else if (product=='token'){
            const tokens = amount /system.tokenFactor*1000
            redisClient.hSet(chatID, {
                tokens: tokens,
                isBlocked: "0",
                isSubscribed: "1",
            });
            redisClient.expire(chatID, 172800);
            client.sendMessage(process.env.ME, `Automatic subscribtion alert${chatID}, is now subscribed for ${product}`);
            client.sendMessage(
                chatID,
                `*Thank you for buying token to AskMe_AI* \nYou now have purchased a tokens expiring in *48 hours*,To find out which features are now available to you type reply with *features*" \n`
            );
        }
    }
    catch (err) {
        console.log(err)
    }

};

module.exports = autoProcessSub;
