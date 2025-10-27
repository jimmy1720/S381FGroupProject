// authController.js

const bcrypt = require('bcrypt');
const User = require('../models/User');
const DatabaseHandler = require('../config/db');

/**
 * Handle user login with local strategy.
 */
async function login(req, res) {
    try {
        const { username, password } = req.fields;
        const users = await DatabaseHandler.findDocument(User, {
            $or: [
                { username: username },
                { email: username }
            ]
        });

        if (!users || users.length === 0) {
            return res.render('login', { error: 'User not found' });
        }
        const user = users[0];
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            return res.render('login', { error: 'Invalid password' });
        }
        req.session.user = {
            id: user._id.toString(),
            name: user.username,
            type: 'local'
        };
        req.session.save((err) => {
            if (err) {
                return res.render('login', { error: 'Login failed' });
            }
            res.redirect('/content');
        });
    } catch (err) {
        res.render('login', { error: 'Login failed: ' + err.message });
    }
}

/**
 * Handle user registration.
 */
async function register(req, res) {
    try {
        const { username, email, password, confirm_password } = req.fields;
        if (password !== confirm_password) {
            return res.render('register', { error: 'Passwords do not match' });
        }
        const existingUser = await DatabaseHandler.findDocument(User, {
            $or: [
                { username: username },
                { email: email }
            ]
        });
        if (existingUser && existingUser.length > 0) {
            return res.render('register', { error: 'Username or email already exists' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        await DatabaseHandler.insertDocument(User, {
            username,
            email,
            password: hashedPassword,
            type: 'local',
            created_at: new Date()
        });
        res.render('login', { message: 'Registration successful! Please login.' });
    } catch (err) {
        res.render('register', { error: 'Registration failed' });
    }
}

module.exports = {
    login,
    register
};

