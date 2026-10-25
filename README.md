# Jawabdehi: complaints that can't quietly vanish

Jawabdehi is Hindi for accountability. This is a working prototype for HACKCACHE'26, Problem Statement 6: *Building a Citizen-Powered Government Accountability Platform* (Social Impact).

- Live app: https://jawabdehi-eosin.vercel.app/
- Demo video: [add your video link]
- Team: [team name and members who contributed]

## The problem

Complaints against government officials get acknowledged and then fade away. They are passed between offices, closed without a reason, or never answered, and the citizen doesn't know where to go next or how to afford a lawyer.

The app is for people like Sunita, a vegetable seller in Jaipur who was hinted to pay extra to renew her vending licence. Sunita is a made-up example based on the brief. Every official, office, complaint and lawyer in the app is made up too.

## What it does

The home page offers three actions: report a problem, track a complaint, find legal help. Reporting is a four-step flow (what happened, your own words by voice or typing, your details, then a check of the AI-drafted report) and ends with a printable acknowledgement slip with the complaint ID. My complaints lists every complaint with its status. The complaint page shows the full timeline of entries, where the complaint is now and its deadlines, a Verify button with a seal, and actions for the viewer's role. Legal help has the routes outside the system, a free legal aid check, free options listed first, a made-up lawyer directory and a printable case summary for a lawyer. The public record lets anyone look up a complaint by ID. The office inbox and review queue are the workspaces for officials and reviewers, and the Demo tools page moves the date forward and runs the tamper test.

A "Viewing as" bar at the top switches between Citizen, Office official, Reviewer, Public and Admin. That switcher is a demo tool. A real product would give each person one role through sign-in.

## A record nobody can quietly rewrite

Every complaint is a list of events: submitted, acknowledged, update, evidence added, escalated and so on. The list only grows. The app has no edit and no delete action for anyone. The only code that changes stored entries is the demo-only Tamper test and Reset demo, which exist to show the check working. A correction would be a new event at the end.

Each event stores a SHA-256 fingerprint of its own content plus the fingerprint of the event before it (a hash chain). Changing an old event changes its fingerprint, and since every later event was built on it, the chain breaks from that point on. Evidence files are fingerprinted when added and the fingerprint is stored inside the event, so a swapped file is caught too.

The Verify this record button recalculates the whole chain and every evidence fingerprint and names the first entry that doesn't match. The Tamper test on the Demo tools page edits one stored entry directly in storage, so you can watch Verify catch it. The relevant code is `src/lib/hash.js` and `verifyComplaint` in `src/lib/store.js`.

One honest limit: deleting the very last entry of a complaint can't be detected by the chain alone, because nothing comes after it. Publishing a daily fingerprint of the whole record somewhere public would close that gap. We didn't build it.

## How escalation works

Each department has a sample chain of authorities, for example Ward Office, Zonal Officer, Municipal Commissioner, State Urban Development Department, Lokayukta (see `src/data/authorities.js`; these are simplified samples and real chains differ by state). An office has 3 days to acknowledge a complaint and 15 days to respond (`src/data/config.js`). If it misses a deadline, an escalation entry is written, dated at the deadline itself, and the citizen gets a message: the office did not act by that date, and this says nothing about whether the complaint is true.

The brief asks the system to tell silence apart from real work. An office can mark Investigation in progress with an expected date, which pauses escalation only while it keeps posting a progress update at least every 15 days. When updates stop, escalation resumes and the timeline shows why. A bribe demand is also recorded as sent to the state Anti-Corruption Bureau in parallel, without stopping the main chain. At the top of the chain the app stops climbing and shows next steps outside the system. The Demo date buttons move "today" forward so you can watch all of this without waiting weeks. The rules are real and only the passing of time is simulated.

## How AI is used, and why it never decides

The citizen writes or speaks their account (speaking works in Chrome, Hindi or English). The AI turns it into a draft with five fields: what happened, when, where, who, and what was asked for. Each field has to carry an exact quote from the citizen's own words. The server checks that every quote really appears in the account, and any field that fails becomes "not stated". The citizen then reviews and corrects every field before submitting, and their corrections are saved next to the AI's original, so a reviewer can see what changed.

The AI only drafts and organises. It never decides whether anything is true, never says anyone is guilty, and flags are worded as "worth a closer look", not proof. The call goes through a serverless function (`api/ai.js`) so the API key never reaches the browser. Only the citizen's words are sent, not their name or phone. If no key is set, the app makes a simple rule-based draft instead and labels it as a demo result, so it always works.

