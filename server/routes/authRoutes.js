// authRoutes.js

const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const User = require('../models/User');
const dotenv = require('dotenv');
const { DatabaseHandler } = require('../config/db');

dotenv.config();

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated() && req.session.user) {
        return next();
    }
    res.redirect('/login');
}

// Passport strategies config (config section)
const FacebookStrategy = require('passport-facebook').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;

const facebookAuth = {
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: process.env.FACEBOOK_CALLBACK_URL
};

const googleAuth = {
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL
};

module.exports = function(app, passport) {
    passport.use(new FacebookStrategy(facebookAuth, (token, refreshToken, profile, done) => {
        const user = {
            id: profile.id,
            name: profile.displayName,
            type: profile.provider
        };
        return done(null, user);
    }));

    passport.use(new GoogleStrategy(googleAuth, (token, refreshToken, profile, done) => {
        const user = {
            id: profile.id,
            name: profile.displayName,
            type: profile.provider
        };
        return done(null, user);
    }));

    passport.serializeUser((user, done) => {
        done(null, user);
    });

    passport.deserializeUser((user, done) => {
        done(null, user);
    });

    // Login page
    app.get("/login", (req, res) => {
        res.render("login");
    });

    // Register page
    app.get("/register", (req, res) => {
        res.render("register");
    });

    // Login logic
    app.post('/login', async (req, res) => {
        try {
            const { username, password } = req.fields; // Assuming express-formidable is used
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
                res.redirect('/dashboard'); // Redirect to dashboard after login
            });
        } catch (err) {
            console.error('Login error:', err);
            res.render('login', { error: 'Login failed: ' + err.message });
        }
    });

    // Register logic
    app.post('/register', async (req, res) => {
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
                type: 'local', // Ensure consistent user type
                created_at: new Date()
            });
            res.render('login', { message: 'Registration successful! Please login.' });
        } catch (err) {
            console.error('Registration error:', err);
            res.render('register', { error: 'Registration failed: ' + err.message });
        }
    });

    // OAuth: Facebook
    app.get("/auth/facebook", passport.authenticate("facebook", { scope: "email", session: true }));
    app.get("/auth/facebook/callback", passport.authenticate("facebook", {
        successRedirect: "/dashboard", // Redirect to dashboard after successful login
        failureRedirect: "/login"
    }));

    // OAuth: Google
    app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'], session: true }));
    app.get('/auth/google/callback', passport.authenticate('google', {
        successRedirect: '/dashboard', // Redirect to dashboard after successful login
        failureRedirect: '/login'
    }));

    // Logout route
    app.get("/logout", (req, res, next) => {
        req.logout((err) => {
            if (err) { return next(err); }
            res.redirect('/login');
        });
    });

    // User Info
    app.get('/user/info', isLoggedIn, (req, res) => {
        res.json({
            id: req.user.id,
            name: req.user.name,
            type: req.user.type
        });
    });
};