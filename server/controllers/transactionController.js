const Transaction = require('../models/Transaction');
const BudgetCategory = require('../models/BudgetCategory');

// Create new transaction
async function createTransaction(req, res) {
    try {
        const { amount, description, date, categoryId, type } = req.body;
        
        // Validate required fields
        if (!amount || !date || !categoryId || !type) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        if (amount <= 0) {
            return res.status(400).json({ error: 'Amount must be positive' });
        }

        // Verify category exists and belongs to user
        const category = await BudgetCategory.findOne({ 
            _id: categoryId, 
            userId: req.user.id 
        });

        if (!category) {
            return res.status(404).json({ error: 'Category not found' });
        }

        const transaction = new Transaction({
            userId: req.user.id,
            categoryId,
            amount,
            description,
            date: new Date(date),
            type
        });

        await transaction.save();
        res.status(201).json({ transactionId: transaction._id });
    } catch (err) {
        console.error('Create transaction error:', err);
        res.status(500).json({ error: 'Failed to create transaction' });
    }
}

// Get transactions with filters and pagination
async function getTransactions(req, res) {
    try {
        const { startDate, endDate, categoryId, type, page = 1, limit = 20 } = req.query;
        const filter = { userId: req.user.id };

        // Build date range filter
        if (startDate) filter.date = { ...filter.date, $gte: new Date(startDate) };
        if (endDate) filter.date = { ...filter.date, $lte: new Date(endDate) };
        if (categoryId) filter.categoryId = categoryId;
        if (type) filter.type = type;

        const transactions = await Transaction.find(filter)
            .sort({ date: -1 }) // Newest first
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .populate('categoryId', 'name type'); // Include category details

        res.json(transactions);
    } catch (err) {
        console.error('Get transactions error:', err);
        res.status(500).json({ error: 'Failed to fetch transactions' });
    }
}

// Update transaction
async function updateTransaction(req, res) {
    try {
        const { id } = req.params;
        const updates = req.body;

        if (updates.amount && updates.amount <= 0) {
            return res.status(400).json({ error: 'Amount must be positive' });
        }

        const transaction = await Transaction.findOneAndUpdate(
            { _id: id, userId: req.user.id },
            updates,
            { new: true, runValidators: true }
        );

        if (!transaction) {
            return res.status(404).json({ error: 'Transaction not found' });
        }
        res.json(transaction);
    } catch (err) {
        console.error('Update transaction error:', err);
        res.status(500).json({ error: 'Failed to update transaction' });
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
        res.status(204).send();
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

