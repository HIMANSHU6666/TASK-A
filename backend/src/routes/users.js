const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');
const { getUsers } = require('../controllers/userController');

// GET /api/users — admin only (for assignment dropdown)
router.get('/', authenticate, requireRole('admin'), getUsers);

module.exports = router;
