const express = require('express');
const router = express.Router();
const passport = require('passport');
const { isLoggedIn } = require('../middleware/authMiddleware');
const authController = require('../controllers/authController');
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
    // start FB login (route will be /auth/facebook if router is mounted at '/auth')
    router.get('/facebook', passport.authenticate('facebook', { scope: ['email', 'public_profile'] }));

    // callback: authenticate, ensure session persisted, then redirect
    router.get('/facebook/callback',
      passport.authenticate('facebook', { failureRedirect: '/login?error=facebook_auth_failed' }),
      (req, res) => {
        // debug
        console.log('Facebook callback - user:', req.user ? req.user.id : null);
        // ensure session is saved to store before redirecting
        req.session.save(err => {
          if (err) console.error('Session save error after FB auth:', err);
          return res.redirect('/dashboard');
        });
      }
    );
} else {
    console.log('⚠️  Facebook OAuth not configured - missing environment variables');
}

// OAuth: Google
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
    router.get('/google/callback',
      passport.authenticate('google', { failureRedirect: '/login?error=google_auth_failed' }),
      (req, res) => {
        req.session.save(err => {
          if (err) console.error('Session save error after Google auth:', err);
          return res.redirect('/dashboard');
        });
      }
    );
} else {
    console.log('⚠️  Google OAuth not configured - missing environment variables');
}

// Profile page (protected) — pass query flags so template can show alerts
router.get('/profile', isLoggedIn, (req, res) => {
    res.render('profile', { user: req.user, updated: !!req.query.updated, error: req.query.error || null });
});

// Settings page (protected) — pass query flags so template can show alerts
router.get('/settings', isLoggedIn, (req, res) => {
    res.render('settings', { user: req.user, updated: !!req.query.updated, error: req.query.error || null });
});

// Handle profile update (supports form post and AJAX)
router.post('/update-profile', isLoggedIn, express.urlencoded({ extended: true }), authController.updateProfile);
router.post('/api/update-profile', isLoggedIn, express.json(), authController.updateProfile);

// Handle settings update (supports form post and AJAX)
router.post('/update-settings', isLoggedIn, express.urlencoded({ extended: true }), authController.updateSettings);
router.post('/api/update-settings', isLoggedIn, express.json(), authController.updateSettings);

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
    const providers = [];
    if (!req.user || (!req.user.googleId && !req.user.facebookId && req.user.type === 'local')) providers.push('local');
    if (req.user?.googleId) providers.push('google');
    if (req.user?.facebookId) providers.push('facebook');
    if (providers.length === 0) providers.push(req.user?.type || 'local');

    res.json({
        id: req.user.id,
        username: req.user.username,
        email: req.user.email,
        providers
    });
});

module.exports = router;