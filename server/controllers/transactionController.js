const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const BudgetCategory = require('../models/BudgetCategory');
const Budget = require('../models/Budget');
const logger = require('../utils/logger');

// Create new transaction
async function createTransaction(req, res) {
    try {
        const { amount, description, date, categoryId, categoryName, type, budgetLimit } = req.body;
        
        // Validate required fields
        if (!amount || !date || !type || (!categoryId && !categoryName)) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        if (amount <= 0) {
            return res.status(400).json({ error: 'Amount must be positive' });
        }

        let category;

        // If categoryId provided, verify it belongs to user
        if (categoryId) {
            category = await BudgetCategory.findOne({ 
                _id: categoryId, 
                userId: req.user.id 
            });
            
            // Update budget limit if provided
            if (category && typeof budgetLimit !== 'undefined' && !isNaN(Number(budgetLimit))) {
                category.budgetLimit = Number(budgetLimit);
                await category.save();
            }
        } else if (categoryName) {
            // Attempt to find category by name for this user
            category = await BudgetCategory.findOne({
                name: categoryName.trim(),
                userId: req.user.id
            });

            // If not found, create it using transaction type as category type
            if (!category) {
                category = new BudgetCategory({
                    userId: req.user.id,
                    name: categoryName.trim(),
                    type: type === 'income' ? 'income' : 'expense',
                    budgetLimit: (typeof budgetLimit !== 'undefined' && !isNaN(Number(budgetLimit))) ? Number(budgetLimit) : 0
                });
                await category.save();
            } else {
                // Update existing category's budget limit if provided
                if (typeof budgetLimit !== 'undefined' && !isNaN(Number(budgetLimit))) {
                    category.budgetLimit = Number(budgetLimit);
                    await category.save();
                }
            }
        }

        if (!category) {
            return res.status(404).json({ error: 'Category not found' });
        }

        const transaction = new Transaction({
            userId: req.user.id,
            categoryId: category._id,
            amount,
            description,
            date: new Date(date),
            type
        });

        await transaction.save();
        
        // Refresh category data to get updated budgetLimit
        const updatedCategory = await BudgetCategory.findById(category._id);
        
        // Populate category for client with updated budgetLimit
        const populated = await Transaction.findById(transaction._id)
            .populate('categoryId', 'name type budgetLimit');
            
        res.status(201).json({ 
            transaction: populated,
            message: 'Transaction created successfully'
        });
    } catch (err) {
        console.error('Create transaction error:', err);
        res.status(500).json({ error: 'Failed to create transaction: ' + err.message });
    }
}

// Get transactions with filters and pagination
async function getTransactions(req, res) {
    try {
        const { startDate, endDate, categoryId, type, page = 1, limit } = req.query;
        // Build filter base using explicit ObjectId for reliability
        const userId = req.user && (req.user.id || req.user._id);
        if (!userId) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const filter = { userId: new mongoose.Types.ObjectId(userId) };

        // Build date range filter
        if (startDate) filter.date = { ...filter.date, $gte: new Date(startDate) };
        if (endDate) filter.date = { ...filter.date, $lte: new Date(endDate) };
        if (categoryId) filter.categoryId = categoryId;
        if (type) filter.type = type;

        logger.debug('GetTransactions filter:', filter, 'page:', page, 'limit:', limit);

        // Default: return up to 1000 records when no explicit limit is provided
        const maxLimit = 1000;
        const parsedLimit = limit ? Math.max(1, parseInt(limit)) : maxLimit;
        const parsedPage = Math.max(1, parseInt(page));

        const transactions = await Transaction.find(filter)
            .sort({ date: -1 }) // Newest first
            .skip((parsedPage - 1) * parsedLimit)
            .limit(parsedLimit)
            .populate('categoryId', 'name type budgetLimit'); // Include category details and budgetLimit

        // return consistent wrapper
        res.json({ 
            transactions,
            total: transactions.length,
            page: parsedPage,
            limit: parsedLimit
        });
    } catch (err) {
        logger.error('Get transactions error:', err);
        res.status(500).json({ error: 'Failed to fetch transactions' });
    }
}

