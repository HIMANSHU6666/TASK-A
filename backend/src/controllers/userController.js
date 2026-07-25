import User from '../models/User.js';

/**
 * GET /api/users   (admin only)
 * Returns list of all users — used for the assign-to-member dropdown in the UI.
 */
export const getUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('name email role createdAt').sort({ name: 1 });
    res.json({ success: true, data: users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

