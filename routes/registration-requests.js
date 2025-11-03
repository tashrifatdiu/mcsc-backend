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

// Download remote logo
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

// POST /api/request - Create request (protected)
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

// GET /api/request - All requests (admin - protected)
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

// PUT /api/request/:id/approve - Approve, generate PDF, email (protected)
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

    // Generate PDF
    const doc = new PDFDocument();
    const pdfPath = path.join(pdfsDir, `${id}.pdf`);
    doc.pipe(fs.createWriteStream(pdfPath));

    // Header (Local Logo)
    doc.image(logoPath, 50, 30, { width: 50 });
    doc.fontSize(14).text('MILESTONE COLLEGE SCIENCE CLUB', 110, 35);
    doc.fontSize(10).text('Sector-11, Uttara Model Town', 110, 50);
    doc.fontSize(12).text('MEMBERSHIP FORM', 250, 35, { align: 'center' });
    doc.image('passport-placeholder.jpg', 450, 30, { width: 60 });

    // Table
    doc.fontSize(10).text('SL NO: 701', 50, 80);
    doc.text('No:', 150, 80);
    doc.text('Class:', 250, 80);
    doc.text('IX', 300, 80);
    doc.text('X', 330, 80);
    doc.text('XI', 360, 80);
    doc.text('XII', 390, 80);
    doc.text('Code No:', 450, 80);
    doc.text('2 7 6 8 3 1 6', 500, 80);

    // Fields
    doc.text('1. Name (English):', 50, 100);
    doc.text(request.name || '', 150, 100);
    doc.text('Version:', 50, 140);
    doc.text('Bangla', 120, 140);
    doc.text('English', 180, 140);
    doc.text('Group:', 50, 160);
    doc.text('Sc.', 100, 160);
    doc.text('B.St', 130, 160);
    doc.text('Hum.', 160, 160);
    doc.text('Form:', 50, 180);
    doc.text(request.form || '', 90, 180);

    doc.text("2. Mother's Name:", 50, 200);
    doc.text(request.mothers_name || '', 180, 200);
    doc.text("3. Father's Name:", 50, 220);
    doc.text(request.fathers_name || '', 180, 220);
    doc.text('4. Present Address:', 50, 240);
    doc.text(request.present_address || '', 180, 240);
    doc.text('5. Permanent Address:', 50, 260);
    doc.text(request.permanent_address || '', 180, 260);
    doc.text('6. Date of Birth:', 50, 280);
    doc.text(request.dob || '', 180, 280);
    doc.text('7. Citizenship No:', 50, 300);
    doc.text(request.citizenship_no || '', 180, 300);
    doc.text('8. Telephone/Mobile No:', 50, 320);
    doc.text(request.mobile_no || '', 180, 320);
    doc.text('9. Hobby:', 50, 340);
    doc.text(request.hobby || '', 180, 340);

    // Footer
    doc.text('Membership valid for the year-20__ Code No: ______', 50, 360);
    doc.text('Moderator', 50, 400);
    doc.text('Applicant', 300, 400);

    // Add Signature PNG
    const signaturePath = path.join(__dirname, '..', 'moderatorsign.png');
    if (fs.existsSync(signaturePath)) {
      doc.image(signaturePath, 50, 420, { width: 100 });
    }

    doc.end();

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
    await transporter.sendMail(mailOptions);

    // Update Status
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

// POST /api/request/admin-login - Admin login (unprotected)
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