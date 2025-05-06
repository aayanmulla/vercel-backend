const express = require('express');
const router = express.Router();
const { signup } = require('../controllers/signup.controller');
const { login } = require('../controllers/auth.controller'); // Import login function
const { forgotPassword, resetPassword } = require('../controllers/auth.controller');

// Signup Route
router.post('/signup', signup);

// Login Route
router.post('/login', login);

router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

module.exports = router;
