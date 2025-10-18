const allowToCreateTheProductOnlyIfSellerIdIsThere = (req, res, next) => {

     if (req.user && req.user.role === "seller") {
        next();
    } else {
        res.status(403).json({ message: "You must be a seller to create a product" });
    }
}

module.exports = allowToCreateTheProductOnlyIfSellerIdIsThere;
