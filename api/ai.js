// Vercel serverless function. The key lives in an environment variable and never reaches the browser.
import { SYSTEM_PROMPT, validateDraft } from "../src/lib/aiDraft.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  const text = String((req.body && req.body.text) || "").slice(0, 4000);
  if (!text.trim()) return res.status(400).json({ error: "No text" });
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return res.status(200).json({ demo: true });
  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: process.env.AI_MODEL || "claude-sonnet-5-5", max_tokens: 900, system: SYSTEM_PROMPT, messages: [{ role: "user", content: text }] }),
    });
    if (!r.ok) return res.status(200).json({ demo: true });
    const data = await r.json();
    const raw = (data.content || []).map((c) => c.text || "").join("").replace(/```json|```/g, "").trim();
    return res.status(200).json({ draft: validateDraft(JSON.parse(raw), text) });
  } catch {
    return res.status(200).json({ demo: true });
  }
}
