const express = require('express');
const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const https = require('https');
const RegistrationRequest = require('../models/RegistrationRequest');
const router = express.Router();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const pdfsDir = path.join(__dirname, '../pdfs');
if (!fs.existsSync(pdfsDir)) {
  fs.mkdirSync(pdfsDir, { recursive: true });
}

// Download Remote Logo
const downloadLogo = (url, filepath) => new Promise((resolve, reject) => {
  https.get(url, (res) => {
    if (res.statusCode === 200) {
      const file = fs.createWriteStream(filepath);
      res.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve(filepath);
      });
    } else {
      reject(new Error(`Logo download failed: ${res.statusCode}`));
    }
  }).on('error', reject);
});

// POST /api/request - Form (Generates Random "No")
router.post('/', async (req, res) => {
  try {
    const { name, class: className, form, version, group, mothers_name, fathers_name, present_address, permanent_address, dob, citizenship_no, mobile_no, hobby, campus, email } = req.body;
    if (!name || !className || !form || !version || !group || !mothers_name || !fathers_name || !present_address || !permanent_address || !dob || !citizenship_no || !mobile_no || !hobby || !campus || !email) {
      return res.status(400).json({ message: 'All fields required' });
    }
    const request = new RegistrationRequest({
      name,
      class: className,
      form,
      version,
      group,
      mothers_name,
      fathers_name,
      present_address,
      permanent_address,
      dob,
      citizenship_no,
      mobile_no,
      hobby,
      campus,
      email
    });
    const saved = await request.save();
    res.status(201).json({ message: 'Request submitted! Admin will contact.', data: saved });
  } catch (error) {
    console.error('Request error:', error);
    res.status(400).json({ message: 'Error', error: error.message });
  }
});

// GET /api/request - All Requests (Admin)
router.get('/', async (req, res) => {
  try {
    const { campus } = req.query;
    const filter = campus ? { campus } : {};
    const requests = await RegistrationRequest.find(filter).sort({ created_at: -1 });
    res.json({ message: 'All requests', data: requests });
  } catch (error) {
    res.status(500).json({ message: 'Error', error: error.message });
  }
});

// PUT /api/request/:id/approve - Approve, Generate PDF (Page 2 with Signature), Email
router.put('/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const request = await RegistrationRequest.findById(id);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // Download Logo
    const logoUrl = 'https://www.tbsnews.net/sites/default/files/styles/author/public/organization/logo/milestone_college.jpg';
    const logoPath = path.join(pdfsDir, 'logo.jpg');
    await downloadLogo(logoUrl, logoPath);

    // Generate PDF (Exact Page 2)
    const doc = new PDFDocument({ layout: 'portrait', size: 'A4' });
    const pdfPath = path.join(pdfsDir, `${id}.pdf`);
    doc.pipe(fs.createWriteStream(pdfPath));

    // Header
    doc.image(logoPath, 50, 30, { width: 55 });
    doc.fontSize(17).text('MILESTONE COLLEGE SCIENCE CLUB', 110, 35, { letterSpacing: 1.5 });
    doc.fontSize(10).text('Sector-11, Uttara Model Town', 110, 50);
    doc.fontSize(10).text('Dhaka-1230', 110, 60);
    doc.fontSize(14).text('MEMBERSHIP FORM', 250, 35, { align: 'center' });
    doc.image('passport-placeholder.jpg', 450, 30, { width: 70, height: 85 });

    // SL NO & No (No SL NO, Only "No:")
    doc.fontSize(11).text('No:', 150, 80);
    doc.text(request.code_no || '', 200, 80);

    // Name & Class
    doc.text('Name:', 50, 100);
    doc.text(request.name || '', 100, 100);
    doc.text('Class:', 250, 100);
    doc.text(request.class || '', 300, 100);

    // Form Valid, Version, Code No
    doc.text('Form:', 50, 120);
    doc.text(request.form || '', 90, 120);
    doc.text('Valid from for the year-20__ ', 50, 140);
    doc.text('Code No:', 450, 140);
    doc.text(request.code_no || '', 500, 140);

    // Signature Section
    doc.text('Moderator', 50, 400);
    const signaturePath = 'E:\\mcc\\mcsc-backend\\moderatorsign.png';
    if (fs.existsSync(signaturePath)) {
      doc.image(signaturePath, 50, 420, { width: 100 });
    }

    doc.end();

    // Wait for PDF
    await new Promise((resolve, reject) => {
      doc.on('end', resolve);
      doc.on('error', reject);
    });

    // Email PDF
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: request.email,
      subject: 'Your Club Membership Form - Approved',
      text: 'Your digital membership form is attached.',
      attachments: [{
        filename: 'membership-form.pdf',
        path: pdfPath
      }]
    };
    const info = await transporter.sendMail(mailOptions);
    console.log('PDF emailed:', info.messageId);

    // Update Status After Success
    request.status = 'Approved';
    await request.save();

    // Cleanup
    fs.unlinkSync(pdfPath);
    fs.unlinkSync(logoPath);

    res.json({ message: 'Request approved! PDF emailed.', data: request });
  } catch (error) {
    console.error('Approve error:', error);
    res.status(500).json({ message: 'Approval failed. Try again.', error: error.message });
  }
});

// POST /api/request/admin-login - Admin login
router.post('/admin-login', (req, res) => {
  const { username, password } = req.body;
  const admins = {
    main: 'main123',
    b22: 'b22pass',
    b27: 'b27pass',
    b7: 'b7pass'
  };
  if (admins[username] === password) {
    res.json({ message: 'Admin logged in', campus: username });
  } else {
    res.status(401).json({ message: 'Invalid credentials' });
  }
});

module.exports = router;