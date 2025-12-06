// server/routes/journal.js
const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const Journal = require('../models/Journal');

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

let supabaseAdmin = null;
if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
  supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
} else {
  console.warn('[journal] Supabase admin client not configured. Token verification will fail if attempted.');
}

// Middleware: verify Supabase token and attach user object to req.supabaseUser
async function verifySupabase(req, res, next) {
  if (!supabaseAdmin) {
    return res.status(500).json({ error: 'Server not configured to verify Supabase tokens.' });
  }

  const auth = req.headers.authorization || '';
  const parts = auth.split(' ');
  const token = parts.length === 2 && parts[0] === 'Bearer' ? parts[1] : null;
  if (!token) return res.status(401).json({ error: 'Authorization token required' });

  try {
    const result = await supabaseAdmin.auth.getUser(token);
    if (result.error || !result.data || !result.data.user) {
      return res.status(401).json({ error: result.error?.message || 'Invalid or expired token' });
    }
    req.supabaseUser = result.data.user;
    next();
  } catch (err) {
    console.error('[journal] Supabase verification error', err && err.message ? err.message : err);
    return res.status(502).json({ error: 'Network error verifying token with Supabase.' });
  }
}

/**
 * POST /api/journal
 * Body: { title, headerSize, fontFamily, color, bodyHtml, latexSnippets }
 * Requires Supabase Authorization: Bearer <access_token>
 */
router.post('/', verifySupabase, async (req, res) => {
  try {
    const {
      title,
      headerSize = 'h2',
      fontFamily,
      color = '#0f172a',
      bodyHtml,
      latexSnippets = [],
      isDraft = false
    } = req.body || {};

    // For drafts, title may be optional; for published entries require a title and body
    if (!bodyHtml || (!isDraft && !title)) {
      return res.status(400).json({ error: 'bodyHtml is required; title is required for published journals' });
    }

    const journal = new Journal({
      title: title ? String(title).trim() : '',
      headerSize: ['h1', 'h2', 'h3'].includes(headerSize) ? headerSize : 'h2',
      fontFamily: fontFamily || 'Inter, system-ui, sans-serif',
      color: color || '#0f172a',
      bodyHtml: String(bodyHtml),
      latexSnippets: Array.isArray(latexSnippets) ? latexSnippets : [],
      authorSupabaseId: req.supabaseUser.id,
      authorEmail: req.supabaseUser.email || null,
      authorName: req.supabaseUser.user_metadata?.full_name || req.supabaseUser.email || null,
      isDraft: Boolean(isDraft),
      // New approval workflow: journals require admin approval before being published.
      // When a user submits (isDraft=false) we do NOT set publishedAt or approved; an admin must approve.
      approved: false,
      approvedBy: null,
      approvedAt: null,
      publishedAt: null
    });

    const saved = await journal.save();
    return res.status(201).json({ message: 'Journal saved', journal: saved });
  } catch (err) {
    console.error('[journal] save error', err && (err.stack || err.message || err));
    return res.status(500).json({ error: 'Server error while saving journal', message: err && err.message ? err.message : String(err) });
  }
});


/**
 * PUT /api/journal/:id
 * Update an existing journal (save draft or publish)
 * Requires owner authentication
 */
router.put('/:id', verifySupabase, async (req, res) => {
  try {
    const id = req.params.id;
    const payload = req.body || {};

    const journal = await Journal.findById(id);
    if (!journal) return res.status(404).json({ error: 'Not found' });

    if (String(journal.authorSupabaseId) !== String(req.supabaseUser.id)) {
      return res.status(403).json({ error: 'Not authorized to edit this journal' });
    }

    // Update allowed fields
    const allowed = ['title', 'headerSize', 'fontFamily', 'color', 'bodyHtml', 'latexSnippets', 'isDraft'];
    allowed.forEach((k) => {
      if (Object.prototype.hasOwnProperty.call(payload, k)) {
        journal[k] = payload[k];
      }
    });

    // If the author publishes (isDraft -> false), keep approved=false and publishedAt null.
    // An admin must approve to set publishedAt and approved=true.
    if (payload.hasOwnProperty('isDraft') && payload.isDraft === false) {
      journal.approved = false;
      journal.approvedBy = null;
      journal.approvedAt = null;
      journal.publishedAt = null;
    }

    const saved = await journal.save();
    return res.json({ message: 'Journal updated', journal: saved });
  } catch (err) {
    console.error('[journal] update error', err && (err.stack || err));
    return res.status(500).json({ error: 'Server error' });
  }
});

