// Shared by the browser (demo fallback) and the server endpoint (api/ai.js).
export const FIELD_KEYS = ["what_happened", "when", "where", "who", "asked_for"];
export const FIELD_LABEL = { what_happened: "What happened", when: "When", where: "Where", who: "Who was involved", asked_for: "What was asked for" };
export const NOT_STATED = "not stated";

export const SYSTEM_PROMPT = `You help a citizen organise a complaint about a government official. You draft; a human reviewer decides everything.
Return ONLY a JSON object, no other text, with exactly these keys: what_happened, when, where, who, asked_for.
Each key maps to {"value": "...", "source": "..."}.
Rules:
- "source" must be an exact, word-for-word quote copied from the citizen's account that supports the value. If you cannot quote it, use value "not stated" and source "".
- Never guess or add details that are not in the account. Missing means "not stated".
- Use "alleged" and "complaint". Never say anyone is guilty, corrupt or lying. Draw no conclusions.
- Write each value in the same language as the account.`;

const norm = (s) => String(s || "").toLowerCase().replace(/\s+/g, " ").trim();

// Keeps a field only if its source quote really appears in the citizen's words. Otherwise it becomes "not stated".
export function validateDraft(raw, text) {
  const t = norm(text), out = {};
  for (const k of FIELD_KEYS) {
    const f = raw && raw[k];
    const q = f && typeof f.source === "string" ? f.source.trim() : "";
    const v = f && typeof f.value === "string" ? f.value.trim() : "";
    out[k] = v && v.toLowerCase() !== NOT_STATED && q && t.includes(norm(q)) ? { value: v, source: q } : { value: NOT_STATED, source: "" };
  }
  return out;
}

// Rule-based draft used when no AI key is set. Every value is a quote, so nothing is invented.
export function demoDraft(text) {
  const sentences = text.split(/(?<=[.!?\u0964])\s+/).map((s) => s.trim()).filter(Boolean);
  const pick = (re) => { const m = text.match(re); return m ? { value: m[0].trim(), source: m[0].trim() } : null; };
  const asked = sentences.find((s) => /(\u20b9|rs\.?\s?\d|rupees|money|bribe|payment|\bpay\b|\bpaid\b)/i.test(s));
  return validateDraft({
    what_happened: sentences[0] ? { value: sentences[0], source: sentences[0] } : null,
    when: pick(/\b(yesterday|today|this morning|last (?:week|month|monday|tuesday|wednesday|thursday|friday|saturday|sunday)|\d{1,2}[\/-]\d{1,2}(?:[\/-]\d{2,4})?|\d{1,2} (?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*(?: \d{4})?)\b/i),
    where: pick(/\b(?:[\w']+\s+){0,3}(?:office|hospital|police station|school|ward|department|counter|chowki)(?:\s+\d+)?\b/i),
    who: pick(/\b(?:(?:the|a)\s+)?(?:\w+\s+)?(?:clerk|officer|inspector|constable|doctor|principal|teacher|peon|staff|official|patwari)\b/i),
    asked_for: asked ? { value: asked, source: asked } : null,
  }, text);
}

export async function requestDraft(text) {
  try {
    const r = await fetch("/api/ai", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text }) });
    const j = await r.json();
    if (j && j.draft) return { draft: validateDraft(j.draft, text), mode: "ai" };
  } catch { /* fall through to the demo result */ }
  return { draft: demoDraft(text), mode: "demo" };
}
