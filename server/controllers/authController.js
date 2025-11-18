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

module.exports = {
    login,
    register
};