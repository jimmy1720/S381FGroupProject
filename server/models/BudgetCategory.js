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
        default: 0,
        min: 0 // Ensure budgetLimit is non-negative
    },
    type: {
        type: String,
        enum: ['expense', 'income'], // Category type
        default: 'expense'
    }
}, { timestamps: true }); // Automatically manage createdAt and updatedAt

// Explicitly specify the collection name as "budgetCategories"
const BudgetCategory = mongoose.model('BudgetCategory', budgetCategorySchema, 'budgetCategories');

module.exports = BudgetCategory;