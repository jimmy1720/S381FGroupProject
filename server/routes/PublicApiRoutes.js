const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const BudgetCategory = require('../models/BudgetCategory');
const mongoose = require('mongoose');

// CREATE - Fixed for both models
router.post('/transactions', async (req, res) => {
    try {
        const { amount, type, categoryName, description } = req.body;
        
        console.log('Creating transaction with:', req.body);

        // Create a demo category with demo userId
        const category = new BudgetCategory({
            name: categoryName,
            type: type || 'expense',
            userId: new mongoose.Types.ObjectId('000000000000000000000000') // Demo user
        });
        await category.save();

        // Create transaction with demo userId
        const transaction = new Transaction({
            categoryId: category._id,
            amount: parseFloat(amount),
            type: type || 'expense',
            description: description || 'Demo transaction',
            date: new Date(),
            userId: new mongoose.Types.ObjectId('000000000000000000000000') // Demo user
        });

        await transaction.save();
        
        res.json({ 
            success: true, 
            message: 'Transaction created!',
            id: transaction._id 
        });
        
    } catch (err) {
        console.error('CREATE error details:', err);
        res.status(500).json({ 
            error: 'Create failed: ' + err.message 
        });
    }
});

// READ - Get only demo transactions
router.get('/transactions', async (req, res) => {
    try {
        const demoUserId = new mongoose.Types.ObjectId('000000000000000000000000');
        const transactions = await Transaction.find({ userId: demoUserId })
            .populate('categoryId', 'name')
            .limit(10)
            .sort({ date: -1 });
        
        res.json({ transactions });
    } catch (err) {
        res.status(500).json({ error: 'Read failed' });
    }
});

// UPDATE
// UPDATE - Fixed to handle categoryName
router.put('/transactions/:id', async (req, res) => {
    try {
        const demoUserId = new mongoose.Types.ObjectId('000000000000000000000000');
        const { amount, type, categoryName, description, date } = req.body;
        
        // Build update object
        const updateData = {
            amount: parseFloat(amount),
            description: description,
            date: date ? new Date(date) : new Date()
        };

        // If categoryName is provided, find/create that category and update categoryId
        if (categoryName) {
            let category = await BudgetCategory.findOne({ 
                name: categoryName, 
                userId: demoUserId 
            });
            
            if (!category) {
                // Create new category if it doesn't exist
                category = new BudgetCategory({
                    name: categoryName,
                    type: type || 'expense',
                    userId: demoUserId
                });
                await category.save();
            }
            
            updateData.categoryId = category._id;
        }

        // Update the transaction
        const transaction = await Transaction.findOneAndUpdate(
            { _id: req.params.id, userId: demoUserId },
            updateData,
            { new: true }
        ).populate('categoryId', 'name');
        
        if (!transaction) {
            return res.status(404).json({ error: 'Transaction not found' });
        }
        
        res.json({ success: true, transaction });
    } catch (err) {
        console.error('UPDATE error:', err);
        res.status(500).json({ error: 'Update failed: ' + err.message });
    }
});

// DELETE
router.delete('/transactions/:id', async (req, res) => {
    try {
        const demoUserId = new mongoose.Types.ObjectId('000000000000000000000000');
        const transaction = await Transaction.findOneAndDelete({ 
            _id: req.params.id, 
            userId: demoUserId 
        });
        
        if (!transaction) {
            return res.status(404).json({ error: 'Transaction not found' });
        }
        
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Delete failed' });
    }
});

module.exports = router;