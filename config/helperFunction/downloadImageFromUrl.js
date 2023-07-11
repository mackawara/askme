const http = require("http");
const https = require("https");

const fs = require("fs");
const downloadUrl = async (url, outPut) => {
  const file = fs.createWriteStream(outPut);
  if (url.startsWith("https")) {
    console.log("starts with");
    const request = https.get(url, function (response) {
      response.pipe(file);

      // after download completed close filestream
      file.on("finish", () => {
        file.close();
        console.log("Download Completed");
      });
    });
  } else {
    const request = http.get(url, function (response) {
      response.pipe(file);

      // after download completed close filestream
      file.on("finish", () => {
        file.close();
        console.log("Download Completed");
      });
    });
  }
};
module.exports = downloadUrl;
