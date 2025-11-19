const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const BudgetCategory = require('../models/BudgetCategory');
const Budget = require('../models/Budget');

// Get dashboard summary with budget tracking
async function getDashboard(req, res) {
    try {
        const userId = req.user.id;
        
        // Add cache control
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        
        // Get user's categories with budget limits
        const categories = await BudgetCategory.find({ userId });
        const categoryMap = {};
        categories.forEach(cat => {
            categoryMap[cat._id.toString()] = {
                name: cat.name,
                budgetLimit: cat.budgetLimit || 0
            };
        });

        // Calculate totals for ALL transactions
        const incomeAgg = await Transaction.aggregate([
            { 
                $match: { 
                    userId: new mongoose.Types.ObjectId(userId), 
                    type: 'income'
                } 
            },
            { $group: { _id: null, totalIncome: { $sum: '$amount' } } }
        ]);

        const expensesAgg = await Transaction.aggregate([
            { 
                $match: { 
                    userId: new mongoose.Types.ObjectId(userId), 
                    type: 'expense'
                } 
            },
            { $group: { _id: null, totalExpenses: { $sum: '$amount' } } }
        ]);

        // Get monthly data for charts (last 6 months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const monthlyData = await Transaction.aggregate([
            {
                $match: {
                    userId: new mongoose.Types.ObjectId(userId),
                    date: { $gte: sixMonthsAgo }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$date' },
                        month: { $month: '$date' }
                    },
                    income: {
                        $sum: { $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0] }
                    },
                    expenses: {
                        $sum: { $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0] }
                    }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]);

        // Format monthly data for charts (last 6 months)
        const monthlyIncome = new Array(6).fill(0);
        const monthlyExpenses = new Array(6).fill(0);
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const chartLabels = [];

        // Create labels for last 6 months
        for (let i = 5; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            chartLabels.push(monthNames[date.getMonth()]);
        }

        // Fill chart data
        monthlyData.forEach(item => {
            const dataDate = new Date(item._id.year, item._id.month - 1);
            const monthsAgo = Math.abs(Math.floor((dataDate - new Date()) / (1000 * 60 * 60 * 24 * 30)));
            
            if (monthsAgo < 6) {
                const index = 5 - monthsAgo;
                monthlyIncome[index] = item.income;
                monthlyExpenses[index] = item.expenses;
            }
        });

        // Get category breakdown
        const categoryBreakdown = await Transaction.aggregate([
            { 
                $match: { 
                    userId: new mongoose.Types.ObjectId(userId)
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
            { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } }
        ]);

        // Add category names and budget limits to breakdown
        const breakdownWithLimits = categoryBreakdown.map(item => {
            const categoryId = item._id.categoryId ? item._id.categoryId.toString() : null;
            const categoryInfo = categoryId && categoryMap[categoryId] ? categoryMap[categoryId] : { 
                name: item.category?.name || 'Unknown', 
                budgetLimit: item.category?.budgetLimit || 0 
            };
            
            return {
                categoryName: categoryInfo.name,
                type: item._id.type,
                total: item.total,
                count: item.count,
                budgetLimit: categoryInfo.budgetLimit
            };
        });

        const totalIncome = incomeAgg[0]?.totalIncome || 0;
        const totalExpenses = expensesAgg[0]?.totalExpenses || 0;
        const netSavings = totalIncome - totalExpenses;

        // Only show expenses for spendings grid
        const expenseBreakdown = breakdownWithLimits.filter(item => item.type === 'expense');

        res.json({
            summary: { 
                totalIncome, 
                totalExpenses, 
                netSavings 
            },
            charts: {
                labels: chartLabels,
                monthlyIncome: monthlyIncome,
                monthlyExpenses: monthlyExpenses
            },
            categoryBreakdown: expenseBreakdown,
            budgets: []
        });
    } catch (err) {
        console.error('Dashboard error:', err);
        res.status(500).json({ error: 'Failed to load dashboard' });
    }
}

module.exports = { getDashboard };