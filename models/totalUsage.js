const mongoose = require("mongoose");

const totalUsageSchema = new mongoose.Schema({
  date: {
    type: String,
    required: false,
  },

  calls: { type: Number, required: true },
  callsThisMonth:{type: Number, required: true},
  warnings: { type: Number, required: true },
  errorsRec: { type: Number, required: true },

  totalTokens: {
    type: Number,
    required: false,
  },
  inputTokens: {
    type: Number,
    required: false,
  },
  completionTokens: {
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
totalUsageSchema.methods.calculateTokensPerCallAndSave = function () {
  this.tokensPerCall = this.totalTokens / this.calls;
  this.timestamp = Date.now();
  return this.save();
};
totalUsageSchema.methods.calculateCallsPerDay = function () {
  
  const dateToday = Date.now();
  

  const dayElapsed = (dateToday - this.timestamp) / 1000 / 86400;
  console.log(dayElapsed);
  this.callsPerDay = this.calls / dayElapsed;

  return this.save();
};
totalUsageSchema.methods.calculateCostPerCall = function () {
  this.costPerCall = (this.tokensPerCall / 1000) * 0.003;

  return this.save();
};
totalUsageSchema.methods.calculateCostPerDay = function () {
  this.costPerDay = this.costPerCall * this.callsPerDay;

  return this.save();
};

const totalUsageModel = mongoose.model("totalUsage", totalUsageSchema);

module.exports = totalUsageModel;
