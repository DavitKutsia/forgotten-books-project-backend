const { default: mongoose } = require("mongoose");

const orderSchema = new mongoose.Schema({
  sessionId: { 
    type: String, 
    required: true 
  },
  status: { 
    type: String, 
    default: "PENDING", 
    enum: ["PENDING", "REJECT", "SUCCESS"] 
  },
  amount: { 
    type: Number, 
    required: true 
  },
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
}, { timestamps: true });

module.exports = mongoose.model("order", orderSchema);
