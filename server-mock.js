import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import { oraPromise } from "ora";

const app = express().use(cors()).use(bodyParser.json());

// Mock responses for testing
const mockResponses = [
  "This is a mock response from the ChatGPT extension! The extension is working correctly.",
  "Hello! This is a test response. Your Chrome extension is successfully communicating with the server.",
  "Great! The connection is working. This is a mock ChatGPT response for testing purposes.",
  "Extension test successful! This mock server confirms that your Chrome extension fixes are working.",
  "Mock ChatGPT says: Your extension is now properly handling connections and context menus!"
];

app.post("/", async (req, res) => {
  try {
    const userMessage = req.body.message;
    console.log(`Received message: "${userMessage}"`);
    
    // Simulate processing time
    await oraPromise(
      new Promise(resolve => setTimeout(resolve, 1000)),
      {
        text: userMessage,
      }
    );
    
    // Return a mock response
    const mockReply = mockResponses[Math.floor(Math.random() * mockResponses.length)];
    console.log(`----------\n${mockReply}\n----------`);
    res.json({ reply: mockReply });
  } catch (error) {
    console.error('Server Error:', error);
    res.status(500).json({ 
      error: 'Server error',
      details: error.message 
    });
  }
});

async function start() {
  await oraPromise(
    new Promise((resolve) => app.listen(3000, () => resolve())),
    {
      text: `Mock server running on http://localhost:3000 - Extension ready for testing!`,
    }
  );
}

start();
