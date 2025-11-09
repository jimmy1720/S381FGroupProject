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
    budgetLimit: {
        type: Number,
        default: 0 // Default to 0 if no limit is set
    },
    created_at: {
        type: Date,
        default: Date.now
    }
});

// Explicitly specify the collection name as "budgetCategories"
const BudgetCategory = mongoose.model('BudgetCategory', budgetCategorySchema, 'budgetCategories');

module.exports = BudgetCategory;