const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget.JS'); // fixed filename
const BudgetCategory = require('../models/BudgetCategory')

// Get dashboard summary with budget tracking
async function getDashboard(req, res) {
    try {
        const { period = 'monthly', year = new Date().getFullYear(), month } = req.query;
        const userId = req.user.id;

        // Calculate date range based on period
        let startDate = new Date(year, month ? month - 1 : 0, 1);
        let endDate = new Date(year, month ? month : 12, 0);

        // Aggregate total income for period
        const incomeAgg = await Transaction.aggregate([
            { 
                $match: { 
                    userId: new mongoose.Types.ObjectId(userId), 
                    type: 'income', 
                    date: { $gte: startDate, $lte: endDate } 
                } 
            },
            { $group: { _id: null, totalIncome: { $sum: '$amount' } } }
        ]);

        // Aggregate total expenses for period
        const expensesAgg = await Transaction.aggregate([
            { 
                $match: { 
                    userId: new mongoose.Types.ObjectId(userId), 
                    type: 'expense', 
                    date: { $gte: startDate, $lte: endDate } 
                } 
            },
            { $group: { _id: null, totalExpenses: { $sum: '$amount' } } }
        ]);

        // Aggregate by category (both income and expense)
        const categoryBreakdown = await Transaction.aggregate([
            { 
                $match: { 
                    userId: new mongoose.Types.ObjectId(userId), 
                    date: { $gte: startDate, $lte: endDate } 
                } 
            },
            { 
                $group: { 
                    _id: { categoryId: '$categoryId', type: '$type' },
                    total: { $sum: '$amount' },
                    count: { $sum: 1 }
                } 
            },
            {
                $lookup: {
                    from: 'budgetCategories',
                    localField: '_id.categoryId',
                    foreignField: '_id',
                    as: 'category'
                }
            },
            { $unwind: '$category' },
            {
                $project: {
                    categoryName: '$category.name',
                    type: '$_id.type',
                    total: 1,
                    count: 1
                }
            }
        ]);

        const totalIncome = incomeAgg[0]?.totalIncome || 0;
        const totalExpenses = expensesAgg[0]?.totalExpenses || 0;
        const netSavings = totalIncome - totalExpenses;

        // Get budgets with spending calculations
        const budgets = await Budget.find({ userId }).populate('categoryId');
        
        // Calculate spent amount for each budget
        const budgetsWithSpent = await Promise.all(budgets.map(async (budget) => {
            const spentAgg = await Transaction.aggregate([
                { 
                    $match: { 
                        userId: new mongoose.Types.ObjectId(userId), 
                        categoryId: budget.categoryId._id, 
                        type: 'expense', // Only count expenses against budget
                        date: { $gte: budget.startDate } 
                    } 
                },
                { $group: { _id: null, spent: { $sum: '$amount' } } }
            ]);

            const spent = spentAgg[0]?.spent || 0;
            return { 
                ...budget.toObject(), 
                spent,
                remaining: budget.amount - spent
            };
        }));

        res.json({
            summary: { totalIncome, totalExpenses, netSavings },
            categoryBreakdown, // Shows income/expense per category
            budgets: budgetsWithSpent
        });
    } catch (err) {
        console.error('Dashboard error:', err);
        res.status(500).json({ error: 'Failed to load dashboard' });
    }
}

module.exports = { getDashboard };
