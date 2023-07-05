const fs = require("fs");
const convertBSonTojpeg = async (base64String, outputPath) => {
  try {
    function decodeBase64Image(base64String) {
      const matches = base64String.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);

      if (matches.length !== 3) {
        throw new Error("Invalid input string");
      }

      return Buffer.from(matches[2], "base64");
    }
    async function saveImageFromBase64(base64String, outputPath) {
      const decodedImage = await decodeBase64Image(base64String);
      fs.writeFileSync(outputPath, decodedImage);
      return outputPath;
    }
    return saveImageFromBase64(base64String, outputPath);
  } catch (err) {
    return "Error";
  }
};
module.exports = convertBSonTojpeg;
