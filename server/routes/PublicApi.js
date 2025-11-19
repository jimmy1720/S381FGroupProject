const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const BudgetCategory = require('../models/BudgetCategory');

// GET - Read all transactions
router.get('/transactions', async (req, res) => {
    try {
        const transactions = await Transaction.find()
            .populate('categoryId', 'name')
            .limit(10)
            .sort({ date: -1 });
        
        res.json({ transactions });
    } catch (err) {
        res.status(500).json({ error: 'Failed to get transactions' });
    }
});

// POST - Create new transaction
router.post('/transactions', async (req, res) => {
    try {
        const { amount, type, categoryName, description } = req.body;
        
        // Find or create category
        let category = await BudgetCategory.findOne({ name: categoryName });
        if (!category) {
            category = new BudgetCategory({
                name: categoryName,
                type: type || 'expense'
            });
            await category.save();
        }

        const transaction = new Transaction({
            categoryId: category._id,
            amount: parseFloat(amount),
            type: type || 'expense',
            description: description || 'New transaction',
            date: new Date()
        });

        await transaction.save();
        res.json({ success: true, transaction });
    } catch (err) {
        res.status(500).json({ error: 'Failed to create transaction' });
    }
});

// PUT - Update transaction
router.put('/transactions/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const transaction = await Transaction.findByIdAndUpdate(
            id,
            req.body,
            { new: true }
        );

        if (!transaction) {
            return res.status(404).json({ error: 'Transaction not found' });
        }

        res.json({ success: true, transaction });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update transaction' });
    }
});

// DELETE - Delete transaction
router.delete('/transactions/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const transaction = await Transaction.findByIdAndDelete(id);

        if (!transaction) {
            return res.status(404).json({ error: 'Transaction not found' });
        }

        res.json({ success: true, message: 'Transaction deleted' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete transaction' });
    }
});

module.exports = router;