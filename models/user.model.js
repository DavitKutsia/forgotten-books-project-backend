const e = require("express");
const { default: mongoose } = require("mongoose");

const userModel = new mongoose.Schema({
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
        enum: ['user', 'admin'],
        default: 'user'
    },
    subscriptionActive: {
        type: Boolean,
        default: false,
    },
  },
  { timestamps: true }
);

}, {timestamps: true});

module.exports = mongoose.model("User", userModel);
