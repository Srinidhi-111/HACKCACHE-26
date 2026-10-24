import { DEADLINES } from "../data/config";
import { chainFor } from "../data/authorities";
const DAY = 86400000;

// Works out where a complaint is right now, purely from its list of events.
// It never changes anything. store.js decides what to write when something is due.
export function computeState(events, nowMs) {
  const first = events[0];
  const chain = chainFor(first.data.department);
  let level = 0, arrival = new Date(first.at).getTime();
  let acked = false, responded = false, inv = false, lastUpdate = 0, reachedTop = false;
  for (const e of events) {
    const t = new Date(e.at).getTime();
    if (e.type === "escalated") { level = e.data.toLevel; arrival = t; acked = false; responded = false; inv = false; lastUpdate = 0; reachedTop = false; }
    else if (e.type === "acknowledged") acked = true;
    else if (e.type === "investigation_started") { inv = true; lastUpdate = t; }
    else if (e.type === "update" && inv) lastUpdate = t;
    else if (e.type === "response") responded = true;
    else if (e.type === "reached_top") reachedTop = true;
  }
  const ackDue = arrival + DEADLINES.acknowledgeDays * DAY;
  const respondDue = arrival + DEADLINES.respondDays * DAY;
  const updateDue = inv ? lastUpdate + DEADLINES.updateEveryDays * DAY : null;

  let due = null, paused = false;
  if (!responded && !reachedTop) {
    if (inv) { if (nowMs > updateDue) due = { at: updateDue, reason: "updates_stopped" }; else paused = true; }
    else if (!acked && nowMs > ackDue) due = { at: ackDue, reason: "no_acknowledgement" };
    else if (acked && nowMs > respondDue) due = { at: respondDue, reason: "no_response" };
  }
  const status = responded ? "Response received" : reachedTop ? "Reached the top of the chain" : paused ? "Investigation in progress" : acked ? "Acknowledged, awaiting response" : "Awaiting acknowledgement";
  return { chain, level, office: chain[level], isLast: level === chain.length - 1, ackDue, respondDue, updateDue, acked, responded, inv, paused, reachedTop, due, status };
}

export const fmtDate = (ms) => new Date(ms).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

const WHAT = { no_acknowledgement: "acknowledge it", no_response: "respond", updates_stopped: "post a progress update" };
export function escalationNotice(from, to, reason, dueMs) {
  return `Moved to ${to} because ${from} did not ${WHAT[reason]} by ${fmtDate(dueMs)}. This says nothing about whether the complaint is true. ${to} now has ${DEADLINES.acknowledgeDays} days to acknowledge and ${DEADLINES.respondDays} days to respond.`;
}
export function topNotice(office, dueMs) {
  return `${office} did not act by ${fmtDate(dueMs)} and there is no higher authority inside this system. See the next steps outside this system. This says nothing about whether the complaint is true.`;
}
