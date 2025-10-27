// authMiddleware.js

/**
 * Middleware to check if user is logged in, either via Passport or session.
 */
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated && req.isAuthenticated()) {
        return next();
    }
    if (req.session && req.session.user) {
        return next();
    }
    res.redirect('/login');
}

/**
 * Passport serialization and deserialization helpers.
 * Call these from your Passport setup in your server entry point.
 */
function setupPassportSerialization(passport) {
    passport.serializeUser((user, done) => {
        done(null, user);
    });

    passport.deserializeUser((user, done) => {
        done(null, user);
    });
}

module.exports = {
    isLoggedIn,
    setupPassportSerialization
};
