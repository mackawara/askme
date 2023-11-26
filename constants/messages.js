const SAVE_NEW_USER_FAILED = 'Save new user failed';
const CANNOT_CONTINUE_AFTER_FIVE_MINS =
  'Please note that messageHistory is only kept in the system for only 3 minutes after which you cant continue from previous conversations ';
const WELCOME_MESSAGE =
  'Thank you for using AskMe, the AI powered virtual study assistant.\n\n*Please Read* \n\nWith AskMe_AI you are able to create notes, revision questions, write essays, write assignements and even create songs, poems ,jokes etc.\n*How to use the app* \nSimply ask any question and wait for a response.\n\nKindly note that this is a paid service but as a new user you get some free requests/messages to test the app. If you find it useful please subscribe.\n\n To subscribe you can reply with the word "Topup".';
const TOPUP_ERROR_MESSAGE = 'To begin the topup process reply with "topup" ';
const TOO_MANY_REQUESTS_TRY_LATER = `*Error*, you have made too many requests within a short space of time, Wait at least 1 minute!!`;
const DO_NOT_SEND_THANK_YOU =
  '*System message*\n Thank you for using AskMe. Do not send greeting messages or messages such as thank you or you are welcome etc... They will use up your quota';
const USE_THESE_KEY_WORDS =
  'Use these keywords to access features avaiable to subscribed users\n*createDoc* to create and download word documents from Askme_Ai , Once AskMe_AI generates an answer you can create a word document by replying with the word createDoc. For it to work you \n*createImage* to create an image provide a description of what you would want,\n*topup:* to subscribe or topup';
const BE_PATIENT_WHILE_SYSTEM_GENERATES_DOC =
  'Please be patient while system generates your docx file';
const ERROR_NO_QUOTED_MESSAGES_FOUND =
  '*Error* No recent message found\n If you would like to download a specific message (older than 5 mins) *quote* the message (by swiping right or clicking on reply ) then resend create doc .Watch a demonstration of this on our Tiktok https://vm.tiktok.com/ZM25Htygr/)';
const NO_MEDIA_REQUEST_SEND_TEXT =
  'Our apologies, current version is not yet able to process media such as images and audio, please make a textual request';
const MESSAGE_FLAGGED =
  'Sorry!,Your request has been flagged because it has words identified as having potential to be used for illicit/immoral uses and has been sent to the adminstrator for review. If you feel you have been wrongly flagged do appeal to our admin on this number 0775231426';
const ONLY_AVAILABLE_FOR_SUBSCRIBED =
  'Sorry this service is only available for subscribed users, reply with *Topup*';
const NOT_ENOUGH_CALLS_TO_PROCESS_IMAGE =
  'Sorry you do not have enough calls remaing today to make this request. Image generation requires 10 or more remain calls per day';
const WAIT_WHILE_MESSAGE_IS_BEING_PROCESSED =
  'Please wait while your image is being processed, This may take several minutes, please do not send any other message before it finishes. Image generation is equivalent to 15 messages on your quota';
const GENERATED_BY_ASKME_AI = 'Generated by Askme_AI';
const TOPUP_WAS_NOT_PROCESSED =
  'Sorry your topup was not processed successfully please try again by sending the word topup';
const WARNING_DO_NOT_SEND_ANY_MORE_MESSAGES =
  '*WARNING* , do not send any further messages else you will be blocked from using the platform for at least 48 hours\nYou have used up your quota. Subscribe to get standard user privileges or Try again tommorow! ';
const MESSAGE_NOT_FORMATTED_FOR_IMAGE_GENERATION =
  'Error Your message is not formatted correctly for createImage generation\n Use the example below\ncreateImage a white cloud covering a mountain';
const BLOCKED_MESSAGE =
  'You have now been *blocked* for abusing the system and will not be able to use the platform for the next 48 hours, Further messages will result in permanent blocking ';
const SUBSCRIPTION_QUOTA_EXCEDED =
  '*Do not reply* You have exceeded your subscription quota.';
const UNABLE_TO_PROCESS_REQUEST =
  'Sorry system was unable to complete your request';
