// authRoutes.js

const express = require('express');
const router = express.Router();
const User = require('../models/User');
const dotenv = require('dotenv');
const { isLoggedIn } = require('../middleware/authMiddleware');
const passport = require('passport'); // Ensure passport is imported

dotenv.config();

// Configure Passport strategies
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

// Passport strategies
passport.use(new FacebookStrategy(facebookAuth, (token, refreshToken, profile, done) => {
    // Logic to find or create a user in your database
    return done(null, { id: profile.id, name: profile.displayName, type: profile.provider });
}));

passport.use(new GoogleStrategy(googleAuth, (token, refreshToken, profile, done) => {
    // Logic to find or create a user in your database
    return done(null, { id: profile.id, name: profile.displayName, type: profile.provider });
}));

passport.serializeUser((user, done) => {
    done(null, user.id); // Store only the user ID
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user); // Pass user to req.user
    } catch (err) {
        done(err);
    }
});

// Login page
router.get("/login", (req, res) => {
    res.render("login");
});

// Register page
router.get("/register", (req, res) => {
    res.render("register");
});

// Login logic
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body; // Use req.body for form data
        const user = await User.findOne({
            $or: [{ username: username.toLowerCase() }, { email: username.toLowerCase() }]
        });

        if (!user) {
            return res.render('login', { error: 'User not found' });
        }

        const isValid = await user.comparePassword(password); // Ensure this method exists in the User model
        if (!isValid) {
            return res.render('login', { error: 'Invalid password' });
        }

        // Use Passport's login method
        req.login(user, (err) => {
            if (err) {
                console.error('Login error:', err);
                return res.render('login', { error: 'Login failed. Please try again.' });
            }
            res.redirect('/dashboard'); // Redirect to dashboard after successful login
        });
    } catch (err) {
        console.error('Login error:', err);
        res.render('login', { error: 'Login failed: ' + err.message });
    }
});

// Register logic
router.post('/register', async (req, res) => {
    try {
        const { username, email, password, confirm_password } = req.body; // Use req.body for form data
        if (password !== confirm_password) {
            return res.render('register', { error: 'Passwords do not match' });
        }

        const existingUser = await User.findOne({
            $or: [{ username: username.toLowerCase() }, { email: email.toLowerCase() }]
        });

        if (existingUser) {
            return res.render('register', { error: 'Username or email already exists' });
        }

        const newUser = new User({
            username,
            email,
            password, // Store the plain password; it will be hashed in the model
            type: 'local',
            created_at: new Date()
        });

        await newUser.save(); // The password will be hashed automatically
        res.render('login', { message: 'Registration successful! Please login.' });
    } catch (err) {
        console.error('Registration error:', err);
        res.render('register', { error: 'Registration failed: ' + err.message });
    }
});

// OAuth: Facebook
router.get("/auth/facebook", passport.authenticate("facebook", { scope: "email", session: true }));
router.get("/auth/facebook/callback", passport.authenticate("facebook", {
    successRedirect: "/dashboard",
    failureRedirect: "/login"
}));

// OAuth: Google
router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'], session: true }));
router.get('/auth/google/callback', passport.authenticate('google', {
    successRedirect: '/dashboard',
    failureRedirect: '/login'
}));

// Logout route
router.get("/logout", (req, res, next) => {
    req.logout(err => {
        if (err) { return next(err); }
        res.redirect('/login');
    });
});

// User Info
router.get('/user/info', isLoggedIn, (req, res) => {
    res.json({
        id: req.user.id,
        name: req.user.name,
        type: req.user.type
    });
});

module.exports = router;