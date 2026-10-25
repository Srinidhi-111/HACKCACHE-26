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

Stage 4 done: AI draft. src/ReportForm.jsx (write, then check the draft), src/lib/aiDraft.js (prompt, quote validation, rule-based demo draft), api/ai.js (Vercel function, key in ANTHROPIC_API_KEY),
src/lib/flags.js (duplicate, coordinated, missing-info flags for the reviewer). Corrections are kept next to the AI version (aiDraft vs report on the submitted event).
Stage 5 done: src/Legal.jsx (next steps, Section 12 check, free options first, made-up lawyer directory, printable case summary), src/data/legal.js, src/data/legalaid.js.
vercel.json now leaves /api/* alone. Add ANTHROPIC_API_KEY in Vercel project settings to switch the real AI on (optional).
Next: UI pass (case-file look), then stage 6: README, demo script, deck, final link checks.

UI pass done (case-file look): paper/ink/stamp-red tokens in tailwind.config.js, fonts in index.html, shared classes in src/index.css.
src/App.jsx is now the shell (demo bar, header, hash routes, 112 footer); src/Pages.jsx has Home, lists, complaint page with the seal, admin tools;
src/ReportForm.jsx is a 4-step flow ending in an acknowledgement slip; src/ui.jsx has Status and Seal. Routes: #/ #/report #/complaints #/complaint/ID #/legal #/public #/office #/review #/admin.
Next: stage 6 (README, demo script, final link checks), retake deck screenshots.
