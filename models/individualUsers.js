const mongoose = require("mongoose");

const usersSchema = new mongoose.Schema({
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
  totalTokens: {
    type: Number,
    required: false,
  },
  completionTokens: {
    type: Number,
    required: false,
  },
  inputTokens: {
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
usersSchema.methods.calculateTokensPerCallAndSave = function () {
  this.tokensPerCall = this.totalTokens / this.calls;
  this.timestamp = Date.now();
  return this.save();
};
usersSchema.methods.calculateCallsPerDay = function () {
  const dateNOW = parseInt(new Date().toISOString().slice(8, 10));
  const dateToday = Date.now();
  const initialDate = parseInt(this.date.slice(8, 10));

  const dayElapsed = (dateToday - this.timestamp) / 1000 / 86400;
  console.log(dayElapsed)
  this.callsPerDay = this.calls / dayElapsed;

  return this.save();
};
usersSchema.methods.calculateCostPerCall = function () {
  this.costPerCall = (this.tokensPerCall / 1000) * 0.003;

  return this.save();
};
usersSchema.methods.calculateCostPerDay = function () {
  this.costPerDay = this.costPerCall * this.callsPerDay;

  return this.save();
};

const contactsModel = mongoose.model("users", usersSchema);

module.exports = contactsModel;
