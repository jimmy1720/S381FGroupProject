// app.js

const express = require('express');
const session = require('express-session');
const passport = require('passport');
const formidable = require('express-formidable');
const dotenv = require('dotenv');

const { isLoggedIn, setupPassportSerialization } = require('./server/middleware/authMiddleware');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8099;

// Middleware setup
app.set('view engine', 'ejs');
app.set('views', './client/views');

app.use(session({
    secret: 'COMPS381F_GROUPPROJECT',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }
}));

app.use(passport.initialize());
app.use(passport.session());

app.use('/public', express.static('public'));

// Passport Middleware Serialization
setupPassportSerialization(passport);

// Load Auth Routes (handles auth logic and registration/login)
require('./authRoutes')(app, passport);

// Load other routes (audio management, etc.)
// require('./audioRoutes')(app, isLoggedIn);

// Example home redirect
app.get('/', isLoggedIn, (req, res) => {
    res.redirect('/content');
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
