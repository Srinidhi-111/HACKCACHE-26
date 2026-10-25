import { computeState } from "./escalation";
import { computeFlags } from "./flags";

// One place decides what each role may see. Every screen gets its data from here,
// so a field that is not returned here cannot show up on screen by mistake.
export const ROLES = ["Citizen", "Office official", "Reviewer", "Public", "Admin"];
export const ROLE_NOTE = {
  Citizen: "You see your own complaint, your own details and your own evidence. Witness names are hidden from you here too.",
  "Office official": "You see the category, the office and a summary the reviewer approved, with identifying details removed. No name, phone number, witness or evidence.",
  Reviewer: "You see everything, including the complainant's identity, the witness and the evidence. You approve what the office is allowed to see.",
  Public: "You see only the complaint ID, department, office, category, status and the timeline. No details, no evidence, no notes.",
  Admin: "You can run the demo tools. You see what the public sees, plus fingerprints. You cannot edit or delete anything.",
};

function actorLabel(role, actor) {
  if (role === "Reviewer") return actor;
  const kind = actor.startsWith("Citizen") ? "citizen" : actor.startsWith("Office") ? "office" : actor.startsWith("Reviewer") ? "reviewer" : "system";
  if (kind === "citizen") return role === "Citizen" ? "You" : "Complainant";
  return { office: "Office", reviewer: "Reviewer", system: "System (automatic)" }[kind];
}

function shapeData(role, e) {
  const d = e.data || {};
  switch (e.type) {
    case "submitted": return {};
    case "evidence_added":
      if (role === "Reviewer" || role === "Citizen") return { note: d.note, fileName: d.fileName, size: d.size, sha256: d.sha256 };
      return { note: role === "Office official" ? "Evidence added. It is held by the reviewer." : "Evidence added. Evidence is never public." };
    case "redaction_approved": return { note: role === "Reviewer" ? "Summary approved for the office." : "Reviewer approved the summary the office sees." };
    case "acknowledged": case "investigation_started": case "update": case "response":
      return role === "Public" || role === "Admin" ? {} : { note: d.note, expectedDate: d.expectedDate };
    default: return { note: d.note, notice: d.notice };
  }
}

const shapeEvent = (role, e) => ({ id: e.id, seq: e.seq, type: e.type, at: e.at, actor: actorLabel(role, e.actor), hash: e.hash, prevHash: e.prevHash, data: shapeData(role, e) });
const group = (events) => {
  const m = new Map();
  for (const e of events) { if (!m.has(e.complaintId)) m.set(e.complaintId, []); m.get(e.complaintId).push(e); }
  for (const l of m.values()) l.sort((a, b) => a.seq - b.seq);
  return m;
};

export function listComplaints(role, events, now) {
  const rows = [];
  for (const [id, evs] of group(events)) {
    if (evs[0].type !== "submitted") continue;
    const st = computeState(evs, now);
    rows.push({ id, category: evs[0].data.category, department: evs[0].data.department, office: evs[0].data.office, status: st.status, with: st.office });
  }
  return rows;
}

export function complaintView(role, events, id, now) {
  const evs = group(events).get(id);
  if (!evs) return null;
  const f = evs[0].data;
  const approved = [...evs].reverse().find((e) => e.type === "redaction_approved");
  let head = { category: f.category, department: f.department, office: f.office };
  if (role === "Citizen") head = { ...head, description: f.description, complainant: f.complainant, report: f.report };
  if (role === "Reviewer") head = { ...head, description: f.description, complainant: f.complainant, witness: f.witness, report: f.report, aiDraft: f.aiDraft, aiMode: f.aiMode, flags: computeFlags(events, id), summary: approved ? approved.data.summary : null, approved: !!approved };
  if (role === "Office official") head = { ...head, summary: approved ? approved.data.summary : null };
  return { id, head, state: computeState(evs, now), timeline: evs.map((e) => shapeEvent(role, e)) };
}

// Suggested summary for the reviewer: names, phone and witness replaced. The reviewer edits and approves it.
export function redactDraft(text, secrets) {
  const parts = [];
  for (const s of secrets.filter(Boolean)) {
    parts.push(s);
    for (const w of s.split(/\s+/)) if (w.replace(/[^\w]/g, "").length >= 3 && !/^\(?sample\)?$/i.test(w)) parts.push(w);
  }
  let out = text || "";
  for (const p of parts.sort((a, b) => b.length - a.length)) out = out.split(p).join("[removed]");
  return out;
}
