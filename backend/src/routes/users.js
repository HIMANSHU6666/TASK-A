import express from 'express';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/roles';
import { getUsers } from '../controllers/userController';

export const router = express.Router();
// GET /api/users — admin only (for assignment dropdown)
router.get('/', authenticate, requireRole('admin'), getUsers);

