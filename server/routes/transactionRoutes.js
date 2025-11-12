const express = require('express');
const router = express.Router();
const { isLoggedIn } = require('../middleware/authMiddleware');
const transactionController = require('../controllers/transactionController');

// All routes require authentication
router.post('/', isLoggedIn, transactionController.createTransaction);      // Create transaction
router.get('/', isLoggedIn, transactionController.getTransactions);         // List transactions
router.put('/:id', isLoggedIn, transactionController.updateTransaction);    // Update transaction
router.delete('/:id', isLoggedIn, transactionController.deleteTransaction); // Delete transaction

module.exports = router;

