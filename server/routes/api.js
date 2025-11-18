const express = require('express');
const router = express.Router();
const { isLoggedIn } = require('../middleware/authMiddleware');
const tc = require('../controllers/transactionController');
const categoryController = require('../controllers/categoryController'); // <-- fixed import

router.get('/categories', isLoggedIn, categoryController.getCategories); // <-- use correct controller
router.get('/transactions', isLoggedIn, tc.getTransactions);
router.post('/transactions', isLoggedIn, express.json(), tc.createTransaction);
router.delete('/transactions/:id', isLoggedIn, tc.deleteTransaction);

module.exports = router;