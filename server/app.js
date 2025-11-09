const express = require('express');
const session = require('express-session');
const passport = require('passport');
const formidable = require('express-formidable');
const MongoDBStore = require('connect-mongodb-session')(session);
const connectDB = require('./config/db');
const dotenv = require('dotenv');
const morgan = require('morgan');


const { isLoggedIn, setupPassportSerialization } = require('./middleware/authMiddleware');


// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8099;

// Connect to MongoDB
connectDB();

// Set up MongoDB session store
const store = new MongoDBStore({
    uri: process.env.MONGODB_URI,
    collection: 'sessions',
});

store.on('error', (error) => {
    console.error('Session store error:', error);
});

// Middleware setup
app.set('view engine', 'ejs');
app.set('views', '../client/views');

app.use(morgan('dev')); // Logging middleware
app.use(session({
    secret: process.env.SESSION_SECRET || 'default_secret',
    resave: false,
    saveUninitialized: false,
    store: store,
    cookie: { secure: process.env.NODE_ENV === 'production', maxAge: 24 * 60 * 60 * 1000 },
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(formidable());
app.use('/public', express.static('../client/public'));

// Passport Middleware Serialization
setupPassportSerialization(passport);

// Load Auth Routes (handles auth logic and registration/login)
require('./authRoutes')(app, passport);

// Example home redirect
app.get('/', isLoggedIn, (req, res) => {
    res.redirect('/dashboard');
});

// 404 handler
app.use((req, res) => {
    res.status(404).render('404', { title: 'Page Not Found' });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Global error handler:', err);
    res.status(500).send('Something went wrong!');
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});


