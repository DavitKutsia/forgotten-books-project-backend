const { Router } = require("express");
const Film = require("../models/film.model");
const Director = require("../models/director.model");
const { isValidObjectId } = require("mongoose");
const filmSchema = require("../validations/film.schema");
const allowToCreateTheFilmOnlyIfDirectorIdIsThere = require("../middlewares/allow-to-create-the-film-only-if-director-id-is-there");
const upload = require("../config/cloudinary.config");

const filmsRouter = Router();

/**
 * @swagger
 * /films:
 *   get:
 *     summary: Get all films (optionally filter by genre and year)
 *     tags:
 *       - Films
 *     parameters:
 *       - in: query
 *         name: genre
 *         schema:
 *           type: string
 *         description: Filter films by genre (case-insensitive)
 *         example: sci-fi
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *         description: Filter films by release year
 *         example: 2010
 *     responses:
 *       200:
 *         description: Returns a list of films
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                     example: 60d0fe4f5311236168a109cb
 *                   title:
 *                     type: string
 *                     example: Inception
 *                   content:
 *                     type: string
 *                     example: A mind-bending thriller
 *                   genre:
 *                     type: string
 *                     example: sci-fi
 *                   year:
 *                     type: integer
 *                     example: 2010
 *                   director:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                         example: Christopher Nolan
 *                       age:
 *                         type: integer
 *                         example: 50
 */
filmsRouter.get("/", async (req, res) => {

    const genre = req.query.genre;
    const year = req.query.year;

    const filter = {};

    if (genre) {
        filter.genre = genre.toLowerCase();
    }

    if (year) {
        const yearNumber = parseInt(year);

        if (isNaN(yearNumber)) {
            return res.status(400).json({ message: "Year must be a number" });
        }

        filter.year = yearNumber;
    }

    const films = await Film.find(filter).populate("director", "name age");
    res.status(200).json(films);
});

/**
 * @swagger
 * /films:
 *   post:
 *     summary: Create a new film
 *     tags:
 *       - Films
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - content
 *               - genre
 *               - year
 *               - poster
 *             properties:
 *               title:
 *                 type: string
 *                 example: Inception
 *               content:
 *                 type: string
 *                 example: A mind-bending thriller
 *               genre:
 *                 type: string
 *                 example: sci-fi
 *               year:
 *                 type: integer
 *                 example: 2010
 *               poster:
 *                 type: string
 *                 format: binary
 *                 description: Poster image file
 *     parameters:
 *       - in: header
 *         name: director-id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the director creating the film
 *     responses:
 *       201:
 *         description: Created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Created successfully
 *                 data:
 *                   $ref: '#/components/schemas/Film'
 *       400:
 *         description: Validation error or missing fields
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Director ID is required
 *       404:
 *         description: Director not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Director not found
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Internal server error
 */
filmsRouter.post("/", allowToCreateTheFilmOnlyIfDirectorIdIsThere, upload.single("poster"), async (req, res) => {
    try {
        const directorId = req.headers['director-id'];
        
        if (!directorId) {
            return res.status(400).json({ message: "Director ID is required" });
        }

        if (!isValidObjectId(directorId)) {
            return res.status(400).json({ message: "Invalid director ID" });
        }

        const director = await Director.findById(directorId);
        if (!director) {
            return res.status(404).json({ message: "Director not found" });
        }
        const { error, value } = filmSchema.validate(req.body || {}); 
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }

        if (!req.file) {
            console.error('No file was uploaded');
            return res.status(400).json({ message: "Poster image is required" });
        }

        const { title, content, genre, year } = value;
        const posterUrl = req.file.path || req.file.secure_url;


        const newFilm = await Film.create({ 
            title, 
            content, 
            genre, 
            year, 
            director: directorId,
            poster: posterUrl
        });

        await Director.findByIdAndUpdate(directorId, { $push: { films: newFilm._id } });    
        res.status(201).json({ message: "Created successfully", data: newFilm });

    } catch (error) {
        console.error("Error creating film:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
});

/**
 * @swagger
 * /films/{id}:
 *   delete:
 *     summary: Delete a film by ID (only the film's director can delete)
 *     tags:
 *       - Films
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The film's unique ID
 *     responses:
 *       200:
 *         description: Deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Deleted successfully
 *       400:
 *         description: Invalid film ID
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Invalid film ID
 *       403:
 *         description: Not allowed to delete this film
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: You are not allowed to delete this film
 *       404:
 *         description: Film not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Film not found
 */
filmsRouter.delete('/:id', async (req, res) => {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
        return res.status(400).json({ message: "Invalid film ID" });
    }

    const film = await Film.findById(id);
    if (!film) {
        return res.status(404).json({ message: "Film not found" });
    }

    if(film.director.toString() !== req.directorId) {
        return res.status(403).json({ message: "You are not allowed to delete this film" });
    }

    if (film.director) {
        await Director.findByIdAndUpdate(
            film.director,
            { $pull: { films: film._id } }
        );
    }

    await Film.findByIdAndDelete(id);
    res.status(200).json({ message: "Deleted successfully" });
});

