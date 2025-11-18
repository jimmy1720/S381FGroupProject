const User = require('../models/User');

/* Create */
async function createUser(req, res) {
  try {
    const { username, email, displayName, password, type, googleId, facebookId, prefs } = req.body || {};
    if (!username) return res.status(400).json({ ok: false, error: 'username required' });

    // prevent duplicates by username or email
    const exists = await User.findOne({
      $or: [
        { username },
        ...(email ? [{ email: String(email).toLowerCase() }] : [])
      ]
    });
    if (exists) return res.status(409).json({ ok: false, error: 'username or email already exists' });

    const user = new User({
      username,
      email: email ? String(email).toLowerCase() : undefined,
      displayName,
      type: type || 'local',
      googleId,
      facebookId,
      prefs: prefs || {}
    });
    if (password) user.password = password; // model may hash on save if implemented

    await user.save();
    const out = user.toObject();
    delete out.password;
    delete out.resetToken;
    delete out.resetTokenExpiry;
    res.status(201).json({ ok: true, user: out });
  } catch (err) {
    res.status(500).json({ ok: false, error: 'create failed', details: err.message });
  }
}

/* List (GET /api/users) */
async function listUsers(req, res) {
  try {
    const users = await User.find().select('-password -resetToken -resetTokenExpiry').limit(200).lean();
    res.json({ ok: true, users });
  } catch (err) {
    res.status(500).json({ ok: false, error: 'list failed', details: err.message });
  }
}

/* Get one (GET /api/users/:id) */
async function getUser(req, res) {
  try {
    const id = req.params.id;
    const user = await User.findById(id).select('-password -resetToken -resetTokenExpiry').lean();
    if (!user) return res.status(404).json({ ok: false, error: 'not found' });
    res.json({ ok: true, user });
  } catch (err) {
    res.status(500).json({ ok: false, error: 'get failed', details: err.message });
  }
}

/* Update (PUT /api/users/:id) */
async function updateUser(req, res) {
  try {
    const id = req.params.id;
    const payload = { ...(req.body || {}) };
    delete payload._id;

    if (payload.email) payload.email = String(payload.email).toLowerCase();

    // If password provided, set it on the document then save to trigger hashing if model has hook
    const password = payload.password;
    if (password !== undefined) delete payload.password;

    const user = await User.findByIdAndUpdate(id, payload, { new: true, runValidators: true });
    if (!user) return res.status(404).json({ ok: false, error: 'not found' });

    if (password !== undefined) {
      user.password = password;
      await user.save();
    }

    const out = user.toObject();
    delete out.password;
    delete out.resetToken;
    delete out.resetTokenExpiry;
    res.json({ ok: true, user: out });
  } catch (err) {
    res.status(500).json({ ok: false, error: 'update failed', details: err.message });
  }
}

/* Delete (DELETE /api/users/:id) */
async function deleteUser(req, res) {
  try {
    const id = req.params.id;
    const user = await User.findByIdAndDelete(id);
    if (!user) return res.status(404).json({ ok: false, error: 'not found' });
    res.json({ ok: true, message: 'deleted' });
  } catch (err) {
    res.status(500).json({ ok: false, error: 'delete failed', details: err.message });
  }
}

module.exports = {
  createUser,
  listUsers,
  getUser,
  updateUser,
  deleteUser
};