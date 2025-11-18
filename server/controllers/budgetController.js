const Budget = require('../models/Budget.JS'); // fixed filename
const BudgetCategory = require('../models/BudgetCategory');

// Create new budget
async function createBudget(req, res) {
    try {
        const { categoryId, amount, period, startDate } = req.body;
        
        // Validate required fields
        if (!categoryId || !amount || !period || !startDate) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        if (amount <= 0) {
            return res.status(400).json({ error: 'Budget amount must be positive' });
        }

        // Verify category exists and belongs to user
        const category = await BudgetCategory.findOne({ 
            _id: categoryId, 
            userId: req.user.id 
        });

        if (!category) {
            return res.status(404).json({ error: 'Category not found' });
        }

        const budget = new Budget({
            userId: req.user.id,
            categoryId,
            amount,
            period,
            startDate: new Date(startDate)
        });

        await budget.save();
        res.status(201).json({ budgetId: budget._id });
    } catch (err) {
        console.error('Create budget error:', err);
        res.status(500).json({ error: 'Failed to create budget' });
    }
}

// Get all budgets for current user
async function getBudgets(req, res) {
    try {
        const budgets = await Budget.find({ userId: req.user.id })
            .populate('categoryId', 'name type'); // Include category details
        res.json(budgets);
    } catch (err) {
        console.error('Get budgets error:', err);
        res.status(500).json({ error: 'Failed to fetch budgets' });
    }
}

// Update budget
async function updateBudget(req, res) {
    try {
        const { id } = req.params;
        const updates = req.body;

        if (updates.amount && updates.amount <= 0) {
            return res.status(400).json({ error: 'Budget amount must be positive' });
        }

        const budget = await Budget.findOneAndUpdate(
            { _id: id, userId: req.user.id },
            updates,
            { new: true, runValidators: true }
        );

        if (!budget) {
            return res.status(404).json({ error: 'Budget not found' });
        }
        res.json(budget);
    } catch (err) {
        console.error('Update budget error:', err);
        res.status(500).json({ error: 'Failed to update budget' });
    }
}

// Delete budget
async function deleteBudget(req, res) {
    try {
        const { id } = req.params;
        const budget = await Budget.findOneAndDelete({ 
            _id: id, 
            userId: req.user.id 
        });

        if (!budget) {
            return res.status(404).json({ error: 'Budget not found' });
        }
        res.status(204).send();
    } catch (err) {
        console.error('Delete budget error:', err);
        res.status(500).json({ error: 'Failed to delete budget' });
    }
}

module.exports = { 
    createBudget, 
    getBudgets, 
    updateBudget, 
    deleteBudget 
};
