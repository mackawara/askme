function toTime(UNIX_timestamp) {
  const a = new Date(UNIX_timestamp * 1000);
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const year = a.getFullYear();
  const month = months[a.getMonth()];
  const date = a.getDate();
  const hour = a.getHours();
  const min = a.getMinutes();
  const sec = a.getSeconds();
  const time =
    date + " " + month + " " + year + " " + hour + ":" + min + ":" + sec;
  return time;
}

function keywordAlert(keywordsArray, client, messageObject, contact) {
  this.keywordsArray = keywordsArray;
  //  this.messageResponse = messageResponse
  this.client = client;
  this.messageObject = messageObject;

  this.processResponse = async (munhu) => {
    //  const messageFrom = messageObject.author.replace(`263`, `0`);
    //console.log(messageFrom)
    let chat = await messageObject.getChat();
    let contact = await messageObject.getContact();
    console.log(contact);
    client.sendMessage(
      munhu,
      `Time : ${toTime(
        messageObject.timestamp
      )}\n Message From : *${contact}* \n Group:${chat.name} , \n Message : *_${
        messageObject.body
      }_* 
         `
    );
  };
  this.keywordRun = async function (message) {
    for (let index = 0; index < keywordsArray.length; index++) {
      const keyword = keywordsArray[index];

      if (message.includes(keyword)) {
        console.log(`message received  with keyword: ${keyword}`);
        this.processResponse(contact);
        break;
      }
    }
  };
  //};
}

module.exports = keywordAlert;
