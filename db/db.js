const { default: mongoose } = require("mongoose")
require('dotenv').config()

const connectToDb = async () => {
    try{
        await mongoose.connect(process.env.MONGO_URL)
        console.log('Connected Successfully')
    }catch(e){
        console.log(e)
    }
}


module.exports = connectToDb