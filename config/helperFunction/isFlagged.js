const isFlagged = (string) => {
  const keywords = [
    "porn",
    "xxx",
    "LGBT",
    "gay",
    "movies",
    "boyfriend",
    "girlfirend",
    "gal",
    "bae",
    "sex",
    "sexual",
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
