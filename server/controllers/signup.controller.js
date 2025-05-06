const Signup = require('../models/Signup');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

// Temporary OTP storage (Use Redis or DB for production)
const otpStorage = new Map();

// Nodemailer Transporter (Use Gmail App Password)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,  // Your Gmail
        pass: process.env.EMAIL_PASS,  // App Password (Enable in Google)
    },
});

// ✅ Function to Generate 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// ✅ Signup API (Sends OTP)
// ✅ Signup API (Sends OTP)
exports.signup = async (req, res) => {
    const { username, email, password, retypepassword } = req.body;

    try {
        // Check if user already exists
        let user = await Signup.findOne({ email });
        if (user) {
            return res.status(400).json({ msg: 'User already exists' });
        }

        // Check if passwords match
        if (password !== retypepassword) {
            return res.status(400).json({ msg: 'Passwords do not match' });
        }

        // Generate OTP
        const otp = generateOTP();
        otpStorage.set(email, otp); // Store OTP temporarily

        // ✅ Debugging: Check if OTP is actually stored
        console.log(`Generated OTP for ${email}: ${otp}`);
        console.log("Stored OTPs after signup:", otpStorage);

        // Send OTP to Email
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: "Email Verification OTP",
            text: `Your OTP for account verification is: ${otp}. It is valid for 5 minutes.`,
        });

        res.status(200).json({ msg: "OTP sent to email. Please verify to complete signup." });
    } catch (err) {
        console.error("Signup Error:", err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

// ✅ OTP Verification & User Registration
exports.verifyOTP = async (req, res) => {
    try {
        const { email, otp, username, password } = req.body;

        // Validate input fields
        if (!email || !otp || !username || !password) {
            return res.status(400).json({ msg: "All fields are required" });
        }

        // Debugging Logs
        console.log("Stored OTPs:", otpStorage);
        console.log(`Verifying OTP for ${email}: Received - ${otp}, Expected - ${otpStorage.get(email)}`);

        // Check if OTP exists and matches
        if (!otpStorage.has(email) || otpStorage.get(email) !== otp.trim()) {
            return res.status(400).json({ msg: "Invalid OTP" });
        }

        // Remove OTP after verification
        otpStorage.delete(email);

        // Hash Password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create User
        const user = new Signup({ username, email, password: hashedPassword });
        await user.save();

        // Generate JWT Token
        const token = jwt.sign(
            { userId: user._id, username: user.username, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.status(201).json({
            msg: 'User verified & registered successfully',
            token,
            user: { id: user._id, username: user.username, email: user.email }
        });
    } catch (err) {
        console.error("OTP Verification Error:", err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};
