// authRoutes.js

const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const User = require('../models/User');
const session = require('express-session');
const dotenv = require('dotenv');
const { DatabaseHandler } = require('../config/db');

dotenv.config();

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated() || req.session || req.session.user) {
        return next();
    }
    res.redirect('/login');
}

module.exports = function(app, passport) {
    // Passport strategies config (config section)
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

    const FacebookStrategy = require('passport-facebook').Strategy;
    const GoogleStrategy = require('passport-google-oauth20').Strategy;

    passport.use(new FacebookStrategy(facebookAuth, function(token, refreshToken, profile, done) {
        const user = {
            id: profile.id,
            name: profile.displayName,
            type: profile.provider
        };
        return done(null, user);
    }));

    passport.use(new GoogleStrategy(googleAuth, function(token, refreshToken, profile, done) {
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
    app.get("/login", function(req, res) {
        res.render("login");
    });

    // Register page
    app.get("/register", function(req, res) {
        res.render("register");
    });

    // Login logic
    app.post('/login', async (req, res) => {
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
                type: 'local',
                created_at: new Date()
            });
            res.render('login', { message: 'Registration successful! Please login.' });
        } catch (err) {
            res.render('register', { error: 'Registration failed' });
        }
    });

    // OAuth: Facebook
    app.get("/auth/facebook", passport.authenticate("facebook", { scope: "email", session: true }));
    app.get("/auth/facebook/callback",
        passport.authenticate("facebook", {
            successRedirect: "/content",
            failureRedirect: "/"
        })
    );

    // OAuth: Google
    app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'], session: true }));
    app.get('/auth/google/callback',
        passport.authenticate('google', {
            successRedirect: '/content',
            failureRedirect: '/'
        })
    );

    // Logout route
    app.get("/logout", function(req, res, next) {
        req.logout(function(err) {
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

