const mongoose = require('mongoose');

const budgetCategorySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Reference to the User model
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true,
        minlength: 3,
        maxlength: 50
    },
    // Add type so we can distinguish income vs expense categories
    type: {
        type: String,
        enum: ['income', 'expense'],
        required: true,
        default: 'expense'
    },
    budgetLimit: {
        type: Number,
        default: 0,
        min: 0 // Ensure budgetLimit is non-negative
    }
    
}, { timestamps: true }); // Automatically manage createdAt and updatedAt

// Explicitly specify the collection name as "budgetCategories"
const BudgetCategory = mongoose.model('BudgetCategory', budgetCategorySchema, 'budgetCategories');

module.exports = BudgetCategory;