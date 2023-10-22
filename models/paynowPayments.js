const { mongoose } = require("mongoose");

const paynowPaymentsSchema = new mongoose.Schema({

    userNumber: {
        type: String,
        required: true,
    },
    pollUrl: {
        type: String,
        required: true,
    },
    date: {
        type: String,
        required: true,
    },
    timestamp: {
        type: String,
        required: true,
    }, invoiceNumber: {
        type: String,
        required: true,
    },
    product: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        required: true,
    }
});

const PaynowPayments = mongoose.model("paynowPayments", paynowPaymentsSchema);

module.exports = PaynowPayments;
