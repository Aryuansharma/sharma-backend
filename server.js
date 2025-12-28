require("dotenv").config();
const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
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
  windowMs: 15 * 60 * 1000, // 15 min
  max: 5,
  message: {
    success: false,
    msg: "Too many requests. Please try again later."
  }
});

/* ---------- HEALTH CHECK ---------- */

app.get("/", (req, res) => {
  res.send("Backend is running");
});

/* ---------- RESEND ---------- */

const resend = new Resend(process.env.RESEND_API_KEY);

/* ---------- CONTACT ROUTE ---------- */

app.post("/send-message", contactLimiter, async (req, res) => {
  try {
    const { name, email, message, website } = req.body;

    // Honeypot (bot trap)
    if (website) {
      return res.status(200).json({ success: true });
    }

    // Validation
    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        msg: "All fields are required"
      });
    }

    if (name.length < 2 || message.length < 5) {
      return res.status(400).json({
        success: false,
        msg: "Invalid input"
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

  } catch (error) {
    console.error("Resend Error:", error);
    res.status(500).json({ success: false, msg: "Failed to send message" });
  }
});

/* ---------- START SERVER ---------- */

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log("Backend running on port", PORT);
});
