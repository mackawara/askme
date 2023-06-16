const isFlagged = (string) => {
  string.split(" ").forEach(async (word) => {
    const keywords = {
      flags: ["porn", "xxx", "LGBT", "gay", "games", "movies"],
    };

    if (keywords.flags.includes(word)) {
      return true;
    } else return false;
  });
};
mpdule.exports=isFlagged
