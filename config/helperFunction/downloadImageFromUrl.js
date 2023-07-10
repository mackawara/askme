const http=require("http")
const https=require("https")
const fs=require("fs");
const { fileURLToPath } = require("url");

const downloadUrl=async (url, outPut)=> {
  const file = fs.createWriteStream(outPut);
  if (url.startsWith("http")) {
    const request = http.get(url, function (response) {
      response.pipe(file);

      // after download completed close filestream
      file.on("finish", () => {
        file.close();
        console.log("Download Completed");
        
      });
    });
  } else {
    const request = https.get(url, function (response) {
      response.pipe(file);

      // after download completed close filestream
      file.on("finish", () => {
        file.close();
        console.log("Download Completed");
        return outPut
      });
    });
  }
}

module.exports=downloadUrl