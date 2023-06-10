const fs = require("fs");
const writeFile = async (data, path) => {
  try {
    fs.writeFile(path, JSON.stringify(data), (err) => {
      console.log("successfully saved");
    });
  } catch (err) {
    console.log(err);
  }
};
module.exports = writeFile;
