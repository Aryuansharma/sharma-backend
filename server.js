require("dotenv").config();
const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const axios = require("axios");
const { Resend } = require("resend");

const app = express();

/* ---------- MIDDLEWARE ---------- */

app.use(cors({
  origin: "https://sharma-logistics-seven.vercel.app"
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ---------- RATE LIMIT ---------- */

const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, msg: "Too many requests. Try later." }
});

/* ---------- HEALTH ---------- */

app.get("/", (req, res) => {
  res.send("Backend is running");
});

/* ---------- RESEND ---------- */

const resend = new Resend(process.env.RESEND_API_KEY);

/* ---------- CONTACT ---------- */

app.post("/send-message", contactLimiter, async (req, res) => {
  try {
    const { name, email, message, website, captcha } = req.body;

    // Honeypot
    if (website) return res.json({ success: true });

    // Validation
    if (!name || !email || !message || !captcha) {
      return res.status(400).json({ success: false, msg: "Invalid data" });
    }

    // Verify reCAPTCHA
    const captchaVerify = await axios.post(
      "https://www.google.com/recaptcha/api/siteverify",
      null,
      {
        params: {
          secret: process.env.RECAPTCHA_SECRET,
          response: captcha
        }
      }
    );

    if (!captchaVerify.data.success) {
      return res.json({ success: false, msg: "Captcha failed" });
    }

    // Send mail
    await resend.emails.send({
      from: "Contact Form <onboarding@resend.dev>",
      to: [process.env.EMAIL_TO],
      subject: "New Contact Message",
      html: `
        <p><b>Name:</b> ${name}</p>
        <p><b>Email:</b> ${email}</p>
        <p>${message}</p>
      `
    });

    res.json({ success: true, msg: "Message sent" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, msg: "Server error" });
  }
});

/* ---------- START ---------- */

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log("Backend running on port", PORT);
});
