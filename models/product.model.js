const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    minlength: 3
  },
  content: {
    type: String,
    required: true,
    minlength: 10
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true
  }
});

module.exports = mongoose.models.Product || mongoose.model("Product", productSchema);
