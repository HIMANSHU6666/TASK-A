const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');
const {
  createLead,
  getLeads,
  getLead,
  updateStatus,
  assignLead,
  addNote,
  getActivity,
} = require('../controllers/leadController');

// POST /api/leads — public (capture form, no auth required)
router.post('/', createLead);

// All routes below require authentication
router.use(authenticate);

// GET  /api/leads           — admin: all | member: assigned only
router.get('/', getLeads);

// GET  /api/leads/:id       — admin: any | member: assigned only
router.get('/:id', getLead);

// PATCH /api/leads/:id/status  — admin + member (member: only assigned)
router.patch('/:id/status', updateStatus);

// PATCH /api/leads/:id/assign  — admin only
router.patch('/:id/assign', requireRole('admin'), assignLead);

// POST  /api/leads/:id/notes   — admin + member (member: only assigned)
router.post('/:id/notes', addNote);

// GET   /api/leads/:id/activity — admin + member (member: only assigned)
router.get('/:id/activity', getActivity);

module.exports = router;
