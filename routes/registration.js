// server/routes/registration.js
const express = require('express');
const router = express.Router();
const Registration = require('../models/Registration');
const User = require('../models/User');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

let supabaseAdmin = null;
if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
  supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
} else {
  console.warn('Supabase admin client not configured (SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing).');
}

// Logging middleware
router.use((req, res, next) => {
  console.log(`[registration] ${req.method} ${req.originalUrl} body:`, req.body || {});
  next();
});

// verifySupabase middleware ensures a valid Supabase access token and attaches req.supabaseUser
async function verifySupabase(req, res, next) {
  try {
    const auth = req.headers.authorization || '';
    const parts = auth.split(' ');
    const token = parts.length === 2 && parts[0] === 'Bearer' ? parts[1] : null;
    if (!token) return res.status(401).json({ error: 'Authorization token required' });

    if (supabaseAdmin) {
      // Preferred path: use service-role client to verify the token
      let result;
      try {
        result = await supabaseAdmin.auth.getUser(token);
      } catch (fetchErr) {
        console.error('Supabase network error while verifying token:', fetchErr && fetchErr.stack ? fetchErr.stack : fetchErr);
        return res.status(502).json({ error: 'Network error verifying token with Supabase.' });
      }

      const { data, error } = result || {};
      if (error || !data || !data.user) {
        console.warn('Supabase token verification failed:', error);
        return res.status(401).json({ error: 'Invalid or expired token' });
      }

      req.supabaseUser = data.user;
      return next();
    }

    // Fallback: supabaseAdmin not configured. Try to decode JWT payload without signature verification
    try {
      const parts = token.split('.');
      if (parts.length < 2) return res.status(401).json({ error: 'Invalid token format' });
      const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const padded = payload + '='.repeat((4 - payload.length % 4) % 4);
      const decoded = Buffer.from(padded, 'base64').toString('utf8');
      const obj = JSON.parse(decoded);
      const sub = obj.sub || obj.user_id || obj.sub;
      if (!sub) return res.status(401).json({ error: 'Token does not contain user id' });
      req.supabaseUser = { id: sub, email: obj.email };
      console.warn('Warning: Supabase admin client not configured; using unsigned token payload as fallback for', sub);
      return next();
    } catch (e) {
      console.error('Error decoding token payload fallback:', e && (e.stack || e.message || e));
      return res.status(500).json({ error: 'Server cannot verify token' });
    }
  } catch (err) {
    console.error('Unexpected verifySupabase error:', err && err.stack ? err.stack : err);
    return res.status(500).json({ error: 'Server error during token verification' });
  }
}

