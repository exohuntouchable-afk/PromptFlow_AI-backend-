import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Groq from "groq-sdk";

dotenv.config();

const app = express();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

app.use(cors());
app.use(express.json());

app.post("/api/generate-prompt", async (req, res) => {
  const { description, tone, useCase, category } = req.body;

  if (!description) {
    return res.status(400).json({ error: "Description is required." });
  }

  const systemPrompt = `You are an expert AI prompt engineer. Given a user's request, return ONLY a valid JSON object with no explanation, no markdown, no backticks. The JSON must have exactly these fields:
{
  "prompt": "the generated prompt text",
  "recommendation": {
    "tool": "best AI tool name",
    "reason": "one sentence why"
  },
  "difficulty": "Beginner or Intermediate or Advanced"
}`;

  const userMessage = `Generate for:
Description: ${description}
Category: ${category || "general"}
Tone: ${tone || "professional"}
Use case: ${useCase || "general"}`;

  try {
    const completion = await groq.chat.completions.create({
      model: "llama3-70b-8192",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      temperature: 0.7,
      max_tokens: 800,
    });

    const raw = completion.choices[0]?.message?.content?.trim();
    const parsed = JSON.parse(raw);
    res.json(parsed);
  } catch (error) {
    console.error("Groq error:", error);
    res.status(500).json({ error: "Failed to generate prompt." });
  }
});

app.post("/api/improve-prompt", async (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required." });
  }

  const systemPrompt = `You are an expert AI prompt engineer. Improve the given prompt to make it clearer, more specific, and more effective. Return ONLY a valid JSON object:
{
  "improved": "the improved prompt text",
  "changes": "one sentence describing what you improved"
}`;

  try {
    const completion = await groq.chat.completions.create({
      model: "llama3-70b-8192",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Improve this prompt: ${prompt}` },
      ],
      temperature: 0.7,
      max_tokens: 800,
    });

    const raw = completion.choices[0]?.message?.content?.trim();
    const parsed = JSON.parse(raw);
    res.json(parsed);
  } catch (error) {
    console.error("Groq error:", error);
    res.status(500).json({ error: "Failed to improve prompt." });
  }
});

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => 
  console.log(`PromptFlow backend running on port ${PORT}`)
);