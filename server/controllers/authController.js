const User = require('../models/User');
const bcrypt = require('bcrypt');

/**
 * Handle user login with local strategy.
 */
async function login(req, res) {
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.render('login', { 
                error: 'Username and password are required',
                message: null,
                showFacebook: !!process.env.FACEBOOK_APP_ID,
                showGoogle: !!process.env.GOOGLE_CLIENT_ID
            });
        }

        const user = await User.findOne({
            $or: [
                { username: username.toLowerCase() },
                { email: username.toLowerCase() }
            ]
        });

        if (!user) {
            return res.render('login', { 
                error: 'Invalid username or password',
                message: null,
                showFacebook: !!process.env.FACEBOOK_APP_ID,
                showGoogle: !!process.env.GOOGLE_CLIENT_ID
            });
        }

        // For OAuth users without passwords
        if (user.type !== 'local') {
            return res.render('login', { 
                error: 'This account was created with social login. Please use the social login option.',
                message: null,
                showFacebook: !!process.env.FACEBOOK_APP_ID,
                showGoogle: !!process.env.GOOGLE_CLIENT_ID
            });
        }

        const isValid = await user.comparePassword(password);
        if (!isValid) {
            return res.render('login', { 
                error: 'Invalid username or password',
                message: null,
                showFacebook: !!process.env.FACEBOOK_APP_ID,
                showGoogle: !!process.env.GOOGLE_CLIENT_ID
            });
        }

        req.login(user, (err) => {
            if (err) {
                console.error('Login error:', err);
                return res.render('login', { 
                    error: 'Login failed. Please try again.',
                    message: null,
                    showFacebook: !!process.env.FACEBOOK_APP_ID,
                    showGoogle: !!process.env.GOOGLE_CLIENT_ID
                });
            }
            return res.redirect('/dashboard');
        });
    } catch (err) {
        console.error('Login error:', err);
        res.render('login', { 
            error: 'Login failed. Please try again.',
            message: null,
            showFacebook: !!process.env.FACEBOOK_APP_ID,
            showGoogle: !!process.env.GOOGLE_CLIENT_ID
        });
    }
}

/**
 * Handle user registration.
 */
async function register(req, res) {
    try {
        const { username, email, password, confirm_password } = req.body;
        
        // Validation
        if (!username || !email || !password || !confirm_password) {
            return res.render('register', { 
                error: 'All fields are required',
                message: null,
                showFacebook: !!process.env.FACEBOOK_APP_ID,
                showGoogle: !!process.env.GOOGLE_CLIENT_ID
            });
        }

        if (password !== confirm_password) {
            return res.render('register', { 
                error: 'Passwords do not match',
                message: null,
                showFacebook: !!process.env.FACEBOOK_APP_ID,
                showGoogle: !!process.env.GOOGLE_CLIENT_ID
            });
        }

        if (password.length < 8) {
            return res.render('register', { 
                error: 'Password must be at least 8 characters long',
                message: null,
                showFacebook: !!process.env.FACEBOOK_APP_ID,
                showGoogle: !!process.env.GOOGLE_CLIENT_ID
            });
        }

        const existingUser = await User.findOne({
            $or: [
                { username: username.toLowerCase() },
                { email: email.toLowerCase() }
            ]
        });

        if (existingUser) {
            return res.render('register', { 
                error: 'Username or email already exists',
                message: null,
                showFacebook: !!process.env.FACEBOOK_APP_ID,
                showGoogle: !!process.env.GOOGLE_CLIENT_ID
            });
        }

        const newUser = new User({
            username: username.toLowerCase(),
            email: email.toLowerCase(),
            password: password,
            type: 'local'
        });

        await newUser.save();
        
        res.render('login', { 
            error: null,
            message: 'Registration successful! Please login.',
            showFacebook: !!process.env.FACEBOOK_APP_ID,
            showGoogle: !!process.env.GOOGLE_CLIENT_ID
        });
    } catch (err) {
        console.error('Registration error:', err);
        res.render('register', { 
            error: 'Registration failed: ' + err.message,
            message: null,
            showFacebook: !!process.env.FACEBOOK_APP_ID,
            showGoogle: !!process.env.GOOGLE_CLIENT_ID
        });
    }
}

// Update profile (displayName, email). Returns JSON when AJAX, otherwise redirects with query flag.
async function updateProfile(req, res) {
    try {
        const userId = req.user && req.user._id;
        if (!userId) return res.redirect('/login');

        const { displayName, email } = req.body || {};
        const updates = {};
        if (typeof displayName !== 'undefined') updates.displayName = String(displayName).trim();
        if (typeof email !== 'undefined') updates.email = email ? String(email).trim().toLowerCase() : undefined;

        if (updates.email) {
            const existing = await User.findOne({ email: updates.email, _id: { $ne: userId } });
            if (existing) {
                if (req.xhr || req.headers.accept?.includes('application/json')) {
                    return res.status(400).json({ ok: false, error: 'Email already in use' });
                }
                return res.redirect('/profile?error=email_in_use');
            }
        }

        const user = await User.findByIdAndUpdate(userId, updates, { new: true, runValidators: true });
        // refresh session user if passport present
        if (req.login && typeof req.login === 'function') {
            req.login(user, err => {
                if (err) console.error('Re-login error after profile update', err);
                if (req.xhr || req.headers.accept?.includes('application/json')) return res.json({ ok: true, user });
                return res.redirect('/profile?updated=1');
            });
        } else {
            if (req.xhr || req.headers.accept?.includes('application/json')) return res.json({ ok: true, user });
            return res.redirect('/profile?updated=1');
        }
    } catch (err) {
        console.error('updateProfile error', err);
        if (req.xhr || req.headers.accept?.includes('application/json')) return res.status(500).json({ ok: false, error: 'Failed to update profile' });
        return res.redirect('/profile?error=server');
    }
}

// Update settings (prefs). Accepts form post or JSON/AJAX. Returns JSON when AJAX.
async function updateSettings(req, res) {
    try {
        const userId = req.user && req.user._id;
        if (!userId) return res.redirect('/login');

        // Accept both form fields and JSON
        const body = req.body || {};
        // Normalize darkMode from checkbox or JSON boolean
        const darkMode = (body.darkMode === 'on' || body.darkMode === 'true' || body.darkMode === true) ? true : false;
        const prefs = { ...(req.user.prefs || {}), darkMode };

        const user = await User.findByIdAndUpdate(userId, { prefs }, { new: true, runValidators: true });

        if (req.login && typeof req.login === 'function') {
            req.login(user, err => {
                if (err) console.error('Re-login error after settings update', err);
                if (req.xhr || req.headers.accept?.includes('application/json')) return res.json({ ok: true, prefs: user.prefs });
                return res.redirect('/settings?updated=1');
            });
        } else {
            if (req.xhr || req.headers.accept?.includes('application/json')) return res.json({ ok: true, prefs: user.prefs });
            return res.redirect('/settings?updated=1');
        }
    } catch (err) {
        console.error('updateSettings error', err);
        if (req.xhr || req.headers.accept?.includes('application/json')) return res.status(500).json({ ok: false, error: 'Failed to save settings' });
        return res.redirect('/settings?error=server');
    }
}

module.exports = {
    login,
    register,
    updateProfile,
    updateSettings
};