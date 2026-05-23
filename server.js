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
  const { description, tone, useCase } = req.body;

  if (!description) {
    return res.status(400).json({ error: "Description is required." });
  }

  const systemPrompt = `You are an expert AI prompt engineer. Transform the user's idea into a precise, powerful, professional prompt for an AI agent. Output ONLY the final prompt — no explanation, no preamble, no markdown.`;

  const userMessage = `Create a high-quality AI prompt for:
Description: ${description}
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

    const generatedPrompt = completion.choices[0]?.message?.content?.trim();
    res.json({ prompt: generatedPrompt });
  } catch (error) {
    console.error("Groq error:", error);
    res.status(500).json({ error: "Failed to generate prompt." });
  }
});

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`PromptFlow backend running on port ${PORT}`));