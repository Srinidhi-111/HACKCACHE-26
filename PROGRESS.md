# Jawabdehi progress

Stage 1 done: Vite + React + Tailwind project, append-only event store (src/lib/store.js), SHA-256 hash chain (src/lib/hash.js),
evidence fingerprints (files in IndexedDB), "Verify this record", admin Tamper test, Reset demo, sample data (src/data/seed.js).
Storage: localStorage (events) + IndexedDB (evidence). Tabs sync through BroadcastChannel.

Next stages: 2 escalation engine + demo date + authority chains; 3 role views (citizen/official/reviewer/public) through one function per role;
4 AI draft with demo fallback; 5 legal help + next steps + case summary; 6 README, video, deck.

Stage 2 done: escalation engine. src/data/config.js (deadlines), src/data/authorities.js (sample chains), src/lib/escalation.js (computeState, notices),
store.js now has the demo clock, a write lock, runEscalations, and the Anti-Corruption Bureau parallel referral. App.jsx has the status panel, official actions, Demo date buttons.
Next: stage 3 role views (citizen/official/reviewer/public) through one function per role.

Stage 3 done: role views. src/lib/views.js is the single place that decides what each role sees (Citizen, Office official, Reviewer, Public, Admin).
Reviewer approves a redacted summary (event redaction_approved); the official only ever sees that summary. Role is kept per tab (sessionStorage).
Next: stage 4 AI draft with demo fallback; stage 5 next steps outside the system, legal help, case summary; stage 6 README, video, deck.
