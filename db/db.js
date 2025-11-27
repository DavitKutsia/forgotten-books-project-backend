const { default: mongoose } = require("mongoose");
require('dotenv').config();

const connectToDb = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('DB Connected Successfully');
  } catch (e) {
    console.error('DB Connection Error:', e);
    throw e; 
  }
};

module.exports = connectToDb;
