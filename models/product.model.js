const { default: mongoose } = require("mongoose")

const productModel = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
    price: {
        type: Number,
        required: true,
    },
    seller: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "seller",
    },
}, {timestamps: true});

module.exports = mongoose.model("product", productModel);