import express from 'express';
import { register, login, getMe } from '../controllers/authController';
import { authenticate } from '../middleware/auth';

export const router = express.Router();
// POST /api/auth/register
router.post('/register', register);

// POST /api/auth/login
router.post('/login', login);

// GET /api/auth/me  — protected
router.get('/me', authenticate, getMe);