/**
 * DELETE /api/journal/:id
 * Owner-only delete
 */
router.delete('/:id', verifySupabase, async (req, res) => {
  try {
    const id = req.params.id;
    const journal = await Journal.findById(id);
    if (!journal) return res.status(404).json({ error: 'Not found' });

    if (String(journal.authorSupabaseId) !== String(req.supabaseUser.id)) {
      return res.status(403).json({ error: 'Not authorized to delete this journal' });
    }

    await journal.deleteOne();
    return res.json({ message: 'Journal deleted' });
  } catch (err) {
    console.error('[journal] delete error', err && (err.stack || err));
    return res.status(500).json({ error: 'Server error' });
  }
});

/**
 * GET /api/journal
 * Query: ?limit=&skip=&sortBy=&search=&timeFilter=
 * Public list of journals
 */
router.get('/', async (req, res) => {
  try {
    const limit = Math.min(50, Number(req.query.limit) || 20);
    const skip = Math.max(0, Number(req.query.skip) || 0);
    const sortBy = req.query.sortBy || 'recent'; // 'recent' or 'engagement'
    const search = req.query.search || '';
    const timeFilter = req.query.timeFilter || ''; // '24h', 'week', 'month'

    // By default, only return published journals (isDraft: false and approved: true).
    // If ?mine=true and a valid Supabase token is provided, include the user's own journals (including drafts and unapproved) in the result.
    const mine = req.query.mine === 'true';
    // Default filter: non-draft, approved
    let filter = { isDraft: false, approved: true };

    if (mine) {
      // try to verify supabase token and include owner's journals as well
      const auth = req.headers.authorization || '';
      const parts = auth.split(' ');
      const token = parts.length === 2 && parts[0] === 'Bearer' ? parts[1] : null;
      if (token && supabaseAdmin) {
        try {
          const result = await supabaseAdmin.auth.getUser(token);
          const user = result?.data?.user;
          if (user) {
            // Return either published journals OR any journal authored by the user
            filter = { $or: [{ isDraft: false, approved: true }, { authorSupabaseId: user.id }] };
          }
        } catch (err) {
          // ignore verification errors and fall back to showing only published
          console.warn('[journal] mine verification failed', err && err.message);
        }
      }
    }

    // support authorId filter to list works by an author (only published/approved unless requesting owner via mine=true)
    if (req.query.authorId) {
      // if filter is an $or structure, we need to embed author constraint into the published branch
      if (filter.$or && Array.isArray(filter.$or)) {
        filter = { $or: [ { isDraft: false, approved: true, authorSupabaseId: req.query.authorId }, { authorSupabaseId: req.query.authorId } ] };
      } else {
        filter = { ...filter, authorSupabaseId: req.query.authorId };
      }
    }

    // Search filter
    if (search) {
      filter.title = { $regex: search, $options: 'i' };
    }

    // Time filter
    if (timeFilter) {
      const now = new Date();
      let timeThreshold;
      if (timeFilter === '24h') {
        timeThreshold = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      } else if (timeFilter === 'week') {
        timeThreshold = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else if (timeFilter === 'month') {
        timeThreshold = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }
      if (timeThreshold) {
        filter.publishedAt = { $gte: timeThreshold };
      }
    }

    // Sort order
    let sortOrder = { createdAt: -1 };
    if (sortBy === 'engagement') {
      sortOrder = { engagementScore: -1, createdAt: -1 };
    }

    const journals = await Journal.find(filter).sort(sortOrder).skip(skip).limit(limit).lean();
    const total = await Journal.countDocuments(filter);
    
    return res.json({ journals, total, hasMore: skip + journals.length < total });
  } catch (err) {
    console.error('[journal] list error', err && (err.stack || err));
    return res.status(500).json({ error: 'Server error' });
  }
});

/**
 * GET /api/journal/contributors
 * Get list of journal contributors
 */
router.get('/contributors', async (req, res) => {
  try {
    const JournalContributor = require('../models/JournalContributor');
    const contributors = await JournalContributor.find().sort({ order: 1 }).lean();
    return res.json({ contributors });
  } catch (err) {
    console.error('[journal] contributors error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

/**
 * GET /api/journal/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const journal = await Journal.findById(id).lean();
    if (!journal) return res.status(404).json({ error: 'Not found' });
    // If the journal is not approved yet, allow the author to view it with a valid Supabase token.
    if (!journal.approved) {
      const auth = req.headers.authorization || '';
      const parts = auth.split(' ');
      const token = parts.length === 2 && parts[0] === 'Bearer' ? parts[1] : null;
      if (!token || !supabaseAdmin) {
        return res.status(404).json({ error: 'Not found' });
      }
      try {
        const result = await supabaseAdmin.auth.getUser(token);
        const user = result?.data?.user;
        if (!user || String(user.id) !== String(journal.authorSupabaseId)) {
          return res.status(404).json({ error: 'Not found' });
        }
        // author authenticated: return the journal
        return res.json({ journal });
      } catch (err) {
        return res.status(404).json({ error: 'Not found' });
      }
    }

    return res.json({ journal });
  } catch (err) {
    console.error('[journal] get error', err && (err.stack || err));
    return res.status(500).json({ error: 'Server error' });
  }
});

/**
 * POST /api/journal/:id/like
 * Toggle like on a journal
 */
router.post('/:id/like', verifySupabase, async (req, res) => {
  try {
    const id = req.params.id;
    const userId = req.supabaseUser.id;
    
    const journal = await Journal.findById(id);
    if (!journal) return res.status(404).json({ error: 'Not found' });
    
    if (!journal.likes) journal.likes = [];
    
    const likeIndex = journal.likes.indexOf(userId);
    if (likeIndex > -1) {
      // Unlike
      journal.likes.splice(likeIndex, 1);
    } else {
      // Like
      journal.likes.push(userId);
    }
    
    await journal.save();
    return res.json({ message: 'Like toggled', likes: journal.likes.length, liked: likeIndex === -1 });
  } catch (err) {
    console.error('[journal] like error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

/**
 * POST /api/journal/:id/comment
 * Add a comment to a journal
 * Body: { text }
 */
router.post('/:id/comment', verifySupabase, async (req, res) => {
  try {
    const id = req.params.id;
    const { text } = req.body || {};
    
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Comment text is required' });
    }
    
    const journal = await Journal.findById(id);
    if (!journal) return res.status(404).json({ error: 'Not found' });
    
    if (!journal.comments) journal.comments = [];
    
    const comment = {
      userId: req.supabaseUser.id,
      userName: req.supabaseUser.user_metadata?.full_name || req.supabaseUser.email || 'Anonymous',
      userEmail: req.supabaseUser.email,
      text: text.trim(),
      createdAt: new Date()
    };
    
    journal.comments.push(comment);
    await journal.save();
    
    return res.json({ message: 'Comment added', comment, commentsCount: journal.comments.length });
  } catch (err) {
    console.error('[journal] comment error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

/**
 * POST /api/journal/:id/sticker
 * Add a sticker reaction to a journal
 * Body: { sticker } - emoji string like '❤️', '👍', '🎉', '🔥', '💯'
 */
router.post('/:id/sticker', verifySupabase, async (req, res) => {
  try {
    const id = req.params.id;
    const { sticker } = req.body || {};
    
    if (!sticker) {
      return res.status(400).json({ error: 'Sticker is required' });
    }
    
    const journal = await Journal.findById(id);
    if (!journal) return res.status(404).json({ error: 'Not found' });
    
    if (!journal.stickers) journal.stickers = new Map();
    
    const currentCount = journal.stickers.get(sticker) || 0;
    journal.stickers.set(sticker, currentCount + 1);
    
    await journal.save();
    
    return res.json({ message: 'Sticker added', stickers: Object.fromEntries(journal.stickers) });
  } catch (err) {
    console.error('[journal] sticker error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;