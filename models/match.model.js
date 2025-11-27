const mongoose = require("mongoose");

const matchSchema = new mongoose.Schema({
  matchId: {
    type: String,
    unique: true,
    required: true
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true
  },
  matcherUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  respondedByOwner: {
    type: Boolean,
    default: false
  }
});

module.exports = mongoose.models.Match || mongoose.model("Match", matchSchema);
