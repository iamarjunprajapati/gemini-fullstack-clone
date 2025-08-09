import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

// JSON payload ki limit badhayein taaki badi image aa sake
app.use(express.json({ limit: '10mb' }));
app.use(cors());

// Gemini client ko initialize karein
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Base64 image ko Gemini ke format mein badalne ka function
function fileToGenerativePart(base64, mimeType) {
  return {
    inlineData: {
      data: base64.split(',')[1],
      mimeType,
    },
  };
}

// API endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { history, prompt, image } = req.body;

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

    // History ko Gemini ke format mein taiyaar karein
    // Ismein user dwara bheji gayi image ko shaamil nahi kiya gaya hai, kyonki vo sirf display ke liye thi
    const chatHistory = (history || []).map(msg => ({
      role: msg.isUser ? "user" : "model",
      parts: [{ text: msg.text }],
    }));

    // Naye message (prompt + image) ke parts taiyaar karein
    const promptParts = [];

    if (image) {
      const match = image.match(/data:(.*);base64,/);
      if (!match) {
        return res.status(400).json({ error: 'Invalid image format' });
      }
      const mimeType = match[1];
      const imagePart = fileToGenerativePart(image, mimeType);
      promptParts.push(imagePart);
    }
    
    if (prompt) {
      promptParts.push({ text: prompt });
    } else if (image) {
      // Agar sirf image hai, to ek default prompt daal sakte hain
      promptParts.push({ text: "Is chitr ka vivaran dein." });
    }

    // History aur naye message ko ek saath jodein
    const contents = [...chatHistory, { role: "user", parts: promptParts }];

    // API ko request bhejein
    const result = await model.generateContent({ contents });

    const response = await result.response;

    // === AAPKE LIYE LOGGING ===
    // Backend terminal mein response ko print karein
    console.log("Gemini API Response:", JSON.stringify(response, null, 2));
    
    const text = response.text();
    res.status(200).json({ response: text });

  } catch (error) {
    console.error('Error in /api/chat:', error);
    res.status(500).json({ error: 'Failed to get response from Gemini' });
  }
});

app.listen(port, () => {
  console.log(`Backend server is running on http://localhost:${port}`);
});