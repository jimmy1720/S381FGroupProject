// authRoutes.js

const express = require('express');
const router = express.Router();
const User = require('../models/User');
const dotenv = require('dotenv');
const { isLoggedIn } = require('../middleware/authMiddleware'); // Import the isLoggedIn function

dotenv.config();

<<<<<<< Updated upstream
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated() && req.session.user) {
        return next();
    }
    res.redirect('/login');
}

// Passport strategies config (config section)
const FacebookStrategy = require('passport-facebook').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;

=======
// Configure Passport strategies
const FacebookStrategy = require('passport-facebook').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;

>>>>>>> Stashed changes
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

<<<<<<< Updated upstream
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
=======
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

// Routes
router.get("/login", (req, res) => {
    res.render("login");
});

router.get("/register", (req, res) => {
    res.render("register");
});

// Login logic
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body; // Use req.body for form data
        const user = await User.findOne({
            $or: [{ username }, { email: username }]
        });

        if (!user) {
            return res.render('login', { error: 'User not found' });
        }

        const isValid = await user.comparePassword(password); // Use the model method
        if (!isValid) {
            return res.render('login', { error: 'Invalid password' });
        }

        req.session.user = {
            id: user._id.toString(),
            name: user.username,
            type: user.type
        };

        req.session.save(err => {
            if (err) {
                console.error('Session save error:', err); // Log the error
                return res.render('login', { error: 'Login failed' });
            }
            res.redirect('/content');
        });
    } catch (err) {
        console.error('Login error:', err); // Log the error
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
            $or: [{ username }, { email }]
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

        await newUser.save(); // Hashing will be done in the model's pre-save hook
        res.render('login', { message: 'Registration successful! Please login.' });
    } catch (err) {
        console.error('Registration error:', err); // Log the error
        res.render('register', { error: 'Registration failed: ' + err.message });
    }
});

// OAuth routes
router.get("/auth/facebook", passport.authenticate("facebook", { scope: "email", session: true }));
router.get("/auth/facebook/callback", passport.authenticate("facebook", {
    successRedirect: "/content",
    failureRedirect: "/"
}));

router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'], session: true }));
router.get('/auth/google/callback', passport.authenticate('google', {
    successRedirect: '/content',
    failureRedirect: '/'
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
>>>>>>> Stashed changes
