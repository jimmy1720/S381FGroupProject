const express = require('express');
const session = require('express-session');
const passport = require('passport');
const MongoDBStore = require('connect-mongodb-session')(session);
const dotenv = require('dotenv');
const morgan = require('morgan');
const path = require('path');
const connectDB = require('./config/db');
const logger = require('./utils/logger');

dotenv.config();
const app = express();

// Ensure PORT is defined
const PORT = process.env.PORT || 8099;

// Import OAuth strategies
const FacebookStrategy = require('passport-facebook').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('./models/User');

// Import routes and middleware
const authRoutes = require('./routes/authRoutes');
const { setupPassportSerialization, isLoggedIn, noCache } = require('./middleware/authMiddleware');

// Create session store with error handling and connection retry**
const createSessionStore = () => {
    const store = new MongoDBStore({
        uri: process.env.MONGODB_URI,
        collection: 'sessions',
        connectionOptions: {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            retryWrites: true,
            w: 'majority'
        }
    });

    store.on('error', function(error) {
        // Don't exit process, just log the error
        logger.error('Session store error:', error);     
    });

    store.on('connected', function() {
        logger.info('✅ Session store connected to MongoDB');
    });

    return store;
};

let sessionStore = createSessionStore();

// Middleware setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../client/views'));

app.use(morgan('dev'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
    secret: process.env.SESSION_SECRET || 'default_secret',
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 },
}));
app.use(passport.initialize());
app.use(passport.session());
app.use('/public', express.static(path.join(__dirname, '../client/public')));

// Apply cache control to protected routes
app.use('/dashboard', noCache);
app.use('/profile', noCache);
app.use('/settings', noCache);

// Create a simple memory store fallback for development
const createFallbackStore = () => {
    logger.warn('⚠️  Using memory session store (fallback)');
    return new session.MemoryStore();
};

// Facebook Strategy
if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
    logger.info('✅ Facebook OAuth configured');
    passport.use(new FacebookStrategy({
        clientID: process.env.FACEBOOK_APP_ID,
        clientSecret: process.env.FACEBOOK_APP_SECRET,
        callbackURL: process.env.FACEBOOK_CALLBACK_URL || "http://localhost:8099/auth/facebook/callback",
        profileFields: ['id', 'displayName', 'emails']
    }, async (accessToken, refreshToken, profile, done) => {
        try {
            let user = await User.findOne({ facebookId: profile.id });
            
            if (user) {
                return done(null, user);
            }
            
            // Check if user exists by email
            if (profile.emails && profile.emails[0].value) {
                user = await User.findOne({ email: profile.emails[0].value.toLowerCase() });
                if (user) {
                    user.facebookId = profile.id;
                    user.type = 'facebook';
                    await user.save();
                    return done(null, user);
                }
            }
            
            // Create new user
            let username = `fb_${profile.id}`;
            let counter = 1;
            while (await User.findOne({ username })) {
                username = `fb_${profile.id}_${counter}`;
                counter++;
            }
            
            user = new User({
                username: username,
                email: profile.emails ? profile.emails[0].value.toLowerCase() : null,
                facebookId: profile.id,
                displayName: profile.displayName,
                type: 'facebook'
            });
            
            await user.save();
            return done(null, user);
            
        } catch (err) {
            logger.error('Facebook OAuth error:', err);
            return done(err, null);
        }
    }));
} else {
    logger.warn('⚠️  Facebook OAuth not configured');
}

// Google Strategy
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    logger.info('✅ Google OAuth configured');
    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || "http://localhost:8099/auth/google/callback"
    }, async (accessToken, refreshToken, profile, done) => {
        try {
            let user = await User.findOne({ googleId: profile.id });
            
            if (user) {
                return done(null, user);
            }
            
            // Check if user exists by email
            if (profile.emails && profile.emails[0].value) {
                user = await User.findOne({ email: profile.emails[0].value.toLowerCase() });
                if (user) {
                    user.googleId = profile.id;
                    user.type = 'google';
                    await user.save();
                    return done(null, user);
                }
            }
            
            // Create new user
            let username = `google_${profile.id}`;
            let counter = 1;
            while (await User.findOne({ username })) {
                username = `google_${profile.id}_${counter}`;
                counter++;
            }
            
            user = new User({
                username: username,
                email: profile.emails ? profile.emails[0].value.toLowerCase() : null,
                googleId: profile.id,
                displayName: profile.displayName,
                type: 'google'
            });
            
            await user.save();
            return done(null, user);
            
        } catch (err) {
            logger.error('Google OAuth error:', err);
            return done(err, null);
        }
    }));
} else {
    logger.warn('⚠️  Google OAuth not configured');
}

// Passport Middleware Serialization
setupPassportSerialization(passport);

app.get('/', (req, res) => {
    res.render('index', { title: 'Home', user: req.user });
});

app.get('/dashboard', isLoggedIn, noCache, (req, res) => {
    res.render('dashboard', { user: req.user, pie_chart_x:[], pie_chart_y:[], line_graph_x:[], line_graph_y:[] });
});

// Register routes
// Mount auth routes at both root and /auth to preserve existing template paths
app.use('/', authRoutes);      
app.use('/auth', authRoutes);  

const apiRoutes = require('./routes/apiRoutes');
app.use('/api', apiRoutes);

// Add public APIs (no authentication required)
const PublicApiRoutes = require('./routes/PublicApiRoutes');
app.use('/public/api', PublicApiRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).render('404', { title: 'Page Not Found' });
});

// Global error handler
app.use((err, req, res, next) => {
    logger.error('Global error handler:', err);
    res.status(500).render('error', { error: 'Something went wrong!' });
});

// Connect to DB and start server
const startServer = async () => {
    try {
        logger.info('🔗 Attempting to connect to MongoDB...');
        await connectDB();
        logger.info('✅ Database connected successfully');
        
        app.listen(PORT, () => {
            logger.info(`🚀 Server is running on http://localhost:${PORT}`);
        });
    } catch (error) {
        logger.error('❌ Failed to start server:', error);
        logger.warn('💡 Using memory session store for development');
        // Fallback to memory store if MongoDB fails
        sessionStore = createFallbackStore();
        
        app.listen(PORT, () => {
            logger.info(`🚀 Server is running on http://localhost:${PORT} (with memory sessions)`);
        });
    }
};

startServer();