require("dotenv").config();
const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));  // REQUIRED

// Health check
app.get("/", (req, res) => res.send("Backend is running"));

// Email transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Contact form route
app.post("/send-message", async (req, res) => {
  try {
    const { name, email, message } = req.body;

    const mailOptions = {
      from: email,
      to: process.env.EMAIL_USER,
      subject: "New Contact Form Message",
      text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`
    };

    await transporter.sendMail(mailOptions);

    return res.json({ success: true, msg: "Message sent!" });
  } catch (error) {
    console.error("Error sending email:", error);
    return res.json({ success: false, msg: "Failed to send" });
  }
});

const PORT = process.env.PORT || 5500;
app.listen(PORT, () => console.log(`Backend running → http://localhost:${PORT}`));
