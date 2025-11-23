// server/routes/auth.js
// Robust, debug-friendly auth/profile route
// - Upserts user profiles into MongoDB
// - Optional Supabase token verification when SUPABASE_URL + SERVICE_ROLE_KEY present
// - Detailed logs for debugging 500 errors

const express = require('express');
const router = express.Router();
const path = require('path');
const mongoose = require('mongoose');
const { createClient } = require('@supabase/supabase-js');

const User = require('../models/User');

// Optional Supabase admin client (server-only service role)
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
let supabaseAdmin = null;
if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
  supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
} else {
  console.warn('[auth] Supabase admin client not configured. Token verification disabled.');
}

// helper to verify optional Supabase Authorization: Bearer <token>
// If no Authorization header present, caller proceeds (but we log a warning).
async function verifySupabaseIfPresent(req) {
  const auth = req.headers.authorization || '';
  const parts = auth.split(' ');
  const token = parts.length === 2 && parts[0] === 'Bearer' ? parts[1] : null;
  if (!token) return { ok: true, skipped: true };

  if (!supabaseAdmin) {
    // Server isn't configured to verify Supabase tokens. Return 401 so caller gets a clear client-level
    // error instead of a 500 internal server error. The server will log a warning at startup if
    // SUPABASE_* env vars are not set.
    console.warn('[auth] Authorization header present but SUPABASE service role key is not configured. Rejecting token check with 401.');
    return { ok: false, status: 401, error: 'Server not configured to verify Supabase tokens' };
  }

  try {
    const result = await supabaseAdmin.auth.getUser(token);
    if (result.error || !result.data || !result.data.user) {
      return { ok: false, status: 401, error: result.error?.message || 'Invalid or expired token' };
    }
    return { ok: true, user: result.data.user };
  } catch (err) {
    // network or other error
    return { ok: false, status: 502, error: err && (err.message || String(err)) };
  }
}

/**
 * POST /api/auth/profile
 * Body: { supabaseId, email?, name, class, department, version, whatsapp, section }
 */
