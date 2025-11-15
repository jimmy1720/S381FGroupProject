const express = require('express');
const router = express.Router();
const passport = require('passport');
const { isLoggedIn } = require('../middleware/authMiddleware');
const authController = require('../controllers/authController');
const passwordController = require('../controllers/passwordController');
const passwordController = require('../controllers/passwordController');


// Render login page
router.get("/login", (req, res) => {
    res.render("login", { 
        error: null, 
        message: null,
        showFacebook: !!process.env.FACEBOOK_APP_ID,
        showGoogle: !!process.env.GOOGLE_CLIENT_ID
    });
});

// Render forgot password page
router.get('/forgot-password', (req, res) => {
    res.render('forgot-password', {
        error: null,
        message: null
    });
});

// Render reset password page (accessed via email link with token)
router.get('/reset-password/:token', (req, res) => {
    res.render('reset-password', {
        token: req.params.token,
        error: null,
        message: null
    });
});

// Render register page
router.get("/register", (req, res) => {
    res.render("register", { 
        error: null, 
        message: null,
        showFacebook: !!process.env.FACEBOOK_APP_ID,
        showGoogle: !!process.env.GOOGLE_CLIENT_ID
    });
});

// Handle login
router.post('/login', authController.login);

// Handle registration
router.post('/register', authController.register);

// Handle forgot password form submission
router.post('/forgot-password', passwordController.forgotPassword);

// Handle reset password form submission
router.post('/reset-password', passwordController.resetPassword);

// OAuth: Facebook
if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
    router.get("/auth/facebook", passport.authenticate("facebook", { scope: ["email", "public_profile"] }));
    router.get("/auth/facebook/callback", passport.authenticate("facebook", {
        successRedirect: "/dashboard",
        failureRedirect: "/login?error=facebook_auth_failed"
    }));
} else {
    console.log('⚠️  Facebook OAuth not configured - missing environment variables');
}

// OAuth: Google
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    router.get('/auth/google', passport.authenticate('google', { 
        scope: ['profile', 'email'] 
    }));
    router.get('/auth/google/callback', passport.authenticate('google', {
        successRedirect: '/dashboard',
        failureRedirect: '/login?error=google_auth_failed'
    }));
} else {
    console.log('⚠️  Google OAuth not configured - missing environment variables');
}

// Logout route
router.get("/logout", (req, res, next) => {
    req.logout((err) => {
        if (err) { 
            return next(err); 
        }
        res.redirect('/login');
    });
});

// User Info
router.get('/user/info', isLoggedIn, (req, res) => {
    res.json({
        id: req.user.id,
        name: req.user.username,
        email: req.user.email,
        type: req.user.type
    });
});

module.exports = router;