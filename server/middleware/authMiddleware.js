// authMiddleware.js

const User = require('../models/userModel'); // Import the User model

/**
 * Middleware to check if the user is logged in, either via Passport or session.
 * Redirects to /login if the user is not authenticated.
 */
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated && req.isAuthenticated()) {
        return next();
    }

    if (req.session && req.session.user) {
        return next();
    }

<<<<<<< Updated upstream
    // Log unauthorized access attempt and redirect to login
    console.warn('Unauthorized access attempt. Redirecting to login.');
=======
    console.log(`Unauthorized access attempt by ${req.ip}. Redirecting to login.`);
>>>>>>> Stashed changes
    res.redirect('/login');
}

/**
 * Passport serialization and deserialization helpers.
 */
function setupPassportSerialization(passport) {
    passport.serializeUser((user, done) => {
        done(null, user._id); // Store only the user ID
    });

<<<<<<< Updated upstream
    // Deserialize user: Retrieve the full user object from the database
    passport.deserializeUser(async (id, done) => {
        try {
            const user = await User.findById(id);
=======
    passport.deserializeUser((id, done) => {
        User.findById(id, (err, user) => {
            if (err) {
                return done(err);
            }
>>>>>>> Stashed changes
            done(null, user);
        } catch (err) {
            console.error('Error fetching user for deserialization:', err);
            done(err);
        }
    });
}

module.exports = {
    isLoggedIn,
    setupPassportSerialization
};