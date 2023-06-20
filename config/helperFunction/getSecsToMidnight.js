const getSecsToMidNight = () => {
  let now = new Date();
  let msToMidnight =
    ((now.getHours() * 60 + now.getMinutes()) * 60 + now.getSeconds()) * 1000 +
    ((24 - now.getHours()) % 24);
  console.log(msToMidnight);
  //returns the seconds to midnight
  return Math.floor(msToMidnight / 1000);
};
module.exports=getSecsToMidNight
