// authController.js

const User = require('../models/User');

/**
 * Handle user login with local strategy.
 */
async function login(req, res) {
    try {
        const { username, password } = req.body; // Use req.body for form data
        const user = await User.findOne({
            $or: [
                { username: username.toLowerCase() }, // Normalize username
                { email: username.toLowerCase() } // Normalize email
            ]
        });

        if (!user) {
            return res.render('login', { error: 'User not found' });
        }

        const isValid = await user.comparePassword(password); // Use method from the user model
        if (!isValid) {
            return res.render('login', { error: 'Invalid password' });
        }

        req.session.user = {
            id: user._id.toString(),
            name: user.username,
            type: user.type
        };

        req.session.save(err => {
            if (err) {
                console.error('Session save error:', err); // Log the error
                return res.render('login', { error: 'Login failed. Please try again.' });
            }
            res.redirect('/dashboard'); // Redirect to the dashboard after successful login
        });
    } catch (err) {
        console.error('Login error:', err); // Log the error
        res.render('login', { error: 'Login failed. Please try again.' });
    }
}

/**
 * Handle user registration.
 */
async function register(req, res) {
    try {
        const { username, email, password, confirm_password } = req.body; // Use req.body for form data
        if (password !== confirm_password) {
            return res.render('register', { error: 'Passwords do not match' });
        }

        const existingUser = await User.findOne({
            $or: [
                { username: username.toLowerCase() }, // Normalize username
                { email: email.toLowerCase() } // Normalize email
            ]
        });

        if (existingUser) {
            return res.render('register', { error: 'Username or email already exists' });
        }

        const newUser = new User({
            username,
            email,
            password, // This should be hashed in the model's pre-save hook
            type: 'local',
            created_at: new Date()
        });

        await newUser.save(); // Ensure password hashing is handled in the model
        res.render('login', { message: 'Registration successful! Please login.' });
    } catch (err) {
        console.error('Registration error:', err); // Log the error
        res.render('register', { error: 'Registration failed. Please try again.' });
    }
}

module.exports = {
    login,
    register
};