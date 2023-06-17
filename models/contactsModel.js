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
  tokensPerCall: {
    type: Number,
    required: false,
  },
  timestamp: {
    required: true,
    type: Number,
  },
  callsPerDay: {
    type: Number,
    required: false,
  },
  costPerCall: { type: Number, required: false },
  costPerDay: { type: Number, required: false },
});
contactsSchema.methods.calculateTokensPerCallAndSave = function () {
  this.tokensPerCall = this.tokens / this.calls;
  this.timestamp = Date.now();
  return this.save();
};
contactsSchema.methods.calculateCallsPerDay = function () {
  const dateNOW = parseInt(new Date().toISOString().slice(8, 10));
  const initialDate = parseInt(this.date.slice(8, 10));
  const dayElapsed = dateNOW - initialDate;
  this.callsPerDay = this.calls / dayElapsed;

  return this.save();
};
contactsSchema.methods.calculateCostPerCall = function () {
  this.costPerCall = (this.tokensPerCall / 1000) * 0.003;

  return this.save();
};
contactsSchema.methods.calculateCostPerDay = function () {
  this.costPerDay = this.costPerCall * this.callsPerDay;

  return this.save();
};

const contactsModel = mongoose.model("contacts", contactsSchema);

module.exports = contactsModel;
