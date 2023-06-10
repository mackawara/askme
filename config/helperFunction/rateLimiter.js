const chats = require("../../chats");
const rateLimiter = (chatID) => {
  if (!chats[chatID]) {
    //check if there is any chat with that ID
    console.log("no previous found");
    Object.assign(chats, {
      [chatID]: {
        messages: [{ role: "user", content: prompt }],
        calls: 0,
      },
    });
    console.log(chats);
  } else {
    console.log("found existing chat");
    chats[chatID].calls++;
    chats[chatID].messages.push({ role: "user", content: prompt });
  }

  setTimeout(() => {
    chats[chatID]["calls"] = 0;
  }, 15000); // reset the calls in local store
  setTimeout(() => {
    chats[chatID]["message"] = [];
  }, 180000);
  setTimeout(() => {
    delete chats[chatID];
  });
  let requestCount = 0;
  let resetTime = Date.now() + 60 * 1000;
};
