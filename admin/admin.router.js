const { Router } = require('express');
const userModel = require('../models/user.model');
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
    const totalUsers= await userModel.countDocuments();

    res.status(200).json({
      success: true,
      stats: {
        totalUsers
      },
    });
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    res.status(500).json({ success: false, message: 'Error fetching statistics' });
  }
});

module.exports = adminRouter;
