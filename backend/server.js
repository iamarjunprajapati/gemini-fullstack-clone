import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

app.use(express.json({ limit: '10mb' }));
app.use(cors());

// Check if API Key is available
if (!process.env.GEMINI_API_KEY) {
  console.error("FATAL ERROR: GEMINI_API_KEY environment variable is not set.");
  process.exit(1); // Stop the server if key is missing
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

function fileToGenerativePart(base64, mimeType) {
  return {
    inlineData: {
      data: base64.split(',')[1],
      mimeType,
    },
  };
}

// Simple route to check if server is running
app.get('/', (req, res) => {
  res.send('Backend server is live and running!');
});


app.post('/api/chat', async (req, res) => {
  try {
    const { history, prompt, image } = req.body;
    
    const chatHistory = (history || []).map(msg => ({
      role: msg.isUser ? "user" : "model",
      parts: [{ text: msg.text }],
    }));

    const promptParts = [];
    if (image) {
      const match = image.match(/data:(.*);base64,/);
      if (!match) return res.status(400).json({ error: 'Invalid image format' });
      promptParts.push(fileToGenerativePart(image, match[1]));
    }
    if (prompt) {
      promptParts.push({ text: prompt });
    }

    const contents = [...chatHistory, { role: "user", parts: promptParts }];
    const result = await model.generateContent({ contents });
    const response = await result.response;
    
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