const MESSAGE_TOO_LONG =
  'Your message is too long. Upgrade to subscription service if you want longer scope and higher quotas. You can break it down into smaller bits or summarise.';
const NO_CONTEXT_TO_CONTINUE =
  'I can only continue based on previous 3 messages if they were made within the last 3 minutes';
const FREE_QUOTA_EXCEDED =
  'You have exceed your free usage. Reply with the word "Topup" to subscribe. Subscription only costs RTGS500 for a 3 day subscription and RTGS6000 (Ecocash) for monthly subscription';
const ECOCASH_NUMBER =
  'Our payments are handled through a secure payment system through Ecocash.\n\nPlease submit the Ecocash number that you would you like to pay with';
const INVALID_ECOCASH_NUMBER =
  'The number you entered is not a valid Ecocash number\nplease use format shown:0771234567. *This is an example number dont send any money to it*';
const TOPUP_PRODUCT =
  'Which product do you want to subscribe for\n\n1.Monthly= RTGS$6000 ecocash (*25 messages per day*)\n2.Payu =RTGS$500 55 messages (*Expires in 72 hours*)\n\nReply with *1* or *2*';
const REPLY_WITH_TOPUP =
  'You are currently using a limited (free) version \nTo get full access subscribe by sending the word "*Topup*" \nSubscriptions start from only RTGS500';
const INVALID_TOPUP_PRODUCT = `Please respond with any one of\n1.payu\n2.monthly\nEg just reply with the word monthly`;
const SUBSCRIPTION_EXPIRED = `Your subscription has expired. To renew reply with the word Topup`;
const PROMPTS_VIOLATES_POLICIES =
  'Error:Your prompt has been rejected beacuse it violates usage policies';
const SUBSCRIPTION_EXPIRING_SOON = `\nYour subscribtion to AskMe expires within the next 24 hours, To renew reply with the word Topup.`;
const ERROR_IMAGE_NOT_PROCESSED = `Error : there was an error processing your image please check if it has any harmful content or anything that maybe against our usage policies`;
const USER_BANNED = `This user has been banned`;
module.exports = {
  USE_THESE_KEY_WORDS,
  USER_BANNED,
  CANNOT_CONTINUE_AFTER_FIVE_MINS,
  WELCOME_MESSAGE,
  ERROR_IMAGE_NOT_PROCESSED,
  MESSAGE_NOT_FORMATTED_FOR_IMAGE_GENERATION,
  FREE_QUOTA_EXCEDED,
  PROMPTS_VIOLATES_POLICIES,
  SUBSCRIPTION_EXPIRING_SOON,
  SUBSCRIPTION_EXPIRED,
  TOPUP_WAS_NOT_PROCESSED,
  REPLY_WITH_TOPUP,
  INVALID_TOPUP_PRODUCT,
  INVALID_ECOCASH_NUMBER,
  TOPUP_PRODUCT,
  ECOCASH_NUMBER,
  TOO_MANY_REQUESTS_TRY_LATER,
  ONLY_AVAILABLE_FOR_SUBSCRIBED,
  ERROR_NO_QUOTED_MESSAGES_FOUND,
  BE_PATIENT_WHILE_SYSTEM_GENERATES_DOC,
  DO_NOT_SEND_THANK_YOU,
  WARNING_DO_NOT_SEND_ANY_MORE_MESSAGES,
  GENERATED_BY_ASKME_AI,
  WAIT_WHILE_MESSAGE_IS_BEING_PROCESSED,
  SAVE_NEW_USER: SAVE_NEW_USER_FAILED,
  TOPUP_ERROR_MESSAGE,
  TOP_UP_MESSAGE: FREE_QUOTA_EXCEDED,
  UNABLE_TO_PROCESS_REQUEST,
  MESSAGE_FLAGGED,
  MESSAGE_TOO_LONG,
  SUBSCRIPTION_QUOTA_EXCEDED,
  NOT_ENOUGH_CALLS_TO_PROCESS_IMAGE,
  NO_CONTEXT_TO_CONTINUE,
  NO_MEDIA_REQUEST_SEND_TEXT,
  BLOCKED_MESSAGE,
};
