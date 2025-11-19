const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    categoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'BudgetCategory',
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    period: {
        type: String,
        enum: ['monthly', 'yearly'],
        required: true
    },
    startDate: {
        type: Date,
        required: true
    }
}, { timestamps: true });

const Budget = mongoose.model('Budget', budgetSchema, 'budgets');
module.exports = Budget;
