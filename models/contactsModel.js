const mongoose = require("mongoose");

const contactsSchema = new mongoose.Schema({
  date: {
    type: String,
    required: false,
  },
  isBlocked: {
    type: String,
    required: true,
  },
  calls: { type: Number, required: true },
  number: {
    type: String,
    required: true,
  },
  warnings: {
    type: Number,
    required: true,
  },
  notifyName: {
    type: String,
    required: true,
  },
  serialisedNumber: {
    type: String,
    required: true,
  },
  isSubscribed: {
    type: String,
    required: true,
  },
  tokens: {
    type: Number,
    required: false,
  },
});

const contactsModel = mongoose.model("contacts", contactsSchema);

module.exports = contactsModel;
