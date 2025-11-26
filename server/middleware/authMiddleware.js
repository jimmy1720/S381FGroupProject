const User = require('../models/User');

// Check if user is logged in
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/login');
}

// Check if user is not logged in (for login/register pages)
function isNotLoggedIn(req, res, next) {
    if (!req.isAuthenticated()) {
        return next();
    }
    res.redirect('/dashboard');
}

// Cache control middleware for protected pages
function noCache(req, res, next) {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    next();
}

// Passport serialization/deserialization
function setupPassportSerialization(passport) {
    passport.serializeUser((user, done) => {
        done(null, user.id);
    });

    passport.deserializeUser(async (id, done) => {
        try {
            const user = await User.findById(id);
            done(null, user);
        } catch (err) {
            done(err, null);
        }
    });
}

module.exports = {
    isLoggedIn,
    isNotLoggedIn,
    setupPassportSerialization,
    noCache
};