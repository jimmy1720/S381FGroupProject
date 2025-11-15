// models/Budget.js
const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Reference to the User model
        required: true
    },
    categoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'BudgetCategory', // Reference to the category this budget applies to
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0 // Budget amount must be non-negative
    },
    period: {
        type: String,
        enum: ['monthly', 'yearly'], // Budget resets monthly or yearly
        required: true
    },
    startDate: {
        type: Date,
        required: true // When this budget period begins
    }
}, { timestamps: true }); // Automatically manage createdAt and updatedAt

// Explicitly specify the collection name as "budgets"
const Budget = mongoose.model('Budget', budgetSchema, 'budgets');
module.exports = Budget;
