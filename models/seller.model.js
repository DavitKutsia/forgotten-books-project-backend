const e = require("express");
const { default: mongoose } = require("mongoose");

const sellerModel = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        enum: ['buyer', 'seller', 'admin'],
        default: 'seller'
    }
}, {timestamps: true});

module.exports = mongoose.model("seller", sellerModel);
