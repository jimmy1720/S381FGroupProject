const express = require('express');
const router = express.Router();

// Mount all API routes
router.use('/categories', require('./categoryRoutes'));
router.use('/transactions', require('./transactionRoutes'));
router.use('/budgets', require('./budgetRoutes'));
router.use('/dashboard', require('./dashboardRoutes'));

module.exports = router;