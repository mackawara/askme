const mongoose = require('mongoose');
const { differenceInCalendarDays, parseISO } = require('date-fns');

const usersSchema = new mongoose.Schema({
  date: {
    type: String,
    required: false,
  },
  isBlocked: {
    type: Boolean,
    required: true,
    default: false,
  },
  isFollower: {
    type: Boolean,
    required: true,
    default: false,
  },
  calls: { type: Number, required: true },
  callsThisMonth: { type: Number, required: true, default: 0 },
  number: {
    type: String,
    required: true,
    ///unique:true
  },
  warnings: {
    type: Number,
    required: true,
  },
  notifyName: {
    type: String,
    required: false,
    default: 'AskMe user',
  },
  serialisedNumber: {
    type: String,
    required: true,
    unique: true,
  },
  isSubscribed: {
    type: Boolean,
    required: true,
    default: false,
  },
  subTTL: {
    type: Number,
    required: false,
    default: 30,
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
    type: String,
  },
  callsPerDay: {
    type: Number,
    required: false,
  },
  referalList: {
    type: Array,
    required: false,
  },
  availableTokens: {
    type: Number,
    required: true,
    default: 0,
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
  const dateToday = Date.now();
  const daysElapsed = differenceInCalendarDays(dateToday, parseISO(this.date));
  console.log(daysElapsed);

  this.callsPerDay = this.calls / daysElapsed;
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
usersSchema.methods.calculateSubTTL = function () {
  this.subTTL = this.subTTL - 1;
  return this.save();
};

const contactsModel = mongoose.model('users', usersSchema);

module.exports = contactsModel;
