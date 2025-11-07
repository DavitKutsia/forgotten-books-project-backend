const { Router } = require('express');
const buyerModel = require('../models/buyer.model');
const sellerModel = require('../models/seller.model');
const isAuth = require('../middlewares/isAuth.middleware');

const adminRouter = Router();

const isAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admins only.' });
  }
  next();
};

adminRouter.get('/stats', isAuth, isAdmin, async (req, res) => {
  try {
    const totalBuyers = await buyerModel.countDocuments();
    const totalSellers = await sellerModel.countDocuments();

    res.status(200).json({
      success: true,
      stats: {
        totalBuyers,
        totalSellers,
      },
    });
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    res.status(500).json({ success: false, message: 'Error fetching statistics' });
  }
});

module.exports = adminRouter;
