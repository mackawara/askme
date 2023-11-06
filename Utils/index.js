const indvUsers= require("../models/individualUsers");
const greetByTime=(nameOfClient)=>{
        const currentTime = new Date();
        const currentHour = currentTime.getHours();
     
        if (currentHour < 10) {
           return `Good morning ${nameOfClient}, we hope you are having a pleasant start to your day`;
        } else if (currentHour >= 10 && currentHour < 16) {
           return `Good day ${nameOfClient}, We hope you are having a pleasant day`;
        } else { // Assuming you meant to say "good evening"
           return `Good evening ${nameOfClient}, we hope you had a splendid day`;
        }
     }
     const deleteDuplicates = async () => {
        const duplicates = await indvUsers.aggregate([{
          $group: {
            _id: "$number",
            uniqueIds: { $addToSet: "$_id" },
            count: { $sum: 1 }
          }
        }, {
          $match: {
            count: { '$gt': 1 }
          }
        }
        ])
        duplicates.forEach((doc) => {
          doc.uniqueIds.shift()
          // delete the remaining using ther IDs
          try { indvUsers.deleteMany({ _id: { $in: doc.uniqueIds } }).then((result) => { console.log(result) }) } catch (err) { console.log(err) }
        })
    
      }

     module.exports= {greetByTime,deleteDuplicates}