// POST /api/registration (protected)
router.post('/', verifySupabase, async (req, res) => {
  try {
    const {
      name, code, class: classNum, section, campus,
      version, department, building, contactNumber, force
    } = req.body || {};

    if (!name || !code || !classNum || !section || !campus || !version || !department || !building || !contactNumber) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    const classNumber = Number(classNum);
    if (![9, 10, 11, 12].includes(classNumber)) {
      return res.status(400).json({ error: 'Class must be one of 9, 10, 11, 12.' });
    }

    const campusLower = campus.toString().toLowerCase();
    if (!['main campus', 'permanent campus'].includes(campusLower)) {
      return res.status(400).json({ error: "Campus must be 'main campus' or 'permanent campus'." });
    }

    const versionLower = version.toString().toLowerCase();
    if (!['english', 'bangla'].includes(versionLower)) {
      return res.status(400).json({ error: "Version must be 'english' or 'bangla'." });
    }

    const deptLower = department.toString().toLowerCase();
    if (!['science', 'bst', 'arts'].includes(deptLower)) {
      return res.status(400).json({ error: "Department must be 'science', 'bst', or 'arts'." });
    }

    const buildingLower = building.toString().toLowerCase();

    const normalized = {
      supabaseId: req.supabaseUser.id,
      name: name.toString().trim(),
      code: code.toString().trim(),
      class: classNumber,
      section: section.toString().trim(),
      campus: campusLower,
      version: versionLower,
      department: deptLower,
      building: buildingLower,
      contactNumber: contactNumber.toString().trim()
    };

    // Check if user already has a pending or approved application
    const userExisting = await Registration.findOne({ 
      supabaseId: normalized.supabaseId,
      status: { $in: ['pending', 'approved'] }
    }).lean();
    
    if (userExisting) {
      return res.status(400).json({ 
        error: 'You already have a pending or approved application. You cannot submit another application.',
        existingApplication: userExisting
      });
    }

    // Duplicate detection by code
    const existing = await Registration.findOne({ code: normalized.code }).lean();
    if (existing && !force) {
      return res.status(409).json({ error: 'A registration with this code already exists.', existing });
    }

    const reg = new Registration({ ...normalized, status: 'pending' });
    const saved = await reg.save();
    return res.status(201).json({ message: 'Registration submitted', registration: saved });
  } catch (err) {
    console.error('Error creating registration:', err && err.stack ? err.stack : err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/registration (list all)
router.get('/', async (req, res) => {
  try {
    const regs = await Registration.find().sort({ createdAt: -1 }).lean();
    res.json({ registrations: regs });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/registration/my
router.get('/my', verifySupabase, async (req, res) => {
  try {
    const regs = await Registration.find({ supabaseId: req.supabaseUser.id }).sort({ createdAt: -1 }).lean();
    res.json({ registrations: regs });
  } catch (err) {
    console.error('Error fetching user registrations', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/registration/status - Check if user can apply
router.get('/status', verifySupabase, async (req, res) => {
  try {
    const supabaseId = req.supabaseUser.id;
    
    // Find any existing registration for this user
    const existingReg = await Registration.findOne({ supabaseId }).sort({ createdAt: -1 }).lean();
    
    if (!existingReg) {
      return res.json({ canApply: true, status: 'no_application' });
    }
    
    // Check status
    if (existingReg.status === 'declined') {
      return res.json({ 
        canApply: true, 
        status: 'declined',
        previousApplication: existingReg
      });
    }
    
    // If pending or approved, cannot apply again
    return res.json({ 
      canApply: false, 
      status: existingReg.status,
      existingApplication: existingReg
    });
  } catch (err) {
    console.error('Error checking registration status', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/registration/check
// Verifies membership for a Supabase user. Accepts either an Authorization token
// or a `supabaseId` query parameter (for environments where token is not provided).
// Returns { allowed: true } when the user has a profile and an approved registration.
router.get('/check', async (req, res) => {
  try {
    // Prefer Authorization token, but allow ?supabaseId=... for convenience in local/dev
    const auth = req.headers.authorization || '';
    const parts = auth.split(' ');
    const token = parts.length === 2 && parts[0] === 'Bearer' ? parts[1] : null;

    let supabaseId = null;

    if (token) {
      // If we have a token, try to resolve user id using supabaseAdmin if configured
      if (supabaseAdmin) {
        try {
          const result = await supabaseAdmin.auth.getUser(token);
          const userData = result?.data?.user || result?.user;
          if (userData && userData.id) supabaseId = userData.id;
        } catch (e) {
          console.warn('Supabase admin getUser failed:', e && (e.message || e));
        }
      }

      // Fallback: decode JWT payload (unsigned) to extract `sub`
      if (!supabaseId) {
        try {
          const jwtParts = token.split('.');
          if (jwtParts.length >= 2) {
            const payload = jwtParts[1].replace(/-/g, '+').replace(/_/g, '/');
            const padded = payload + '='.repeat((4 - payload.length % 4) % 4);
            const decoded = Buffer.from(padded, 'base64').toString('utf8');
            const obj = JSON.parse(decoded);
            supabaseId = obj.sub || obj.user_id || obj.sub;
          }
        } catch (e) {
          console.warn('Failed to decode token payload:', e && (e.message || e));
        }
      }
    }

    // If still no supabaseId, allow a public check if query param provided
    if (!supabaseId) {
      const q = (req.query.supabaseId || req.query.supabase_id || req.query.user_id || '').toString();
      if (q) supabaseId = q;
    }

    if (!supabaseId) {
      return res.status(400).json({ error: 'supabaseId required (pass Authorization header or ?supabaseId=...)' });
    }

    // basic validation for uuid-like id
    if (!/^[0-9a-fA-F-]{30,40}$/.test(supabaseId)) {
      console.warn('[registration/check] invalid supabaseId format:', supabaseId);
    }

    // Check for a user profile in MongoDB
    const profile = await User.findOne({ supabaseId }).lean();

    // Find registrations that may store the supabase id under several keys
    const regs = await Registration.find({
      $or: [ { supabaseId }, { supabase_id: supabaseId }, { user_id: supabaseId } ]
    }).lean();

    console.log(`[registration/check] supabaseId=${supabaseId} foundRegs=${regs.length}`);

    // Helper to determine if a registration document counts as approved
    const isApproved = (r) => {
      if (!r) return false;
      if (r.approved === true) return true;
      if (typeof r.approved === 'string') {
        const v = r.approved.toLowerCase();
        if (v.includes('club') || v.includes('member') || v.includes('approve')) return true;
      }
      if (r.status && typeof r.status === 'string') {
        const s = r.status.toLowerCase();
        if (s.includes('member') || s.includes('approved')) return true;
      }
      if (r.approvedAt) return true;
      if (r.approved === '1' || r.approved === 1) return true;
      return false;
    };

    const anyApproved = regs.some(isApproved);
    if (!anyApproved) {
      console.log('[registration/check] registrations:', JSON.stringify(regs, null, 2));
    }

    if (anyApproved) return res.json({ allowed: true });
    if (regs.length > 0 && !anyApproved) return res.json({ allowed: false, reason: 'registration_not_approved', registrations: regs });
    if (profile) return res.json({ allowed: false, reason: 'registration_missing_but_profile_exists', profile });
    return res.json({ allowed: false, reason: 'not_registered' });
  } catch (err) {
    console.error('[registration/check] error:', err && (err.stack || err.message || err));
    return res.status(500).json({ error: 'Server error verifying membership' });
  }
});

// GET /api/registration/debug
// Returns profile and registration documents (for debugging membership issues).
router.get('/debug', verifySupabase, async (req, res) => {
  try {
    const supabaseId = req.supabaseUser.id;
    const profile = await User.findOne({ supabaseId }).lean();
    const regs = await Registration.find({ supabaseId }).lean();
    return res.json({ supabaseId, profile, registrations: regs });
  } catch (err) {
    console.error('[registration/debug] error:', err && (err.stack || err.message || err));
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;