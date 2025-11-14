const express = require('express');
const session = require('express-session');
const passport = require('passport');
const MongoDBStore = require('connect-mongodb-session')(session);
const connectDB = require('./config/db');
const dotenv = require('dotenv');
const morgan = require('morgan');
const path = require('path');

const { isLoggedIn, setupPassportSerialization } = require('./middleware/authMiddleware');
const User = require('./models/User');
const FacebookStrategy = require('passport-facebook').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;

// Load environment variables from root .env file
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const app = express();
const PORT = process.env.PORT || 8099;

// **FIX: Create session store with error handling and connection retry**
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
        console.error('Session store error:', error);
        // Don't exit process, just log the error
        // The store will retry when connections are made
    });

    store.on('connected', function() {
        console.log('✅ Session store connected to MongoDB');
    });

    return store;
};

const store = createSessionStore();

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
    store: store,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 },
}));
app.use(passport.initialize());
app.use(passport.session());
app.use('/public', express.static(path.join(__dirname, '../client/public')));

// **FIX: Add a simple memory store fallback for development**
const createFallbackStore = () => {
    console.log('⚠️  Using memory session store (fallback)');
    return new session.MemoryStore();
};

// Use memory store if MongoDB connection fails initially
let sessionStore = store;

// Facebook Strategy
if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
    console.log('✅ Facebook OAuth configured');
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
            console.error('Facebook OAuth error:', err);
            return done(err, null);
        }
    }));
} else {
    console.log('⚠️  Facebook OAuth not configured');
}

// Google Strategy
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    console.log('✅ Google OAuth configured');
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
            console.error('Google OAuth error:', err);
            return done(err, null);
        }
    }));
} else {
    console.log('⚠️  Google OAuth not configured');
}

// Passport Middleware Serialization
setupPassportSerialization(passport);

// Import routes
const authRoutes = require('./routes/authRoutes');
app.use('/', authRoutes);

// Routes
app.get('/', (req, res) => {
    res.render('index', { title: 'Home', user: req.user });
});

app.get('/dashboard', isLoggedIn, (req, res) => {
    res.render('dashboard', { user: req.user, pie_chart_x:[], pie_chart_y:[], line_graph_x:[], line_graph_y:[] });
});

// 404 handler
app.use((req, res) => {
    res.status(404).render('404', { title: 'Page Not Found' });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Global error handler:', err);
    res.status(500).render('error', { error: 'Something went wrong!' });
});

// Connect to DB and start server
const startServer = async () => {
    try {
        console.log('🔗 Attempting to connect to MongoDB...');
        await connectDB();
        console.log('✅ Database connected successfully');
        
        // Once DB is connected, the session store should work
        // If you want to verify session store connection, you can add a check here
        
        app.listen(PORT, () => {
            console.log(`🚀 Server is running on http://localhost:${PORT}`);
            console.log('💡 If you see session errors above, they should resolve now that DB is connected');
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        console.log('💡 Using memory session store for development');
        // Fallback to memory store if MongoDB fails
        sessionStore = createFallbackStore();
        
        app.listen(PORT, () => {
            console.log(`🚀 Server is running on http://localhost:${PORT} (with memory sessions)`);
        });
    }
};

startServer();