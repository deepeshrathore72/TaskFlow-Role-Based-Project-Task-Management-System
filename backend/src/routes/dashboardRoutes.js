const express = require('express');
const router = express.Router();
const { getDashboardStats, getRecentActivity } = require('../controllers');
const { authenticate } = require('../middleware');

// All routes require authentication
router.use(authenticate);

// Get dashboard stats (role-based)
router.get('/stats', getDashboardStats);

// Get recent activity
router.get('/activity', getRecentActivity);

module.exports = router;
