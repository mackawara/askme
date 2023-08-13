const mongoose = require("mongoose");
const Syllabus = mongoose.model("sylabis",new mongoose.Schema({}, { strict: false }));

module.exports = Syllabus;

