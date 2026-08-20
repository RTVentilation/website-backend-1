require('dotenv').config();
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const rateLimit = require('express-rate-limit');

const app = express();

app.use(cors({
  origin: 'https://rtventilation.ie',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
}));

app.options('*', cors());

app.use(express.json());

app.use('/send', rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { error: 'Too many requests, please try again later.' }
}));

app.post('/send', async (req, res) => {
  const { name, email, phone, service, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  try {
    await transporter.sendMail({
      from: `"RT Ventilation" <${process.env.SMTP_USER}>`,
      to: 'rtventilation@gmail.com',
      replyTo: email,
      subject: 'New Contact Form Submission – RT Ventilation',
      html: `
        <h3>New Contact Form Submission</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone || 'N/A'}</p>
        <p><strong>Service:</strong> ${service || 'N/A'}</p>
        <p><strong>Message:</strong><br>${message}</p>
      `,
    });

    await transporter.sendMail({
      from: `"RT Ventilation" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Thanks for contacting RT Ventilation',
      html: `
        <p>Hi ${name},</p>
        <p>Thank you for contacting <strong>RT Ventilation</strong>.</p>
        <p>We have received your message and will get back to you as soon as possible.</p>
        <br>
        <p><strong>Your message:</strong></p>
        <p>${message}</p>
        <br>
        <p>Kind regards,<br>RT Ventilation</p>
      `,
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Email error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`RT Ventilation backend running on port ${PORT}`);
});
