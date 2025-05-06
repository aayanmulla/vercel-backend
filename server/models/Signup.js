const mongoose = require('mongoose');

const SignupSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: false
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    retypepassword: {
        type: String,
        required: false
    },
});

module.exports = mongoose.model('Signup', SignupSchema);