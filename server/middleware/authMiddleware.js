// authMiddleware.js

const User = require('../models/User'); // Import the User model (adjust the path as needed)

/**
 * Middleware to check if the user is logged in, either via Passport or session.
 * Redirects to /login if the user is not authenticated.
 */
function isLoggedIn(req, res, next) {
    // Check if the user is authenticated via Passport
    if (req.isAuthenticated && req.isAuthenticated()) {
        return next();
    }

    // Check if the user session exists
    if (req.session && req.session.user) {
        return next();
    }

    // Log unauthorized access attempt and redirect to login
    console.warn('Unauthorized access attempt. Redirecting to login.');
    res.redirect('/login');
}

/**
 * Passport serialization and deserialization helpers.
 * These methods determine how user data is stored in and retrieved from the session.
 */
function setupPassportSerialization(passport) {
    // Serialize user: Store only the user ID in the session
    passport.serializeUser((user, done) => {
        done(null, user._id); // Store only the user ID
    });

    // Deserialize user: Retrieve the full user object from the database
    passport.deserializeUser(async (id, done) => {
        try {
            const user = await User.findById(id);
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