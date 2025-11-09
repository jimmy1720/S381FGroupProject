// models/userModel.js
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Username is required'],
        unique: true,
        trim: true,
        minlength: [3, 'Username must be at least 3 characters long'],
        maxlength: [30, 'Username cannot exceed 30 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        trim: true,
        match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please fill a valid email address'] // Regex for validating email format
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [8, 'Password must be at least 8 characters long'] // Enforce a minimum password length
    },
    type: {
        type: String,
        enum: {
            values: ['local', 'google', 'facebook'],
            message: '{VALUE} is not a valid user type' // Custom message for enum validation
        },
        default: 'local'
    },
    created_at: {
        type: Date,
        default: Date.now
    }
});

// Hash the password before saving the user
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        return next(); // Skip hashing if the password hasn't changed
    }

    try {
        const salt = await bcrypt.genSalt(10); // Generate a salt with 10 rounds
        this.password = await bcrypt.hash(this.password, salt); // Hash the password
        next();
    } catch (error) {
        next(new Error('Error hashing password')); // Pass a custom error message
    }
});

// Method to compare password for login
userSchema.methods.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password); // Compare the hashed password
};

const User = mongoose.model('User', userSchema, 'users');

module.exports = User;