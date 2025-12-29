/* ---------- IMPORTS ---------- */
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const { Resend } = require("resend");

/* ---------- APP SETUP ---------- */
const app = express();

app.use(cors({
  origin: "https://sharma-logistics-seven.vercel.app"
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ---------- RATE LIMIT ---------- */
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    msg: "Too many requests. Try later."
  }
});

/* ---------- RESEND ---------- */
const resend = new Resend(process.env.RESEND_API_KEY);

/* ---------- HEALTH CHECK ---------- */
app.get("/", (req, res) => {
  res.send("Backend is running");
});

/* ---------- CONTACT FORM ---------- */
app.post("/send-message", contactLimiter, async (req, res) => {
  try {
    const { name, email, message, website, captchaToken } = req.body;

    // Honeypot
    if (website) {
      return res.status(200).json({ success: true });
    }

    if (!captchaToken) {
      return res.status(400).json({
        success: false,
        msg: "Captcha missing"
      });
    }

    // Verify captcha
    const captchaRes = await fetch(
      "https://www.google.com/recaptcha/api/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${captchaToken}`
      }
    );

    const captchaData = await captchaRes.json();

    if (!captchaData.success) {
      return res.status(403).json({
        success: false,
        msg: "Captcha failed"
      });
    }

    // Send email
    await resend.emails.send({
      from: "Contact Form <onboarding@resend.dev>",
      to: [process.env.EMAIL_TO],
      subject: "New Contact Form Message",
      html: `
        <h3>New Message</h3>
        <p><b>Name:</b> ${name}</p>
        <p><b>Email:</b> ${email}</p>
        <p><b>Message:</b><br/>${message}</p>
      `
    });

    res.status(200).json({ success: true, msg: "Message sent" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, msg: "Server error" });
  }
});

/* ---------- START SERVER ---------- */
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log("Backend running on port", PORT);
});
