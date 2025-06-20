const { default: mongoose } = require("mongoose")

const filmSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
    genre: {
        type: String,
        enum: ["action", "comedy", "drama", "horror", "romance", "sci-fi"],
        required: true,
    },
    year: {
        type: Number,
        required: true,
    },
    director: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "director",
    },
    reactions: {
        likes: [{type: mongoose.Schema.Types.ObjectId, ref: "director"}],
        dislikes: [{type: mongoose.Schema.Types.ObjectId, ref: "director"}]
    },
    poster: {
    type: String,
    required: true
    }
}, {timestamps: true});

module.exports = mongoose.model("film", filmSchema);