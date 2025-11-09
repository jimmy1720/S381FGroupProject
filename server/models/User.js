// models/userModel.js
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');


const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3,
        maxlength: 30
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ // Regex for validating email format
    },
    password: {
        type: String,
        required: true,
        minlength: 8 // Enforce a minimum password length
    },
    type: {
        type: String,
        enum: ['local', 'google', 'facebook'], // Restrict to specific values
        default: 'local'
    },
    created_at: {
        type: Date,
        default: Date.now
    }
});

//Hash the password before saving the user
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        return next(); // Skip hashing if the password hasn't changed
    }

    try {
        const salt = await bcrypt.genSalt(10); // Generate a salt with 10 rounds
        this.password = await bcrypt.hash(this.password, salt); // Hash the password
        next();
    } catch (error) {
        next(error); // Pass any errors to the next middleware
    }
});

//Method to compare password for login
userSchema.methods.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password); // Compare the hashed password
};

const User = mongoose.model('User', userSchema, 'users');

module.exports = User;
