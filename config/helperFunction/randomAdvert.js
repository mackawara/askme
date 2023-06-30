const adverts = [
  "Follow AskMe on tiktok to find cool ways of using AI to enhance you study.You have no excuse for failing https://www.tiktok.com/@askme_ai",
  "To download this as a word doc swipe this message to the right and reply with *createDoc*",
  "Help your friends discover AskMe share this link with them https://chat.whatsapp.com/I5RNx9PsfYjE0NV3vNijk3  ",
  "Join our group and get updates promotions and usage tips that will you get the most out of AskMe https://chat.whatsapp.com/I5RNx9PsfYjE0NV3vNijk3",
  "Remember AskMe is not only for questions, you can ask it to create a CV,set a test or write a letter or even a story",
  "Checkout our TikTok video on how to download word documents from AskMe so that you can print or save https://vm.tiktok.com/ZM25Htygr/ ",
  "To get higher daily quota Send *referal + your friend`s number* e.g \n *referal 263771111111*\n Once 3 of your friend joins AskMe and joins the group you will be inline to receive standard user priviledges ",
];
const randomAdvert = () => {
  const randomIndex = Math.floor(Math.random() * adverts.length);
  return adverts[randomIndex];
};
module.exports = randomAdvert;
