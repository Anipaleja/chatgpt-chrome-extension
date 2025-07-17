import dotenv from "dotenv-safe";
dotenv.config();
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import OpenAI from "openai";
import { oraPromise } from "ora";
import config from "./config.js";

const app = express().use(cors()).use(bodyParser.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const Config = configure(config);

class Conversation {
  messages = [];

  constructor() {
    // Initialize with system message if there are rules
    if (Config.rules.length > 0) {
      this.messages.push({
        role: "system",
        content: `Please follow these rules when replying:\n${Config.rules.map(rule => `- ${rule}`).join('\n')}`
      });
    }
  }

  async sendMessage(msg) {
    // Add user message
    this.messages.push({
      role: "user",
      content: msg
    });

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: this.messages,
        max_tokens: 1000,
        temperature: 0.7,
      });

      const assistantMessage = response.choices[0].message.content;
      
      // Add assistant response to conversation history
      this.messages.push({
        role: "assistant",
        content: assistantMessage
      });

      return assistantMessage;
    } catch (error) {
      console.error('OpenAI API Error:', error);
      throw error;
    }
  }
}

const conversation = new Conversation();

app.post("/", async (req, res) => {
  try {
    const rawReply = await oraPromise(
      conversation.sendMessage(req.body.message),
      {
        text: req.body.message,
      }
    );
    const reply = await Config.parse(rawReply);
    console.log(`----------\n${reply}\n----------`);
    res.json({ reply });
  } catch (error) {
    console.error('Server Error:', error);
    res.status(500).json({ 
      error: 'Failed to get response from ChatGPT',
      details: error.message 
    });
  }
});

async function start() {
  // Skip training step since we initialize with system message
  await oraPromise(
    Promise.resolve(),
    {
      text: `Initialized ChatGPT with ${Config.rules.length} plugin rules`,
    }
  );
  
  await oraPromise(
    new Promise((resolve) => app.listen(3000, () => resolve())),
    {
      text: `Server running on http://localhost:3000 - You may now use the extension`,
    }
  );
}

function configure({ plugins, ...opts }) {
  let rules = [];
  let parsers = [];

  // Collect rules and parsers from all plugins
  for (const plugin of plugins) {
    if (plugin.rules) {
      rules = rules.concat(plugin.rules);
    }
    if (plugin.parse) {
      parsers.push(plugin.parse);
    }
  }

  // Run the ChatGPT response through all plugin parsers
  const parse = async (reply) => {
    for (const parser of parsers) {
      reply = await parser(reply);
    }
    return reply;
  };
  
  return { parse, rules, ...opts };
}

start();
