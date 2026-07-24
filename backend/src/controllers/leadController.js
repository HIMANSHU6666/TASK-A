const Lead = require('../models/Lead');
const User = require('../models/User');

/* ─────────────────────────────────────────
   POST /api/leads   (PUBLIC – capture form)
───────────────────────────────────────── */
const createLead = async (req, res) => {
  try {
    const { name, email, company, message } = req.body;

    if (!name || !email) {
      return res.status(400).json({ success: false, message: 'Name and email are required.' });
    }

    const lead = await Lead.create({
      name,
      email,
      company: company || '',
      message: message || '',
      activity: [
        {
          action: 'lead_created',
          performedBy: null,
          meta: { source: 'public_capture_form' },
        },
      ],
    });

    res.status(201).json({ success: true, data: lead });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ─────────────────────────────────────────────────────────────────────────
   GET /api/leads   (PROTECTED)
   - Admin: sees all leads
   - Member: sees only leads assigned to them
   Query params: page, limit, status, assignee (admin only), search
─────────────────────────────────────────────────────────────────────────── */
const getLeads = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, assignee, search } = req.query;

    const filter = {};

    // Members can only see their own assigned leads
    if (req.user.role === 'member') {
      filter.assignedTo = req.user._id;
    }

    // Optional filters
    if (status) {
      if (!Lead.VALID_STATUSES.includes(status)) {
        return res.status(400).json({ success: false, message: `Invalid status. Valid values: ${Lead.VALID_STATUSES.join(', ')}` });
      }
      filter.status = status;
    }

    if (assignee && req.user.role === 'admin') {
      filter.assignedTo = assignee === 'unassigned' ? null : assignee;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [leads, total] = await Promise.all([
      Lead.find(filter)
        .populate('assignedTo', 'name email role')
        .select('-notes -activity') // list view doesn't need full detail
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Lead.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: leads,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
        hasNext: pageNum < Math.ceil(total / limitNum),
        hasPrev: pageNum > 1,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ──────────────────────────────────────────────
   GET /api/leads/:id   (PROTECTED)
   Admin: any lead | Member: only assigned leads
────────────────────────────────────────────── */
const getLead = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id)
      .populate('assignedTo', 'name email role')
      .populate('notes.createdBy', 'name email')
      .populate('activity.performedBy', 'name email');

    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found.' });
    }

    // Server-side permission: member can only access their assigned lead
    if (
      req.user.role === 'member' &&
      String(lead.assignedTo?._id) !== String(req.user._id)
    ) {
      return res.status(403).json({ success: false, message: 'You do not have permission to view this lead.' });
    }

    res.json({ success: true, data: lead });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ───────────────────────────────────────────────────────
   PATCH /api/leads/:id/status   (PROTECTED – admin + member)
   Body: { status }
─────────────────────────────────────────────────────── */
const updateStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!status || !Lead.VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${Lead.VALID_STATUSES.join(', ')}`,
      });
    }

    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found.' });

    // Member permission check
    if (
      req.user.role === 'member' &&
      String(lead.assignedTo) !== String(req.user._id)
    ) {
      return res.status(403).json({ success: false, message: 'You can only update leads assigned to you.' });
    }

    const oldStatus = lead.status;
    if (oldStatus === status) {
      return res.status(400).json({ success: false, message: `Lead is already in '${status}' status.` });
    }

    lead.status = status;
    lead.activity.push({
      action: 'status_changed',
      performedBy: req.user._id,
      meta: { from: oldStatus, to: status },
    });

    await lead.save();
    await lead.populate('assignedTo', 'name email role');

    res.json({ success: true, data: lead });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ────────────────────────────────────────────────────
   PATCH /api/leads/:id/assign   (PROTECTED – admin only)
   Body: { userId }  (null = unassign)
──────────────────────────────────────────────────── */
const assignLead = async (req, res) => {
  try {
    const { userId } = req.body;

    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found.' });

    // Validate that userId refers to a real member
    if (userId) {
      const assignee = await User.findById(userId);
      if (!assignee) {
        return res.status(400).json({ success: false, message: 'Assignee user not found.' });
      }
    }

    const prevAssignee = lead.assignedTo;
    lead.assignedTo = userId || null;

    lead.activity.push({
      action: userId ? 'assigned' : 'unassigned',
      performedBy: req.user._id,
      meta: {
        from: prevAssignee,
        to: userId || null,
      },
    });

    await lead.save();
    await lead.populate('assignedTo', 'name email role');

    res.json({ success: true, data: lead });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ────────────────────────────────────────────────────────────
   POST /api/leads/:id/notes   (PROTECTED – admin + member)
   Body: { text }
   Notes are append-only; cannot be edited or deleted.
──────────────────────────────────────────────────────────── */
const addNote = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: 'Note text cannot be empty.' });
    }

    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found.' });

    // Member permission check
    if (
      req.user.role === 'member' &&
      String(lead.assignedTo) !== String(req.user._id)
    ) {
      return res.status(403).json({ success: false, message: 'You can only add notes to leads assigned to you.' });
    }

    lead.notes.push({
      text: text.trim(),
      createdBy: req.user._id,
    });

    lead.activity.push({
      action: 'note_added',
      performedBy: req.user._id,
      meta: { preview: text.trim().substring(0, 80) },
    });

    await lead.save();

    // Repopulate before responding
    await lead.populate('notes.createdBy', 'name email');
    await lead.populate('assignedTo', 'name email role');

    res.status(201).json({ success: true, data: lead });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ──────────────────────────────────────────────────────────────
   GET /api/leads/:id/activity   (PROTECTED)
   Returns the full activity trail for a lead.
────────────────────────────────────────────────────────────── */
const getActivity = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id)
      .select('activity assignedTo')
      .populate('activity.performedBy', 'name email');

    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found.' });

    if (
      req.user.role === 'member' &&
      String(lead.assignedTo) !== String(req.user._id)
    ) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    res.json({ success: true, data: lead.activity });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { createLead, getLeads, getLead, updateStatus, assignLead, addNote, getActivity };