router.post('/profile', async (req, res) => {
  console.log('[POST /api/auth/profile] incoming request');
  console.log('mongoose readyState:', mongoose.connection && mongoose.connection.readyState);
  console.log('body keys:', Object.keys(req.body || {}));

  try {
    // Optional token verification if Authorization present
    const tokenCheck = await verifySupabaseIfPresent(req);
    if (!tokenCheck.ok) {
      console.warn('[auth] Supabase verification failed:', tokenCheck.error);
      return res.status(tokenCheck.status || 401).json({ error: tokenCheck.error || 'Token verification failed' });
    }
    if (tokenCheck.skipped) {
      console.log('[auth] No Authorization header present — continuing without remote verification');
    } else {
      console.log('[auth] Supabase token verified for user id:', tokenCheck.user?.id);
    }

    const {
      supabaseId,
      email,
      name,
      class: classNum,
      department,
      version,
      whatsapp,
      section
    } = req.body || {};

    // Basic validation: required fields
    const missing = [];
    if (!supabaseId) missing.push('supabaseId');
    if (!name) missing.push('name');
    if (!classNum && classNum !== 0) missing.push('class');
    if (!department) missing.push('department');
    if (!version) missing.push('version');
    if (!whatsapp) missing.push('whatsapp');
    if (!section) missing.push('section');

    if (missing.length) {
      console.warn('[auth] Missing fields:', missing);
      return res.status(400).json({ error: `Missing required fields: ${missing.join(', ')}` });
    }

    // Normalize & basic domain checks
    const classNumber = Number(classNum);
    if (!Number.isInteger(classNumber) || ![9, 10, 11, 12].includes(classNumber)) {
      return res.status(400).json({ error: 'class must be one of 9, 10, 11, 12' });
    }

    const deptLower = String(department).toLowerCase();
    if (!['science', 'bst', 'arts'].includes(deptLower)) {
      return res.status(400).json({ error: "department must be one of: 'science', 'bst', 'arts'" });
    }

    const versionLower = String(version).toLowerCase();
    if (!['english', 'bangla'].includes(versionLower)) {
      return res.status(400).json({ error: "version must be 'english' or 'bangla'" });
    }

    const update = {
      supabaseId: String(supabaseId),
      name: String(name).trim(),
      class: classNumber,
      department: deptLower,
      version: versionLower,
      whatsapp: String(whatsapp).trim(),
      section: String(section).trim(),
      updatedAt: new Date()
    };
    if (email) update.email = String(email).trim().toLowerCase();

    // Check if user exists by supabaseId or email
    const existingQuery = { $or: [{ supabaseId: update.supabaseId }] };
    if (email) existingQuery.$or.push({ email: email.trim().toLowerCase() });
    
    const existing = await User.findOne(existingQuery);
    
    if (existing) {
      // Found existing user - check if it's the same user or a conflict
      if (existing.supabaseId !== update.supabaseId) {
        // Different user - could be email conflict
        if (existing.email === email?.trim().toLowerCase()) {
          console.warn('[auth] Email already registered to different supabaseId');
          return res.status(409).json({ 
            error: 'Email already registered',
            message: 'This email address is already registered to a different account.'
          });
        }
      }
      
      // Same user - check token authorization if present
      if (!tokenCheck.skipped && tokenCheck.user.id !== update.supabaseId) {
        console.warn('[auth] Token user.id does not match supabaseId - possible unauthorized update attempt');
        return res.status(403).json({ error: 'Not authorized to update this profile' });
      }
      
      // Update existing user - use $unset to remove codeNo if present
      const user = await User.findOneAndUpdate(
        { supabaseId: update.supabaseId },
        { 
          $set: update,
          $unset: { codeNo: "" }  // Remove codeNo field if it exists
        },
        { new: true }
      );
      console.log('[auth] Profile updated supabaseId=%s mongoId=%s', update.supabaseId, user._id);
      return res.status(200).json({ message: 'Profile updated', profile: user });
    }
    
    // No existing user found - create new
    try {
      // Explicitly unset codeNo to avoid unique index conflicts
      const userDoc = { ...update };
      delete userDoc.codeNo;  // Ensure codeNo isn't included
      
      const user = new User(userDoc);
      await user.save();
      console.log('[auth] Profile created supabaseId=%s mongoId=%s', update.supabaseId, user._id);
      return res.status(201).json({ message: 'Profile created', profile: user });
    } catch (err) {
      // Handle unique key violations
      if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        console.warn(`[auth] Duplicate ${field} error:`, err.keyValue);
        const message = field === 'email' 
          ? 'This email address is already registered to a different account.'
          : `This ${field} is already in use. Please try again.`;
        return res.status(409).json({ error: `${field} already registered`, message });
      }
      throw err; // Let outer catch handle other errors
    }
  } catch (err) {
    // Mongoose validation errors
    if (err && err.name === 'ValidationError') {
      const details = {};
      for (const k in err.errors) details[k] = err.errors[k].message;
      console.error('[auth] ValidationError:', details);
      return res.status(400).json({ error: 'Validation failed', details });
    }

    // Duplicate key error
    if (err && err.code === 11000) {
      console.error('[auth] Duplicate key error:', err.keyValue || err);
      return res.status(409).json({ error: 'Duplicate key error', key: err.keyValue || null });
    }

    // Unexpected server error - log stack and return safe message
    console.error('[auth] Unexpected error saving profile:', err && (err.stack || err.message || err));
    return res.status(500).json({ error: 'Server error while saving profile', message: err && err.message ? err.message : String(err) });
  }
});

/**
 * GET /api/auth/profile?supabaseId=...
 */
router.get('/profile', async (req, res) => {
  try {
    const { supabaseId } = req.query;
    if (!supabaseId) return res.status(400).json({ error: 'supabaseId query param required' });

    const user = await User.findOne({ supabaseId }).lean();
    if (!user) return res.status(404).json({ error: 'Profile not found' });

    return res.json({ profile: user });
  } catch (err) {
    console.error('[auth] GET /profile error:', err && (err.stack || err.message || err));
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
