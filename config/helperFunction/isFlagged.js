const isFlagged = (string) => {
  const keywords = [
    "porn",
    "xxx",
    "LGBT",
    "movies",
    "boyfriend",
    "girlfirend",
    "my bae", "lyrics", "CCC", "ZANU PF"
    ,
  ];
  let flagged = [];
  keywords.forEach((word) => {
    if (string.includes(word)) {
      flagged.push(word);
    }
  });
  if (flagged.length >= 1) {
    console.log;
    return true;
  } else {
    return false;
  }
};
module.exports = isFlagged;
