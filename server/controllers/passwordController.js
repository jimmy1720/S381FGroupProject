const User = require('../models/User');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// Email configuration from environment variables
const EMAIL_CONFIG = {
    service: 'gmail',
    auth: { 
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_APP_PASSWORD 
    }
};

// Handle forgot password request
async function forgotPassword(req, res) {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        
        // Don't reveal if email exists (security best practice)
        if (!user) {
            return res.render('forgot-password', {
                error: null,
                message: 'If that email exists, a reset link has been sent.'
            });
        }

        // Generate secure random token
        const resetToken = crypto.randomBytes(32).toString('hex');
        user.resetToken = resetToken;
        user.resetTokenExpiry = Date.now() + 3600000; // 1 hour expiry
        await user.save();

        // Send reset email
        const transporter = nodemailer.createTransport(EMAIL_CONFIG);
        const resetUrl = `${process.env.BASE_URL}/auth/reset-password/${resetToken}`;
        
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Password Reset Request',
            html: `
                <h2>Password Reset</h2>
                <p>Click the link below to reset your password:</p>
                <a href="${resetUrl}">${resetUrl}</a>
                <p>This link expires in 1 hour.</p>
                <p>If you didn't request this, ignore this email.</p>
            `
        };

        await transporter.sendMail(mailOptions);
        
        res.render('forgot-password', {
            error: null,
            message: 'If that email exists, a reset link has been sent.'
        });
    } catch (err) {
        console.error('Forgot password error:', err);
        res.render('forgot-password', {
            error: 'An error occurred. Please try again.',
            message: null
        });
    }
}

// Handle password reset with token
async function resetPassword(req, res) {
    try {
        const { token, newPassword, confirmPassword } = req.body;
        
        // Check if passwords match
        if (newPassword !== confirmPassword) {
            return res.render('reset-password', {
                token,
                error: 'Passwords do not match',
                message: null
            });
        }

        // Find user with valid token
        const user = await User.findOne({ 
            resetToken: token, 
            resetTokenExpiry: { $gt: Date.now() } // Token not expired
        });

        if (!user) {
            return res.render('reset-password', {
                token,
                error: 'Invalid or expired reset link',
                message: null
            });
        }

        // Update password (will be hashed by pre-save hook)
        user.password = newPassword;
        user.resetToken = undefined;
        user.resetTokenExpiry = undefined;
        await user.save();

        // Redirect to login with success message
        res.render('login', {
            error: null,
            message: 'Password reset successful! Please login.',
            showFacebook: !!process.env.FACEBOOK_APP_ID,
            showGoogle: !!process.env.GOOGLE_CLIENT_ID
        });
    } catch (err) {
        console.error('Reset password error:', err);
        res.render('reset-password', {
            token: req.body.token,
            error: 'Password reset failed. Please try again.',
            message: null
        });
    }
}

module.exports = { forgotPassword, resetPassword };


