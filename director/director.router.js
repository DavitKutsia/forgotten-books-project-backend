    const { Router } = require("express");
    const Director = require("../models/director.model");
    const { isValidObjectId } = require("mongoose");
    const Film = require("../models/film.model");
    const directorSchema = require("../validations/director.schema");
    const upload = require("../config/cloudinary.config");

    const directorsRouter = Router();

    /**
 * @swagger
 * /directors:
 *   get:
 *     summary: Get all directors
 *     tags:
 *       - Directors
 *     responses:
 *       200:
 *         description: Returns a list of all directors with their films
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                     example: 60d0fe4f5311236168a109ca
 *                   name:
 *                     type: string
 *                     example: John Doe
 *                   age:
 *                     type: integer
 *                     example: 35
 *                   email:
 *                     type: string
 *                     example: johndoe@example.com
 *                   role:
 *                     type: string
 *                     example: director
 *                   films:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                           example: 60d0fe4f5311236168a109cb
 *                         title:
 *                           type: string
 *                           example: Inception
 *                         content:
 *                           type: string
 *                           example: A mind-bending thriller
 *                         genre:
 *                           type: string
 *                           example: Sci-Fi
 *                         year:
 *                           type: integer
 *                           example: 2010
 */
    directorsRouter.get("/", async (req, res) => {
        const directors = await Director.find().populate("films", "title content genre year");
        res.status(200).json(directors);
    });

    /**
 * @swagger
 * /directors:
 *   post:
 *     summary: Create a new director
 *     tags:
 *       - Directors
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - age
 *               - email
 *               - password
 *               - role
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Doe
 *               age:
 *                 type: integer
 *                 example: 35
 *               email:
 *                 type: string
 *                 format: email
 *                 example: johndoe@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: mySecret123
 *               role:
 *                 type: string
 *                 example: director
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
 *                   $ref: '#/components/schemas/Director'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Validation error message"
 */
    directorsRouter.post("/", async (req, res) => {
            
        const { error, value } = directorSchema.validate(req.body || {}); 
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }
        const { name, age, email, password, role } = value;


        const newDirector = await Director.create({ name, age, email, password, role });
        res.status(201).json({ message: "Created successfully", data: newDirector });
    });

    /**
 * @swagger
 * /directors/{id}:
 *   delete:
 *     summary: Delete a director and all their films
 *     tags:
 *       - Directors
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The director's unique ID
 *     responses:
 *       200:
 *         description: Director and all their films deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Director and all their films deleted successfully
 *                 deletedDirector:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: 60d0fe4f5311236168a109ca
 *                     name:
 *                       type: string
 *                       example: John Doe
 *                     age:
 *                       type: integer
 *                       example: 35
 *                     email:
 *                       type: string
 *                       example: johndoe@example.com
 *                     role:
 *                       type: string
 *                       example: director
 *       400:
 *         description: Invalid director ID
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Invalid director ID
 *       404:
 *         description: Director not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Director not found
 */
    directorsRouter.delete('/:id', async (req, res) => {
        const { id } = req.params;

        if (!isValidObjectId(id)) {
            return res.status(400).json({ error: "Invalid director ID" });
        }

        await Film.deleteMany({ director: id });
    
        const deletedDirector = await Director.findByIdAndDelete(id);
        if (!deletedDirector) {
            return res.status(404).json({ error: "Director not found" });
        }

        res.json({ 
            message: "Director and all their films deleted successfully",
            deletedDirector
        });
    });

    /**
 * @swagger
 * /directors:
 *   put:
 *     summary: Update the authenticated director's profile
 *     tags:
 *       - Directors
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Doe
 *               age:
 *                 type: integer
 *                 example: 36
 *               email:
 *                 type: string
 *                 format: email
 *                 example: johndoe@example.com
 *               avatar:
 *                 type: string
 *                 format: binary
 *                 description: Optional avatar image file
 *     responses:
 *       200:
 *         description: Updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Updated successfully
 *                 data:
 *                   $ref: '#/components/schemas/Director'
 *       400:
 *         description: Invalid input or no fields to update
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: At least one field is required to update
 */
    directorsRouter.put("/", upload.single('avatar'), async (req, res) => {
        const id = req.directorId;

        if (!isValidObjectId(id)) {
            return res.status(400).json({ message: "Invalid director ID" });
        }

        const updateData = { ...req.body };

        if (req.file) {
            updateData.avatar = req.file.path || req.file.secure_url;
        }

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ message: "At least one field is required to update" });
        }

        const updatedDirector = await Director.findByIdAndUpdate(id, updateData, { new: true });

        res.status(200).json({ message: "Updated successfully", data: updatedDirector });
    });



    module.exports = directorsRouter;