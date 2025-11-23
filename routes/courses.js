const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const Certificate = require('../models/Certificate'); // Import the Certificate model
// NOTE: Admin JWT verification removed for course admin endpoints.
// Authorization should be handled by the admin login UI flow (client-side)
// and any hosting-level protections. This file no longer enforces JWTs.

// Public: list courses
router.get('/', async (req, res) => {
  try {
    const courses = await Course.find().sort({ createdAt: -1 }).lean();
    return res.json({ courses });
  } catch (err) {
    console.error('Error listing courses', err && err.stack ? err.stack : err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Public: get course
router.get('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const course = await Course.findById(id).lean();
    if (!course) return res.status(404).json({ error: 'Course not found' });
    return res.json({ course });
  } catch (err) {
    console.error('Error fetching course', err && err.stack ? err.stack : err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Admin: create course
// NOTE: removed `verifyAdminToken` middleware — requests to this endpoint are allowed
router.post('/', async (req, res) => {
  try {
    const { title, description, modules } = req.body || {};
    if (!title) return res.status(400).json({ error: 'Title required' });
    const course = new Course({ title: String(title).trim(), description: description || '', modules: Array.isArray(modules) ? modules : [] });
    const saved = await course.save();
    return res.status(201).json({ course: saved });
  } catch (err) {
    console.error('Error creating course', err && err.stack ? err.stack : err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Admin: update course
// NOTE: removed `verifyAdminToken` middleware — requests to this endpoint are allowed
router.patch('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const payload = req.body || {};
    const course = await Course.findById(id);
    if (!course) return res.status(404).json({ error: 'Course not found' });
    ['title', 'description', 'modules'].forEach(k => {
      if (Object.prototype.hasOwnProperty.call(payload, k)) course[k] = payload[k];
    });
    const saved = await course.save();
    return res.json({ course: saved });
  } catch (err) {
    console.error('Error updating course', err && err.stack ? err.stack : err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Admin: delete course
// NOTE: removed `verifyAdminToken` middleware — requests to this endpoint are allowed
router.delete('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const course = await Course.findById(id);
    if (!course) return res.status(404).json({ error: 'Course not found' });
    await course.deleteOne();
    return res.json({ message: 'Course deleted' });
  } catch (err) {
    console.error('Error deleting course', err && err.stack ? err.stack : err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Get modules for a course
router.get('/:id/modules', async (req, res) => {
  try {
    const courseId = req.params.id;
    console.log('Fetching modules for courseId:', courseId);

    if (!courseId.match(/^[0-9a-fA-F]{24}$/)) {
      console.error('Invalid courseId format:', courseId);
      return res.status(400).json({ error: 'Invalid courseId format' });
    }

    const course = await Course.findById(courseId).lean();
    if (!course) {
      console.error('Course not found:', courseId);
      return res.status(404).json({ error: 'Course not found' });
    }

    return res.json({ modules: course.modules });
  } catch (err) {
    console.error('Error fetching modules:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Add module to course
// NOTE: removed `verifyAdminToken` middleware — requests to this endpoint are allowed
router.post('/:id/modules', async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ error: 'Course not found' });
    const { title, youtube, description } = req.body;
    course.modules.push({ title, youtube, description });
    await course.save();
    return res.status(201).json({ modules: course.modules });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

// Delete module from course
// NOTE: removed `verifyAdminToken` middleware — requests to this endpoint are allowed
router.delete('/:id/modules/:moduleId', async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ error: 'Course not found' });
    course.modules = course.modules.filter(m => String(m._id) !== req.params.moduleId);
    await course.save();
    return res.json({ modules: course.modules });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

// Add question to module
// NOTE: removed `verifyAdminToken` middleware — requests to this endpoint are allowed
router.post('/:id/modules/:moduleId/questions', async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ error: 'Course not found' });
    const module = course.modules.id(req.params.moduleId);
    if (!module) return res.status(404).json({ error: 'Module not found' });
    const { text, options, answer } = req.body;
    module.questions.push({ text, options, answer });
    await course.save();
    return res.status(201).json({ questions: module.questions });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

// Delete question from module
// NOTE: removed `verifyAdminToken` middleware — requests to this endpoint are allowed
router.delete('/:id/modules/:moduleId/questions/:questionId', async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ error: 'Course not found' });
    const module = course.modules.id(req.params.moduleId);
    if (!module) return res.status(404).json({ error: 'Module not found' });
    module.questions = module.questions.filter(q => String(q._id) !== req.params.questionId);
    await course.save();
    return res.json({ questions: module.questions });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

// Certificate verification route
router.get('/verify-certificate/:searchId', async (req, res) => {
  try {
    const { searchId } = req.params;
    const certificate = await Certificate.findOne({ searchId }).lean();

    if (!certificate) {
      return res.status(404).json({ error: 'Certificate not found' });
    }

    return res.json({
      message: 'Verified certificate',
      certificate,
    });
  } catch (err) {
    console.error('Error verifying certificate', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
