const fs = require("fs");
module.exports = readFile = async (path) => {
  const result = await fs.readFileSync(__dirname + path, "utf8");
  return result;
};