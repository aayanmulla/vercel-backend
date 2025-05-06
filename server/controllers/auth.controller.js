const Signup = require('../models/Signup');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

// Login Function
exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        let user = await Signup.findOne({ email });
        if (!user) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { userId: user._id, username: user.username, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.status(200).json({
            msg: 'Login successful',
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
            }
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ msg: 'Internal server error' });
    }
};

// Forgot Password Function
exports.forgotPassword = async (req, res) => {
    const { email } = req.body;

    try {
        let user = await Signup.findOne({ email });
        if (!user) {
            return res.status(400).json({ msg: 'User not found' });
        }

        const resetToken = jwt.sign(
            { userId: user._id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '15m' }
        );

        const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
        const message = `Click on the link to reset your password: ${resetUrl}`;

        const transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
        });

        await transporter.sendMail({
            to: user.email,
            subject: 'Password Reset Request',
            text: message,
        });

        res.status(200).json({ msg: 'Reset link sent to email!' });
    } catch (err) {
        console.error('Forgot Password Error:', err);
        res.status(500).json({ msg: 'Internal server error' });
    }
};

// Reset Password Function
exports.resetPassword = async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await Signup.findById(decoded.userId);

        if (!user) {
            return res.status(400).json({ msg: 'Invalid or expired token' });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        await user.save();

        res.status(200).json({ msg: 'Password reset successful!' });
    } catch (err) {
        console.error('Reset Password Error:', err);
        res.status(500).json({ msg: 'Internal server error' });
    }
};