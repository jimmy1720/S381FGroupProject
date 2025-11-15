const express = require('express');
const router = express.Router();
const { isLoggedIn } = require('../middleware/authMiddleware');
const budgetController = require('../controllers/budgetController');

// All routes require authentication
router.post('/', isLoggedIn, budgetController.createBudget);      // Create budget
router.get('/', isLoggedIn, budgetController.getBudgets);         // List budgets
router.put('/:id', isLoggedIn, budgetController.updateBudget);    // Update budget
router.delete('/:id', isLoggedIn, budgetController.deleteBudget); // Delete budget

module.exports = router;

