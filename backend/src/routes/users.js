import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/roles.js';
import { getUsers } from '../controllers/userController.js';

const router = express.Router();
// GET /api/users — admin only (for assignment dropdown)
router.get('/', authenticate, requireRole('admin'), getUsers);

export default router;