## Privacy and safety

One file, `src/lib/views.js`, decides what each role may see, and every screen reads only from it. The complainant sees their own details. The reviewer sees everything, including identity, witness and evidence. The office official sees only a summary that the reviewer approved, with names and witness removed, and no evidence. The public sees only the ID, department, office, category, status and the timeline. Witness names are visible to the reviewer only. We tested the official, public and admin views against sample data and none contained a name, phone number, witness or file name. Every page carries the 112 emergency line.

## How misuse is handled

Filing a complaint never changes anyone's standing. The reviewer gets flags for possible duplicates (the same evidence file or very similar wording), possible coordinated submissions (several near-identical complaints about the same office within an hour, seeded as samples as JD-2026-004830 to 004832) and missing information. Flags are prompts for a human, who decides. Nothing is rejected automatically.

## Legal help

When a complaint reaches the top of the chain, the citizen is taken to next steps outside the system, filtered to the category and department of their complaint. Each route has a plain explanation, the steps, a document checklist and a source, and says it is general information, not legal advice.

| Route | Source |
|---|---|
| Ask what happened to your complaint (RTI) | rtionline.gov.in |
| Central government grievance portal (CPGRAMS) | pgportal.gov.in |
| Your state's Right to Services law | your state government portal |
| Report a bribe demand (anti-corruption bureau, Lokayukta, CVC, Lokpal) | cvc.gov.in, lokpal.gov.in |
| Police won't register an FIR (BNSS sections 173(4) and 175(3)) | indiacode.nic.in |
| Police misconduct or human rights violations | nhrc.nic.in |
| High Court writ petition (Article 226) | indiacode.nic.in |

The BNSS sections and the RTI deadlines follow the organisers' brief. They should be checked against the official texts before anyone relies on them.

Free legal aid comes first. A checklist based on Section 12 of the Legal Services Authorities Act, 1987 tells people whether they may qualify. Free options (the District Legal Services Authority, the NALSA helpline 15100, Tele-Law, Nyaya Bandhu, law school clinics) are listed before the made-up lawyer directory, and every entry is labelled Government legal aid, Free consultation or Paid. The Prepare my case summary button opens a print-ready page with the timeline, responses and evidence fingerprints for a lawyer. The income limit in the check is a sample and says to check with your DLSA.

## What is real and what is simulated

| Real | Simulated |
|---|---|
| Append-only record, hash chain, evidence fingerprints, Verify | All officials, offices, complaints and lawyers |
| Escalation rules, pause rule and notices | The passing of time (Demo date buttons) |
| Role-based views and approved summaries | Sign-in (the role switcher) |
| Quote check on AI drafts, reviewer flags | The AI runs only if a key is set, otherwise a labelled rule-based draft |
| Data survives a reload, open tabs update live | Storage is in the browser (localStorage and IndexedDB), not a shared database |

## What we did not build

Recording a finding, rejecting a complaint with an appeal route, restricting a record from public view, withdrawal, the accountability indicator and office statistics pages, real accounts and a shared database, and a full language switch (the app is in English, with Hindi only for speaking a complaint).

## Run it

You need Node.js.

```
npm install
npm run dev
```

Open the address it prints. Choose Admin in the "Viewing as" bar, then Demo tools, and press Reset demo to start from the sample data. To build for production use `npm run build`.

The AI is optional. To switch on the real AI, set `ANTHROPIC_API_KEY` (and optionally `AI_MODEL`) as environment variables in your Vercel project settings. See `.env.example`. The `/api` function only exists when deployed on Vercel, so running locally always uses the rule-based draft.

To deploy: push to GitHub, import the repo in Vercel and press Deploy. `vercel.json` already makes page refreshes work and leaves `/api` alone.

## Built with

React 18, Vite, Tailwind CSS, the browser's Web Crypto API for SHA-256, localStorage and IndexedDB for storage, BroadcastChannel to keep tabs in sync, and a Vercel serverless function for the AI call. The code was written with the help of an AI assistant, and the author can explain how each part works.

## What we would build next

A real database that physically refuses updates and deletes. A daily public fingerprint of the whole record, so even the people running the platform can't rewrite history unnoticed. Phone sign-in for every role. More Indian languages. Findings, appeals and restrictions. A pilot with a legal aid clinic or an NGO to check the real chains and deadlines for one state.
