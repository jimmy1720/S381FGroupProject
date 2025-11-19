const BudgetCategory = require('../models/BudgetCategory');
const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');

// Create new category
async function createCategory(req, res) {
    try {
        const { name, type, budgetLimit } = req.body;
        
        // Validate required fields
        if (!name || !type) {
            return res.status(400).json({ error: 'Name and type are required' });
        }

        const category = new BudgetCategory({ 
            userId: req.user.id, 
            name, 
            type,
            budgetLimit: budgetLimit ? Number(budgetLimit) : 0
        });
        await category.save();
        
        // return full category so client has limit and id
        res.status(201).json({ category });
    } catch (err) {
        console.error('Create category error:', err);
        res.status(500).json({ error: 'Failed to create category' });
    }
}

// Get all categories for current user
async function getCategories(req, res) {
    try {
        // Support optional kind/type filter (e.g. ?kind=income)
        const { kind } = req.query;
        const q = { userId: req.user.id };
        if (kind && (kind === 'income' || kind === 'expense')) {
            q.type = kind;
        }
        const categories = await BudgetCategory.find(q);
        // return wrapped shape the client expects
        res.json({ categories });
    } catch (err) {
        console.error('Get categories error:', err);
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
}

// Update category name and/or budgetLimit
async function updateCategory(req, res) {
    try {
        const { id } = req.params;
        const { name, budgetLimit } = req.body;

        const updates = {};
        if (typeof name !== 'undefined') updates.name = name;
        if (typeof budgetLimit !== 'undefined') updates.budgetLimit = Number(budgetLimit);

        // Ensure user owns this category
        const category = await BudgetCategory.findOneAndUpdate(
            { _id: id, userId: req.user.id },
            updates,
            { new: true, runValidators: true }
        );

        if (!category) {
            return res.status(404).json({ error: 'Category not found' });
        }
        res.json(category);
    } catch (err) {
        console.error('Update category error:', err);
        res.status(500).json({ error: 'Failed to update category' });
    }
}

// Delete category (only if not in use)
async function deleteCategory(req, res) {
    try {
        const { id } = req.params;

        // Check if category is linked to transactions or budgets
        const hasTransactions = await Transaction.findOne({ categoryId: id });
        const hasBudgets = await Budget.findOne({ categoryId: id });

        if (hasTransactions || hasBudgets) {
            return res.status(400).json({ 
                error: 'Cannot delete category in use by transactions or budgets' 
            });
        }

        const category = await BudgetCategory.findOneAndDelete({ 
            _id: id, 
            userId: req.user.id 
        });

        if (!category) {
            return res.status(404).json({ error: 'Category not found' });
        }
        
        res.status(204).send(); // No content on successful delete
    } catch (err) {
        console.error('Delete category error:', err);
        res.status(500).json({ error: 'Failed to delete category' });
    }
}

module.exports = { 
    createCategory, 
    getCategories, 
    updateCategory, 
    deleteCategory 
};
