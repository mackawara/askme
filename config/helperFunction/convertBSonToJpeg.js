const fs = require("fs");
const convertBSonTojpeg = async (base64String, outputPath) => {
    console.log(base64String)
  try {
    fs.writeFileSync(outputPath, base64String)
    return outputPath;
  } catch (err) {
    return "Error";
  }
};
module.exports = convertBSonTojpeg;
