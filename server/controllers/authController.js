// authController.js

const User = require('../models/User');

/**
 * Handle user login with local strategy.
 */
async function login(req, res) {
    try {
        const { username, password } = req.body; // Use req.body for form data
        const user = await User.findOne({
            $or: [
                { username: username.toLowerCase() }, // Normalize username
                { email: username.toLowerCase() } // Normalize email
            ]
        });

        if (!user) {
            return res.render('login', { error: 'User not found' });
        }

<<<<<<< Updated upstream
        const user = users[0];
        const isValid = await bcrypt.compare(password, user.password);
=======
        const isValid = await user.comparePassword(password); // Use the method from the user model
>>>>>>> Stashed changes
        if (!isValid) {
            return res.render('login', { error: 'Invalid password' });
        }

<<<<<<< Updated upstream
        // Store user session information
=======
>>>>>>> Stashed changes
        req.session.user = {
            id: user._id.toString(),
            name: user.username,
            type: user.type
        };

<<<<<<< Updated upstream
        req.session.save((err) => {
            if (err) {
                console.error('Session save error:', err); // Log error for debugging
                return res.render('login', { error: 'Login failed. Please try again.' });
            }
            res.redirect('/dashboard'); // Redirect to dashboard after successful login
        });
    } catch (err) {
        console.error('Login error:', err); // Log error for debugging
=======
        req.session.save(err => {
            if (err) {
                console.error('Session save error:', err); // Log the error
                return res.render('login', { error: 'Login failed' });
            }
            res.redirect('/das');
        });
    } catch (err) {
        console.error('Login error:', err); // Log the error
>>>>>>> Stashed changes
        res.render('login', { error: 'Login failed: ' + err.message });
    }
}

/**
 * Handle user registration.
 */
async function register(req, res) {
    try {
<<<<<<< Updated upstream
        const { username, email, password, confirm_password } = req.fields;

=======
        const { username, email, password, confirm_password } = req.body; // Use req.body for form data
>>>>>>> Stashed changes
        if (password !== confirm_password) {
            return res.render('register', { error: 'Passwords do not match' });
        }

<<<<<<< Updated upstream
        const existingUser = await DatabaseHandler.findDocument(User, {
=======
        const existingUser = await User.findOne({
>>>>>>> Stashed changes
            $or: [
                { username: username.toLowerCase() }, // Normalize username
                { email: email.toLowerCase() } // Normalize email
            ]
        });

<<<<<<< Updated upstream
        if (existingUser && existingUser.length > 0) {
            return res.render('register', { error: 'Username or email already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await DatabaseHandler.insertDocument(User, {
=======
        if (existingUser) {
            return res.render('register', { error: 'Username or email already exists' });
        }

        const newUser = new User({
>>>>>>> Stashed changes
            username,
            email,
            password, // Store the plain password; it will be hashed in the model
            type: 'local',
            created_at: new Date()
        });

<<<<<<< Updated upstream
        res.render('login', { message: 'Registration successful! Please login.' });
    } catch (err) {
        console.error('Registration error:', err); // Log error for debugging
=======
        await newUser.save(); // Hashing will be done in the model's pre-save hook
        res.render('login', { message: 'Registration successful! Please login.' });
    } catch (err) {
        console.error('Registration error:', err); // Log the error
>>>>>>> Stashed changes
        res.render('register', { error: 'Registration failed: ' + err.message });
    }
}

module.exports = {
    login,
    register
};