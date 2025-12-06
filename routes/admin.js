// server/routes/admin.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const Registration = require('../models/Registration');
const Journal = require('../models/Journal');
const User = require('../models/User');
const Order = require('../models/Order');

const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'please_set_ADMIN_JWT_SECRET';
const ADMIN_JWT_EXPIRES = process.env.ADMIN_JWT_EXPIRES || '8h';
const ADMIN_SETUP_KEY = process.env.ADMIN_SETUP_KEY || '';

function signAdminToken(admin) {
  const payload = { id: admin._id.toString(), username: admin.username, building: admin.building };
  return jwt.sign(payload, ADMIN_JWT_SECRET, { expiresIn: ADMIN_JWT_EXPIRES });
}

function verifyAdminToken(req, res, next) {
  try {
    const auth = req.headers.authorization || '';
    const parts = auth.split(' ');
    const token = parts.length === 2 && parts[0] === 'Bearer' ? parts[1] : null;
    if (!token) return res.status(401).json({ error: 'Admin authorization token required' });
    const decoded = jwt.verify(token, ADMIN_JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (err) {
    console.warn('Admin token verification failed', err && err.message ? err.message : err);
    return res.status(401).json({ error: 'Invalid or expired admin token' });
  }
}

function normalizeBuildingName(b) {
  if (!b) return '';
  return String(b).toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * POST /api/admin/create
 * Body: { username, password, building, setupKey }
 * Protected by ADMIN_SETUP_KEY
 */
router.post('/create', async (req, res) => {
  try {
    const { username, password, building, setupKey } = req.body || {};
    if (!ADMIN_SETUP_KEY || setupKey !== ADMIN_SETUP_KEY) {
      return res.status(403).json({ error: 'Invalid setup key' });
    }
    if (!username || !password || !building) {
      return res.status(400).json({ error: 'username, password and building are required' });
    }

    const lowerUsername = username.toString().trim().toLowerCase();
    const lowerBuilding = building.toString().trim().toLowerCase();

    const existing = await Admin.findOne({ username: lowerUsername });
    if (existing) return res.status(409).json({ error: 'Admin username already exists' });

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    const admin = new Admin({ username: lowerUsername, passwordHash: hash, building: lowerBuilding });
    await admin.save();

    return res.status(201).json({ message: 'Admin created', admin: { username: admin.username, building: admin.building } });
  } catch (err) {
    console.error('Error creating admin', err && err.stack ? err.stack : err);
    return res.status(500).json({ error: 'Server error' });
  }
});

/**
 * POST /api/admin/login
 * Body: { username, password }
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) return res.status(400).json({ error: 'username and password are required' });

    const lowerUsername = username.toString().trim().toLowerCase();
    const admin = await Admin.findOne({ username: lowerUsername });
    if (!admin) return res.status(401).json({ error: 'Invalid credentials' });

    const match = await bcrypt.compare(password, admin.passwordHash);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });

    const token = signAdminToken(admin);
    return res.json({ token, admin: { username: admin.username, building: admin.building } });
  } catch (err) {
    console.error('Admin login error', err && err.stack ? err.stack : err);
    return res.status(500).json({ error: 'Server error' });
  }
});

/**
 * GET /api/admin/registrations
 * Protected: requires admin JWT in Authorization header
 */
router.get('/registrations', verifyAdminToken, async (req, res) => {
  try {
    const adminBuilding = req.admin.building;
    const regs = await Registration.find({ building: adminBuilding }).sort({ createdAt: -1 }).lean();
    return res.json({ registrations: regs });
  } catch (err) {
    console.error('Error fetching admin registrations', err && err.stack ? err.stack : err);
    return res.status(500).json({ error: 'Server error' });
  }
});

/**
 * PATCH /api/admin/registrations/:id/approve
 * Protected: requires admin JWT
 * Admin can approve only registrations from their building
 */
router.patch('/registrations/:id/approve', verifyAdminToken, async (req, res) => {
  try {
    const adminBuilding = req.admin.building;
    const id = req.params.id;
    const reg = await Registration.findById(id);
    if (!reg) return res.status(404).json({ error: 'Registration not found' });

    if (reg.building.toString().toLowerCase() !== adminBuilding.toString().toLowerCase()) {
      return res.status(403).json({ error: 'You are not authorized to approve registrations from this building' });
    }

    reg.approved = true;
    reg.approvedBy = req.admin.username;
    reg.approvedAt = new Date();
    await reg.save();

    return res.json({ message: 'Registration approved', registration: reg });
  } catch (err) {
    console.error('Error approving registration', err && err.stack ? err.stack : err);
    return res.status(500).json({ error: 'Server error' });
  }
});

/**
 * GET /api/admin/journals/pending
 * Returns journals that were submitted (isDraft=false) but not yet approved.
 * Only allowed for the main building admin (who approves journals).
 */
router.get('/journals/pending', verifyAdminToken, async (req, res) => {
  try {
    const adminBuilding = req.admin.building;
    // normalize building names (strip punctuation/spacing) so 'Main-Building', 'main building', 'main_building' all match
    if (normalizeBuildingName(adminBuilding) !== 'mainbuilding') {
      return res.status(403).json({ error: 'Not authorized to review journals' });
    }

    const journals = await Journal.find({ isDraft: false, approved: false }).sort({ createdAt: -1 }).lean();
    return res.json({ journals });
  } catch (err) {
    console.error('Error fetching pending journals', err && err.stack ? err.stack : err);
    return res.status(500).json({ error: 'Server error' });
  }
});

/**
 * PATCH /api/admin/journals/:id/approve
 * Approve a submitted journal and set publishedAt.
 * Only main building admin can approve journals.
 */
router.patch('/journals/:id/approve', verifyAdminToken, async (req, res) => {
  try {
    const adminBuilding = req.admin.building;
    if (normalizeBuildingName(adminBuilding) !== 'mainbuilding') {
      return res.status(403).json({ error: 'Not authorized to approve journals' });
    }

    const id = req.params.id;
    const journal = await Journal.findById(id);
    if (!journal) return res.status(404).json({ error: 'Journal not found' });

    journal.approved = true;
    journal.approvedBy = req.admin.username;
    journal.approvedAt = new Date();
    journal.publishedAt = new Date();
    await journal.save();

    return res.json({ message: 'Journal approved', journal });
  } catch (err) {
    console.error('Error approving journal', err && err.stack ? err.stack : err);
    return res.status(500).json({ error: 'Server error' });
  }
});

/**
 * GET /api/admin/journals/:id
 * Return a journal by id for admins (main-building only).
 */
router.get('/journals/:id', verifyAdminToken, async (req, res) => {
  try {
    const adminBuilding = req.admin.building;
    if (normalizeBuildingName(adminBuilding) !== 'mainbuilding') {
      return res.status(403).json({ error: 'Not authorized to view journals' });
    }

    const id = req.params.id;
    const journal = await Journal.findById(id).lean();
    if (!journal) return res.status(404).json({ error: 'Journal not found' });
    return res.json({ journal });
  } catch (err) {
    console.error('Error fetching journal for admin', err && err.stack ? err.stack : err);
    return res.status(500).json({ error: 'Server error' });
  }
});


/**
 * DELETE /api/admin/journals/:id
 * Delete a journal (only allowed for main building admins).
 */
router.delete('/journals/:id', verifyAdminToken, async (req, res) => {
  try {
    const adminBuilding = req.admin.building;
    if (normalizeBuildingName(adminBuilding) !== 'mainbuilding') {
      return res.status(403).json({ error: 'Not authorized to delete journals' });
    }

    const id = req.params.id;
    const journal = await Journal.findById(id);
    if (!journal) return res.status(404).json({ error: 'Journal not found' });

    await journal.deleteOne();
    return res.json({ message: 'Journal deleted' });
  } catch (err) {
    console.error('Error deleting journal', err && err.stack ? err.stack : err);
    return res.status(500).json({ error: 'Server error' });
  }
});

/**
 * GET /api/admin/members
 * Get all club members (approved registrations) - Main building admin only
 */
router.get('/members', verifyAdminToken, async (req, res) => {
  try {
    const adminBuilding = req.admin.building;
    if (normalizeBuildingName(adminBuilding) !== 'mainbuilding') {
      return res.status(403).json({ error: 'Not authorized to view members' });
    }

    const members = await Registration.find({ approved: true }).sort({ createdAt: -1 }).lean();
    return res.json({ members });
  } catch (err) {
    console.error('Error fetching members', err && err.stack ? err.stack : err);
    return res.status(500).json({ error: 'Server error' });
  }
});

/**
 * GET /api/admin/non-members
 * Get all registered users who are not club members - Main building admin only
 */
router.get('/non-members', verifyAdminToken, async (req, res) => {
  try {
    const adminBuilding = req.admin.building;
    if (normalizeBuildingName(adminBuilding) !== 'mainbuilding') {
      return res.status(403).json({ error: 'Not authorized to view non-members' });
    }

    const users = await User.find().sort({ createdAt: -1 }).lean();
    return res.json({ users });
  } catch (err) {
    console.error('Error fetching non-members', err && err.stack ? err.stack : err);
    return res.status(500).json({ error: 'Server error' });
  }
});

/**
 * GET /api/admin/member/:id/details
 * Get detailed information about a specific member including order history - Main building admin only
 */
router.get('/member/:id/details', verifyAdminToken, async (req, res) => {
  try {
    const adminBuilding = req.admin.building;
    if (normalizeBuildingName(adminBuilding) !== 'mainbuilding') {
      return res.status(403).json({ error: 'Not authorized to view member details' });
    }

    const id = req.params.id;
    const member = await Registration.findById(id).lean();
    if (!member) return res.status(404).json({ error: 'Member not found' });

    // Get order history for this member (match by email or phone)
    const orders = await Order.find({
      $or: [
        { email: member.email },
        { phone: member.contactNumber }
      ]
    }).sort({ createdAt: -1 }).lean();

    return res.json({ member, orders });
  } catch (err) {
    console.error('Error fetching member details', err && err.stack ? err.stack : err);
    return res.status(500).json({ error: 'Server error' });
  }
});

/**
 * GET /api/admin/user/:id/details
 * Get detailed information about a specific user including order history - Main building admin only
 */
router.get('/user/:id/details', verifyAdminToken, async (req, res) => {
  try {
    const adminBuilding = req.admin.building;
    if (normalizeBuildingName(adminBuilding) !== 'mainbuilding') {
      return res.status(403).json({ error: 'Not authorized to view user details' });
    }

    const id = req.params.id;
    const user = await User.findById(id).lean();
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Get order history for this user (match by email or phone)
    const orders = await Order.find({
      $or: [
        { email: user.email },
        { phone: user.whatsapp }
      ]
    }).sort({ createdAt: -1 }).lean();

    return res.json({ user, orders });
  } catch (err) {
    console.error('Error fetching user details', err && err.stack ? err.stack : err);
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
