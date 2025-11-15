const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Reference to the User model
        required: true
    },
    categoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'BudgetCategory', // Reference to the BudgetCategory model
        required: true
    },
    type: {
        type: String,
        enum: ['income', 'expense'], // Restrict to "income" or "expense"
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0 // Ensure the amount is non-negative
    },
    description: {
        type: String,
        trim: true,
        maxlength: 255 // Optional description of the transaction
    },
    date: {
        type: Date,
        default: Date.now, // Transaction date
        required: true
    }
}, { timestamps: true }); // Automatically manage createdAt and updatedAt

// Explicitly specify the collection name as "transactions"
const Transaction = mongoose.model('Transaction', transactionSchema, 'transactions');

module.exports = Transaction;