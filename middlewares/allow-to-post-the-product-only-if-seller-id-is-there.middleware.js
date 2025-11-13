const allowToCreateTheProductOnlyIfSellerIdIsThere = (req, res, next) => {

     if (req.user && (req.user.role === "user" || req.user.role === "admin")) {
        next();
    } else {
        res.status(403).json({ message: "You must be a user or admin to create a product" });
    }
}

module.exports = allowToCreateTheProductOnlyIfSellerIdIsThere;
