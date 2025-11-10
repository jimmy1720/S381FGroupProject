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
        required: function() {
            return this.type === 'local'; // Only required for local accounts
        },
        unique: true,
        sparse: true, // Allow multiple nulls for OAuth users
        trim: true,
        match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please fill a valid email address']
    },
    password: {
        type: String,
        required: function() {
            return this.type === 'local'; // Only required for local accounts
        },
        minlength: [8, 'Password must be at least 8 characters long']
    },
    type: {
        type: String,
        enum: {
            values: ['local', 'google', 'facebook'],
            message: '{VALUE} is not a valid user type'
        },
        default: 'local'
    },
    googleId: {
        type: String,
        sparse: true
    },
    facebookId: {
        type: String,
        sparse: true
    },
    displayName: {
        type: String,
        trim: true
    },
    created_at: {
        type: Date,
        default: Date.now
    }
});

// Hash the password before saving the user (only for local accounts)
userSchema.pre('save', async function(next) {
    if (this.type !== 'local' || !this.isModified('password')) {
        return next();
    }

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(new Error('Error hashing password'));
    }
});

// Method to compare password for login (only for local accounts)
userSchema.methods.comparePassword = async function(candidatePassword) {
    if (this.type !== 'local') {
        throw new Error('This account uses social login');
    }
    return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema, 'users');

module.exports = User;