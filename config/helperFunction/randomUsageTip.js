const usageTip = [
 // "Reply with Topup payu (your ecocash number)eg\ntopup payu 0771234567",
"You dont have to copy and paste from AskMe_AI, you can create a word document that you can download and print or edit. For example you can prompt AskME to write an assignement for you, once the assignment is generated, send createDoc and a word document will be generated and sent to you.",
"If you want to practise for exams.Askme can help you create exam level questions. All you have to do is send a message such as *\"Can you create 10 practise questions for Zimsec O level Geography: Example questions :\n 1.Explain the formation of inselbergs (6 marks)\n2. Describe 3 characteristics of deserts (3)\"*",
"Writing assingments has never been easier.You can send a prompt such as\n *\"Assignment:Discuss the popular teaching philosophies, Length 2000 words, use scholars and havard referencing to support the points.\"*\n\n If you are not happy with the output assignement you can ask to refine it e.g \"can you remove the secind paragraph\" ",
"Askme_AI has creative writing abilities, all you have to do to generate a comprehension story (or composition) is to give the topic and story outline. You can also define a writing style\n Example : Write a story about an incident at school that left everyone shell shocked. Lenght of the story should be 600 words. Write in a sarcastic tone that uses overly exaggerated overtones",
"Automated Grading Systems: AskME_AI can mark or grade your written work. For example if you have an assignment question and a sample answer you can get ask AskMe_AI to grade your answers and provide guidance"

  //`https://bit.ly/Askme-Payu *Pay as You Use:*,buy *55 message requests* for only $500 ecocash here`,
  /*  "Follow AskMe on tiktok to find cool ways of using AI to enhance you study.You have no excuse for failing https://www.tiktok.com/@askme_ai",
  "To download this as a word doc swipe this message to the right and reply with createDoc",
  "Help your friends discover AskMe share this link with them https://chat.whatsapp.com/I5RNx9PsfYjE0NV3vNijk3*",
  "Join our group and get updates promotions and usage tips that will you get the most out of AskMe https://chat.whatsapp.com/I5RNx9PsfYjE0NV3vNijk3",
  "Remember AskMe is not only for questions, you can ask it to create a CV,set a test or write a letter or even a story",
  "Checkout our TikTok video on how to download word documents from AskMe so that you can print or save https://vm.tiktok.com/ZM25Htygr/ ",
  "To get higher daily quota Send *referal + your friend`s number* e.g \n *referal 263771111111*\n Once 3 of your friend joins AskMe and joins the group you will be inline to receive standard user priviledges ",  */
];
const randomUsageTips = () => {
  console.log("random usage tip called")
  const randomIndex = Math.floor(Math.random() * usageTip.length);
  return "*Usage tip* \n"+ usageTip[randomIndex];
};
module.exports = randomUsageTips;
