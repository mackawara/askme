const greetByTime=()=>{
        const currentTime = new Date();
        const currentHour = currentTime.getHours();
     
        if (currentHour < 10) {
           return 'Good morning';
        } else if (currentHour >= 10 && currentHour < 16) {
           return 'Good day';
        } else { // Assuming you meant to say "good evening"
           return 'Good evening';
        }
     }

     module.exports= greetByTime
