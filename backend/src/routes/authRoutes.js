const express = require('express');
const router = express.Router();
const { login, getMe, logout, changePassword } = require('../controllers');
const { 
  authenticate, 
  loginValidator, 
  changePasswordValidator,
  validate 
} = require('../middleware');

// Public routes
router.post('/login', loginValidator, validate, login);

// Protected routes
router.get('/me', authenticate, getMe);
router.post('/logout', authenticate, logout);
router.put('/change-password', authenticate, changePasswordValidator, validate, changePassword);

module.exports = router;
