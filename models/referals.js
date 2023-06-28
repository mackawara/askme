const { mongoose } = require("mongoose");

const referalsSchema = new mongoose.Schema({
  referingNumber: {
    type: String,
    required: trusted,
  },
  nowUser: {
    type: Boolean,
    required: true,
  },
  targetNumber: {
    type: String,
    required: true,
  },
  targetSerialisedNumber: {
    type: String,
    required: true,
  },
  date: {
    type: String,
    required: true,
  },
});

const ReferalsModel = mongoose.model("referalLis", referalsSchema);

module.exports = ReferalsModel;
