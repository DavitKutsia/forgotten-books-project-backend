const e = require("express");
const { default: mongoose } = require("mongoose");

const directorSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    age: {
        type: Number,
        required: false,
    },
    email: {
        type: String,
        required: true,

    },
    password: {
        type: String,
        required: true,
    },
    films: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "film",
    }],
    avatar: {
        type: String,
        required: false,
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    }
}, {timestamps: true});

module.exports = mongoose.model("director", directorSchema);