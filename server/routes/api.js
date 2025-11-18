const express = require('express');
const router = express.Router();

// Aggregate existing API route modules under a single /api mount to reduce duplication.
router.use('/categories', require('./categoryRoutes'));
router.use('/transactions', require('./transactionRoutes'));
router.use('/budgets', require('./budgetRoutes'));
router.use('/dashboard', require('./dashboardRoutes'));

// NEW: users demo CRUD (no auth)
router.use('/users', require('./userRoutes'));

module.exports = router;