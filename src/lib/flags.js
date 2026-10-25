import { FIELD_KEYS, FIELD_LABEL, NOT_STATED } from "./aiDraft";

// Flags are prompts for a human reviewer ("worth a closer look"). They never decide anything.
const words = (s) => new Set(String(s || "").toLowerCase().match(/[\p{L}\p{N}]+/gu) || []);
function sim(a, b) {
  const A = words(a), B = words(b);
  if (!A.size || !B.size) return 0;
  let both = 0;
  for (const w of A) if (B.has(w)) both++;
  return both / (A.size + B.size - both);
}

export function computeFlags(events, id) {
  const subs = events.filter((e) => e.type === "submitted");
  const me = subs.find((e) => e.complaintId === id);
  if (!me) return [];
  const flags = [];
  const mine = new Set(events.filter((e) => e.complaintId === id && e.type === "evidence_added").map((e) => e.data.sha256));
  const sameFile = [...new Set(events.filter((e) => e.type === "evidence_added" && e.complaintId !== id && mine.has(e.data.sha256)).map((e) => e.complaintId))];
  if (sameFile.length) flags.push({ kind: "Possible duplicate", reason: `The same evidence file also appears in ${sameFile.join(", ")}.` });

  const similar = subs.filter((o) => o.complaintId !== id && sim(o.data.description, me.data.description) >= 0.6);
  const near = similar.filter((o) => o.data.office === me.data.office && Math.abs(new Date(o.at) - new Date(me.at)) <= 3600000);
  if (near.length >= 2) flags.push({ kind: "Possible coordinated submissions", reason: `${near.length + 1} very similar complaints about the same office arrived within an hour: ${near.map((o) => o.complaintId).join(", ")}.` });
  else if (similar.length) flags.push({ kind: "Possible duplicate", reason: `The wording is very similar to ${similar.map((o) => o.complaintId).join(", ")}.` });

  if (me.data.report) {
    const missing = FIELD_KEYS.filter((k) => !me.data.report[k] || me.data.report[k].value === NOT_STATED);
    if (missing.length) flags.push({ kind: "Missing information", reason: `Not stated: ${missing.map((k) => FIELD_LABEL[k].toLowerCase()).join(", ")}.` });
  }
  return flags;
}
