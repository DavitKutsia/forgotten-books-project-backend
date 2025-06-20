const allowToCreateTheFilmOnlyIfDirectorIdIsThere = (req, res, next) => {

    const directorId = req.headers['director-id'];
    if (directorId) {
        next();
    } else {
        res.status(403).send('You are not allowed to create a film without a director ID');
    }
}

module.exports = allowToCreateTheFilmOnlyIfDirectorIdIsThere;