/**
 * @swagger
 * /films/{id}:
 *   delete:
 *     summary: Delete a film by ID (only the film's director can delete)
 *     tags:
 *       - Films
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The film's unique ID
 *     responses:
 *       200:
 *         description: Deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Deleted successfully
 *       400:
 *         description: Invalid film ID
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Invalid film ID
 *       403:
 *         description: Not allowed to delete this film
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: You are not allowed to delete this film
 *       404:
 *         description: Film not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Film not found
 */
filmsRouter.put("/:id", upload.single("poster"), async (req, res) => {
    const { id } = req.params;
    
    if (!isValidObjectId(id)) {
        return res.status(400).json({ message: "Invalid film ID" });
    }

    const film = await Film.findById(id);
    if(film.director.toString() !== req.directorId) {
        return res.status(403).json({ message: "You are not allowed to edit this film" });
    }

    const { title, content, director, genre, year } = req.body;
    const poster = req.file?.path || null;

    if (!title && !content && !director && !genre && !year && !poster) {
        return res.status(400).json({ message: "At least one field is required to update" });
    }

    const updatedFilm = await Film.findByIdAndUpdate(
        id,
        { 
            ...(title && { title }),
            ...(content && { content }),
            ...(genre && { genre }),
            ...(year && { year }),
            ...(poster && { poster })
        },
        { new: true }
    );
    if (!updatedFilm) {
        return res.status(404).json({ message: "Film not found" });
    }

    res.status(200).json({ message: "Updated successfully", data: updatedFilm });
})

/**
 * @swagger
 * /films/{id}/reactions:
 *   post:
 *     summary: Like or dislike a film (toggle)
 *     tags:
 *       - Films
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The film's unique ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reaction
 *             properties:
 *               reaction:
 *                 type: string
 *                 enum: [like, dislike]
 *                 example: like
 *                 description: Reaction type ("like" or "dislike")
 *     responses:
 *       200:
 *         description: Reaction updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Reaction updated successfully
 *                 data:
 *                   $ref: '#/components/schemas/Film'
 *       400:
 *         description: Invalid film ID or reaction type
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Invalid reaction type
 *       404:
 *         description: Film not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Film not found
 */
filmsRouter.post("/:id/reactions", async (req, res) => {
    const { id } = req.params;
    const { reaction } = req.body;
    const validReactions = ["like", "dislike"];
    if (!validReactions.includes(reaction)) {
        return res.status(400).json({ message: "Invalid reaction type" });
    }

    if (!isValidObjectId(id)) {
        return res.status(400).json({ message: "Invalid film ID" });
    }

    const film = await Film.findById(id);
    if (!film) {
        return res.status(404).json({ message: "Film not found" });
    }
    
    const alreadyLikedIndex = film.reactions.likes.findIndex(like => like.toString() === req.directorId);
    const alreadyDislikedIndex = film.reactions.dislikes.findIndex(dislike => dislike.toString() === req.directorId);


    if(reaction === "like") {
        if (alreadyLikedIndex !== -1) {
            film.reactions.likes.splice(alreadyLikedIndex, 1);
        } else {
            film.reactions.likes.push(req.directorId);
        }
    }

    if(reaction === "dislike") {
        if (alreadyDislikedIndex !== -1) {
            film.reactions.dislikes.splice(alreadyDislikedIndex, 1);
        } else {
            film.reactions.dislikes.push(req.directorId);
        }
    }

    if(alreadyLikedIndex !== -1 && reaction === "dislike") {
        film.reactions.likes.splice(alreadyLikedIndex, 1);
    }

    if(alreadyDislikedIndex !== -1 && reaction === "like") {
        film.reactions.dislikes.splice(alreadyDislikedIndex, 1);
    }

    await film.save();
    res.status(200).json({ message: "Reaction updated successfully", data: film });
})

/**
 * @swagger
 * /films/{id}:
 *   get:
 *     summary: Get a film by ID
 *     tags:
 *       - Films
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The film's unique ID
 *     responses:
 *       200:
 *         description: Returns the film details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                   example: 60d0fe4f5311236168a109cb
 *                 title:
 *                   type: string
 *                   example: Inception
 *                 content:
 *                   type: string
 *                   example: A mind-bending thriller
 *                 genre:
 *                   type: string
 *                   example: sci-fi
 *                 year:
 *                   type: integer
 *                   example: 2010
 *                 director:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                       example: Christopher Nolan
 *                     age:
 *                       type: integer
 *                       example: 50
 *       400:
 *         description: Invalid film ID
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Invalid film ID
 *       404:
 *         description: Film not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Film not found
 */
filmsRouter.get("/:id", async (req, res) => {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
        return res.status(400).json({ message: "Invalid film ID" });
    }

    const film = await Film.findById(id).populate("director", "name age");
    if (!film) {
        return res.status(404).json({ message: "Film not found" });
    }

    res.status(200).json(film);
})

module.exports = filmsRouter;