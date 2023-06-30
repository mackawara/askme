const { mongoose } = require("mongoose");

const referalsSchema = new mongoose.Schema({
  referingNumber: {
    type: String,
    required: true,
  },
  redeemed: {
    type: Boolean,
    required: true,
  },
  nowUser: {
    type: Boolean,
    required: false,
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

const ReferalsModel = mongoose.model("referals", referalsSchema);

module.exports = ReferalsModel;
