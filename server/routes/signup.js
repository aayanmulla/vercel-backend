const express = require('express');
const {signup,verifyOTP} = require('../controllers/signup.controller');

const router = express.Router();

// Signup route
router.post('/', signup);
router.post('/verifyOTP', verifyOTP);
module.exports = router;