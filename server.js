require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { Resend } = require("resend");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get("/", (req, res) => {
  res.send("Backend is running");
});

// Resend setup
const resend = new Resend(process.env.RESEND_API_KEY);

// Contact form API
app.post("/send-message", async (req, res) => {
  try {
    const { name, email, message } = req.body;

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

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log("Backend running on port", PORT);
});
