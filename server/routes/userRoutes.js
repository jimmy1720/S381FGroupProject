const express = require('express');
const router = express.Router();
const uc = require('../controllers/userController');

// Accept JSON body
router.use(express.json());

// RESTful, unauthenticated user CRUD
router.post('/', uc.createUser);       // Create
router.get('/', uc.listUsers);         // Read (list)
router.get('/:id', uc.getUser);        // Read (single)
router.put('/:id', uc.updateUser);     // Update
router.delete('/:id', uc.deleteUser);  // Delete

module.exports = router;