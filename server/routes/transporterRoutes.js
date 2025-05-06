// server/routes/email.js (example route)
const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");

router.post("/send-email", async (req, res) => {
  const { to, subject, html } = req.body;

  try {
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.EMAIL_USER, // sender email
        pass: process.env.EMAIL_PASS, // app password or actual password
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL,
      to,
      subject,
      html,
    });

    res.status(200).send("Email sent");
  } catch (err) {
    console.error("Error sending email:", err);
    res.status(500).send("Failed to send email");
  }
});

module.exports = router;
