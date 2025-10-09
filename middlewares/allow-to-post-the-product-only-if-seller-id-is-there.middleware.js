const allowToCreateTheProductOnlyIfSellerIdIsThere = (req, res, next) => {

    const sellerId = req.headers['seller-id'];
    if (sellerId) {
        next();
    } else {
        res.status(403).send('You are not allowed to post a product without a seller ID');
    }
}

module.exports = allowToCreateTheProductOnlyIfSellerIdIsThere;