const express = require("express");
const connectToDb = require("./db/db");

const app = express();
const cors = require("cors");
const multer = require("multer");
const upload = require("./config/cloudinary.config");

app.use(cors());
app.use(express.json());


app.post('/upload', upload.single('image'), (req, res) => {
    res.json(req.file);
});

app.get('/', (req, res) => {
    res.send('Hello World');
});

connectToDb().then(res => {

    app.listen(3000, () => {
        console.log("🚀 Server running at http://localhost:3000");
    });

})