const queryAndSave = async function (model, item, queryString, itemId) {
  const stringified = `${queryString}`;

  const result = await model
    .find({
      [queryString]: itemId,
    })
    .exec();

  if (result.length < 1) {
    try {
      item.save().then(() => console.log("new entry saved"));
    } catch (error) {
      console.error(error);
    }
  } else {
    console.log("no changes to save");
  }
};
module.exports = queryAndSave;
