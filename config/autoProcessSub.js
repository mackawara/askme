const indvUsers = require("../models/individualUsers");
const autoProcessSub = async (chatID, client, redisClient, product) => {
console.log("proceccing")
console.log(product)
    if (product == "monthly") {
        await indvUsers
            .updateOne(
                { serialisedNumber: chatID },
                { $set: { isSubscribed: true, isBlocked: false, subTTL: 31 } }
            )
            .then((result) => {
                console.log(result);
                redisClient.hSet(chatID, {
                    calls: 26,
                    isBlocked: "0",
                    isSubscribed: "1",
                });
                redisClient.expire(chatID, 86400);
                client.sendMessage(process.env.ME, `Automatic subscribtion alert !!\n${chatID}, is now subscribed`);
                client.sendMessage(
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

};

module.exports = autoProcessSub;