// Update transaction
async function updateTransaction(req, res) {
    try {
        const { id } = req.params;
        const updates = { ...req.body };

        if (updates.amount && updates.amount <= 0) {
            return res.status(400).json({ error: 'Amount must be positive' });
        }

        // Handle categoryName or categoryId changes
        if (updates.categoryName) {
            // find or create category for user
            let category = await BudgetCategory.findOne({
                name: updates.categoryName.trim(),
                userId: req.user.id
            });
            if (!category) {
                category = new BudgetCategory({
                    userId: req.user.id,
                    name: updates.categoryName.trim(),
                    type: updates.type === 'income' ? 'income' : (updates.type === 'expense' ? 'expense' : 'expense'),
                    budgetLimit: (typeof updates.budgetLimit !== 'undefined' && !isNaN(Number(updates.budgetLimit))) ? Number(updates.budgetLimit) : 0
                });
                await category.save();
            } else {
                // Update budget limit if provided
                if (typeof updates.budgetLimit !== 'undefined' && !isNaN(Number(updates.budgetLimit))) {
                    category.budgetLimit = Number(updates.budgetLimit);
                    await category.save();
                }
            }
            updates.categoryId = category._id;
            delete updates.categoryName;
            delete updates.budgetLimit; // Remove budgetLimit from transaction updates
        } else if (updates.categoryId) {
            // verify ownership
            const category = await BudgetCategory.findOne({ _id: updates.categoryId, userId: req.user.id });
            if (!category) {
                return res.status(404).json({ error: 'Category not found or not owned by user' });
            }
            
            // Update budget limit if provided
            if (typeof updates.budgetLimit !== 'undefined' && !isNaN(Number(updates.budgetLimit))) {
                category.budgetLimit = Number(updates.budgetLimit);
                await category.save();
            }
            delete updates.budgetLimit; // Remove budgetLimit from transaction updates
        }

        // Handle budget limit update for existing category
        if (updates.budgetLimit && !updates.categoryName && !updates.categoryId) {
            // Get current transaction to find its category
            const currentTransaction = await Transaction.findOne({ _id: id, userId: req.user.id });
            if (currentTransaction) {
                const category = await BudgetCategory.findOne({ 
                    _id: currentTransaction.categoryId, 
                    userId: req.user.id 
                });
                if (category) {
                    category.budgetLimit = Number(updates.budgetLimit);
                    await category.save();
                }
            }
            delete updates.budgetLimit; // Remove budgetLimit from transaction updates
        }

        // Normalize date if provided
        if (updates.date) updates.date = new Date(updates.date);

        const transaction = await Transaction.findOneAndUpdate(
            { _id: id, userId: req.user.id },
            updates,
            { new: true, runValidators: true }
        ).populate('categoryId', 'name type budgetLimit');

        if (!transaction) {
            return res.status(404).json({ error: 'Transaction not found' });
        }
        
        res.json({ 
            transaction,
            message: 'Transaction updated successfully'
        });
    } catch (err) {
        console.error('Update transaction error:', err);
        res.status(500).json({ error: 'Failed to update transaction: ' + err.message });
    }
}

// Delete transaction
async function deleteTransaction(req, res) {
    try {
        const { id } = req.params;
        const transaction = await Transaction.findOneAndDelete({ 
            _id: id, 
            userId: req.user.id 
        });

        if (!transaction) {
            return res.status(404).json({ error: 'Transaction not found' });
        }
        // return json for client convenience
        res.json({ 
            success: true, 
            transactionId: transaction._id,
            message: 'Transaction deleted successfully'
        });
    } catch (err) {
        console.error('Delete transaction error:', err);
        res.status(500).json({ error: 'Failed to delete transaction' });
    }
}

module.exports = { 
    createTransaction, 
    getTransactions, 
    updateTransaction, 
    deleteTransaction 
};