const express = require("express");
const connectToDb = require("./db/db");
const directorsRouter = require("./director/director.router");
const filmsRouter = require("./film/film.router");
const authRouter = require("./auth/auth.router");
const isAuth = require("./middlewares/isAuth.middleware");
const app = express();
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const upload = require("./config/cloudinary.config");
const swagger = require("./swagger");
const swaggerJSDoc = require("swagger-jsdoc");
const swaggerUI = require("swagger-ui-express");

app.use(cors());
app.use(express.json());
app.use(express.static('uploads'));
const specs = swaggerJSDoc(swagger);
app.use("/docs", swaggerUI.serve, swaggerUI.setup(specs));


app.post('/upload', upload.single('image'), (req, res) => {
    res.json(req.file);
});

app.get('/', (req, res) => {
    res.send('Hello World');
});

app.use("/directors", isAuth, directorsRouter);
app.use("/films", isAuth, filmsRouter);
app.use("/auth", authRouter);

connectToDb().then(res => {

    app.listen(3000, () => {
        console.log("🚀 Server running at http://localhost:3000");
    });

})