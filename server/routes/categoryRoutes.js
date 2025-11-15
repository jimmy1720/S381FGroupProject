const express = require('express');
const router = express.Router();
const { isLoggedIn } = require('../middleware/authMiddleware');
const categoryController = require('../controllers/categoryController');

// All routes require authentication
router.post('/', isLoggedIn, categoryController.createCategory);      // Create category
router.get('/', isLoggedIn, categoryController.getCategories);        // List categories
router.put('/:id', isLoggedIn, categoryController.updateCategory);    // Update category
router.delete('/:id', isLoggedIn, categoryController.deleteCategory); // Delete category

module.exports = router;

