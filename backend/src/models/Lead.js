const mongoose = require('mongoose');

// Sub-schema for notes (append-only, immutable after creation)
const noteSchema = new mongoose.Schema(
  {
    text: { type: String, required: true, trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true, _id: true }
);

// Sub-schema for activity trail (immutable audit log)
const activitySchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      enum: ['lead_created', 'status_changed', 'assigned', 'unassigned', 'note_added'],
    },
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true, _id: true }
);

const VALID_STATUSES = ['new', 'contacted', 'qualified', 'proposal', 'won', 'lost'];

const leadSchema = new mongoose.Schema(
  {
    // Public capture form fields
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
    },
    company: { type: String, trim: true, default: '' },
    message: { type: String, trim: true, default: '' },

    // Pipeline status
    status: {
      type: String,
      enum: { values: VALID_STATUSES, message: 'Invalid status value' },
      default: 'new',
      index: true,
    },

    // Assignment
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },

    // Append-only notes
    notes: [noteSchema],

    // Immutable activity trail
    activity: [activitySchema],
  },
  { timestamps: true }
);

// Index for common queries
leadSchema.index({ status: 1, assignedTo: 1 });
leadSchema.index({ createdAt: -1 });

// Export valid statuses for use in controllers/validation
leadSchema.statics.VALID_STATUSES = VALID_STATUSES;

module.exports = mongoose.model('Lead', leadSchema);
