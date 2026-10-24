import { useEffect, useState, useCallback } from "react";
import { loadEvents, onChange, appendEvent, createComplaint, verifyComplaint, tamper, resetDemo, seedIfEmpty, runEscalations, addDays, nowMs, getOffset } from "./lib/store";
import { fmtDate } from "./lib/escalation";
import { DEPARTMENTS } from "./data/authorities";
import { ROLES, ROLE_NOTE, listComplaints, complaintView, redactDraft } from "./lib/views";

const LABEL = {
  submitted: "Complaint submitted", parallel_referral: "Also sent to Anti-Corruption Bureau", redaction_approved: "Summary approved by reviewer",
  acknowledged: "Acknowledged by office", investigation_started: "Investigation in progress", update: "Update from office",
  response: "Response from office", evidence_added: "Evidence added", escalated: "Moved to next authority", reached_top: "Reached the top of the chain",
};
const CATEGORIES = ["Bribe demand", "Refused service", "Rude or abusive behaviour", "Not doing their duty", "Other"];
const btn = "min-h-12 px-4 rounded-lg font-semibold border border-slate-400 bg-white active:bg-slate-100 disabled:opacity-50";
const btnMain = "min-h-12 px-4 rounded-lg font-semibold bg-blue-800 text-white active:bg-blue-900 disabled:opacity-50";
const input = "w-full min-h-12 border border-slate-400 rounded-lg px-3 bg-white";
const OFFICIAL = "Office official (sample)";
const CITIZEN = "Citizen (Sunita, sample)";
const REVIEWER = "Reviewer (sample)";

function Head({ role, head }) {
  return (
    <div className="rounded-lg border border-slate-300 bg-white p-3 space-y-1 text-sm">
      <p className="font-semibold">{head.category} · {head.department} · {head.office}</p>
      <p className="font-semibold">This is an allegation, not a finding.</p>
      {(role === "Citizen" || role === "Reviewer") && <p>Description: {head.description}</p>}
      {(role === "Citizen" || role === "Reviewer") && <p>Complainant: {head.complainant ? `${head.complainant.name}, ${head.complainant.phone}` : "not recorded"}</p>}
      {role === "Reviewer" && <p>Witness (reviewer only): {head.witness || "none"}</p>}
      {(role === "Reviewer" || role === "Office official") && <p>Summary the office sees: {head.summary || "not approved yet. The office sees no details until the reviewer approves a summary."}</p>}
      {(role === "Public" || role === "Admin") && <p>Details and evidence are never public.</p>}
    </div>
  );
}

function ReviewerBox({ head, onApprove, busy }) {
  const [text, setText] = useState(head.summary || redactDraft(head.description, [head.complainant && head.complainant.name, head.complainant && head.complainant.phone, head.witness]));
  return (
    <section className="space-y-2">
      <h2 className="text-xl font-bold">Approve what the office sees</h2>
      <label htmlFor="sum" className="text-sm block">Names, phone number and witness are already replaced. Check it, edit it, then approve.</label>
      <textarea id="sum" rows={4} className="w-full border border-slate-400 rounded-lg p-3" value={text} onChange={(e) => setText(e.target.value)} />
      <button disabled={busy || !text.trim()} className={btnMain + " w-full"} onClick={() => onApprove(text.trim())}>{head.approved ? "Approve updated summary" : "Approve summary"}</button>
    </section>
  );
}

export default function App() {
  const [role, setRoleState] = useState(sessionStorage.getItem("jd_role") || "Citizen");
  const [events, setEvents] = useState(loadEvents());
  const [sel, setSel] = useState("");
  const [result, setResult] = useState(null);
  const [note, setNote] = useState("");
  const [resp, setResp] = useState("");
  const [expected, setExpected] = useState("");
  const [cat, setCat] = useState(CATEGORIES[0]);
  const [dept, setDept] = useState(DEPARTMENTS[0]);
  const [desc, setDesc] = useState("");
  const [name, setName] = useState("Sunita Devi (sample)");
  const [phone, setPhone] = useState("98XXXXXX01");
  const [witness, setWitness] = useState("");
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => { await runEscalations(); setEvents(loadEvents()); }, []);
  useEffect(() => { seedIfEmpty().then(refresh); return onChange(refresh); }, [refresh]);

  const now = nowMs();
  const rows = listComplaints(role, events, now).filter((r) => r.id.toLowerCase().includes(q.toLowerCase()));
  const current = rows.some((r) => r.id === sel) ? sel : rows[0] ? rows[0].id : "";
  const view = current ? complaintView(role, events, current, now) : null;
  const st = view ? view.state : null;
  const off = getOffset();

  const run = async (fn) => { setBusy(true); try { await fn(); } finally { setBusy(false); await refresh(); } };
  const pick = (id) => { setSel(id); setResult(null); };
  const setRole = (r) => { sessionStorage.setItem("jd_role", r); setRoleState(r); setResult(null); };

  return (
    <div className="max-w-xl mx-auto p-4 space-y-5">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold">Jawabdehi</h1>
        <p className="text-slate-700">A complaint record that nobody can quietly rewrite. Everything here is made-up sample data.</p>
        <p className="rounded bg-amber-100 border border-amber-400 p-2 text-sm font-semibold">If you are in danger right now, call 112.</p>
        <label htmlFor="role" className="font-semibold block">Viewing as (demo only)</label>
        <select id="role" className={input} value={role} onChange={(e) => setRole(e.target.value)}>{ROLES.map((r) => <option key={r}>{r}</option>)}</select>
        <p className="text-sm rounded bg-slate-100 border border-slate-300 p-2">{ROLE_NOTE[role]}</p>
        <p className="text-sm font-semibold">Demo date: {fmtDate(now)}{off ? ` (+${off} days)` : " (today)"}</p>
      </header>

      {role === "Citizen" && (
        <section className="space-y-3">
          <h2 className="text-xl font-bold">Report a new problem</h2>
          <label htmlFor="dept" className="font-semibold block">Which department?</label>
          <select id="dept" className={input} value={dept} onChange={(e) => setDept(e.target.value)}>{DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}</select>
          <label htmlFor="cat" className="font-semibold block">What happened?</label>
          <select id="cat" className={input} value={cat} onChange={(e) => setCat(e.target.value)}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select>
          <label htmlFor="desc" className="font-semibold block">Tell us in your own words</label>
          <textarea id="desc" rows={3} className="w-full border border-slate-400 rounded-lg p-3" value={desc} onChange={(e) => setDesc(e.target.value)} />
          <label htmlFor="nm" className="font-semibold block">Your name (made-up)</label>
          <input id="nm" className={input} value={name} onChange={(e) => setName(e.target.value)} />
          <label htmlFor="ph" className="font-semibold block">Your phone (made-up)</label>
          <input id="ph" className={input} value={phone} onChange={(e) => setPhone(e.target.value)} />
          <label htmlFor="wt" className="font-semibold block">Witness name, optional (only the reviewer will see it)</label>
          <input id="wt" className={input} value={witness} onChange={(e) => setWitness(e.target.value)} />
          <button disabled={busy || !desc.trim() || !name.trim()} className={btnMain + " w-full"} onClick={() => run(async () => { const id = await createComplaint({ category: cat, department: dept, office: "Sample office", description: desc.trim(), complainant: { name: name.trim(), phone: phone.trim() }, witness: witness.trim() || null }); setDesc(""); setWitness(""); pick(id); })}>Submit complaint</button>
        </section>
      )}

      <section className="space-y-2">
        <h2 className="text-xl font-bold">{role === "Public" ? "Public record" : role === "Office official" ? "Office inbox" : "Complaints"}</h2>
        {role === "Public" && (<><label htmlFor="q" className="font-semibold block">Search by complaint ID</label><input id="q" className={input} placeholder="JD-2026-" value={q} onChange={(e) => setQ(e.target.value)} /></>)}
        <label htmlFor="cid" className="font-semibold block">Choose a complaint</label>
        <select id="cid" className={input} value={current} onChange={(e) => pick(e.target.value)}>{rows.map((r) => <option key={r.id} value={r.id}>{r.id} · {r.category} · {r.status}</option>)}</select>
        {!rows.length && <p className="text-sm">No complaints found.</p>}
      </section>

      {view && <Head role={role} head={view.head} />}

      {st && (
        <section className="rounded-lg border-2 border-blue-800 bg-blue-50 p-3 space-y-1">
          <h2 className="text-lg font-bold">Where this complaint is now</h2>
          <p>With: <span className="font-semibold">{st.office}</span> (level {st.level + 1} of {st.chain.length})</p>
          <p>Status: <span className="font-semibold">{st.status}</span></p>
          {!st.responded && !st.reachedTop && !st.inv && !st.acked && <p className="text-sm">Must acknowledge by {fmtDate(st.ackDue)}</p>}
          {!st.responded && !st.reachedTop && !st.inv && <p className="text-sm">Must respond by {fmtDate(st.respondDue)}</p>}
          {st.paused && <p className="text-sm">Escalation is paused while updates keep coming. Next update due by {fmtDate(st.updateDue)}.</p>}
          {st.reachedTop && <p className="text-sm font-semibold">No higher authority in this system. Next steps outside this system will appear here in a later stage.</p>}
        </section>
      )}

      {view && (
        <section className="space-y-3">
          <h2 className="text-xl font-bold">Timeline</h2>
          <ol className="space-y-2">
            {view.timeline.map((e) => {
              const bad = result && !result.ok && result.badSeq === e.seq;
              return (
                <li key={e.id} className={"rounded-lg border p-3 " + (bad ? "border-red-700 bg-red-50" : "border-slate-300 bg-white")}>
                  <div className="font-semibold">{e.seq}. {LABEL[e.type] || e.type}</div>
                  <div className="text-sm text-slate-700">{e.actor} · {new Date(e.at).toLocaleString("en-IN")}</div>
                  {e.data.note && <div className="text-sm mt-1">{e.data.note}</div>}
                  {e.data.expectedDate && <div className="text-sm mt-1">Expected by: {e.data.expectedDate}</div>}
                  {e.data.notice && <div className="text-sm mt-1 font-semibold">Message to complainant: {e.data.notice}</div>}
                  {e.data.fileName && <div className="text-sm mt-1">File: {e.data.fileName} ({e.data.size} bytes)<br /><span className="font-mono break-all">SHA-256: {e.data.sha256.slice(0, 24)}…</span></div>}
                  <div className="text-xs font-mono text-slate-500 mt-1 break-all">hash {e.hash.slice(0, 16)}… (links to {e.prevHash.slice(0, 8)}…)</div>
                  {bad && <div className="mt-1 font-bold text-red-800">DOES NOT MATCH: {result.reason}</div>}
                </li>
              );
            })}
          </ol>
          <button disabled={busy} className={btnMain + " w-full"} onClick={() => run(async () => setResult(await verifyComplaint(current)))}>Verify this record</button>
          {result && (
            <p role="status" className={"rounded-lg p-3 font-semibold " + (result.ok ? "bg-green-100 border border-green-700 text-green-900" : "bg-red-100 border border-red-700 text-red-900")}>
              {result.ok ? `Record is intact: all ${result.count} entries and evidence fingerprints match.` : `Record check FAILED at entry ${result.badSeq}. ${result.reason}`}
            </p>
          )}
        </section>
      )}

      {view && role === "Reviewer" && <ReviewerBox key={current + view.head.approved} head={view.head} busy={busy} onApprove={(summary) => run(() => appendEvent(current, "redaction_approved", REVIEWER, { summary }))} />}

      {view && st && role === "Citizen" && (
        <section className="space-y-2">
          <h2 className="text-xl font-bold">Add evidence</h2>
          <label htmlFor="file" className="font-semibold block">Photo, audio or document</label>
          <input id="file" type="file" className="w-full min-h-12" onChange={(e) => { const f = e.target.files[0]; if (f) run(() => appendEvent(current, "evidence_added", CITIZEN, { note: "Evidence file added." }, f)); e.target.value = ""; }} />
        </section>
      )}

      {view && st && role === "Office official" && (
        <section className="space-y-3">
          <h2 className="text-xl font-bold">Office actions</h2>
          <p className="text-sm text-slate-700">There is no edit or delete button anywhere. Every action adds a new entry at the end.</p>
          <button disabled={busy || st.acked} className={btn + " w-full"} onClick={() => run(() => appendEvent(current, "acknowledged", OFFICIAL, { note: `Acknowledged by ${st.office}.` }))}>Acknowledge</button>
          <div className="flex gap-2">
            <label htmlFor="exp" className="sr-only">Expected date</label>
            <input id="exp" type="date" className={input} value={expected} onChange={(e) => setExpected(e.target.value)} />
            <button disabled={busy || !expected || st.inv} className={btn} onClick={() => run(() => appendEvent(current, "investigation_started", OFFICIAL, { expectedDate: expected, note: "Investigation in progress. Updates will follow at least every 15 days." }))}>Start investigation</button>
          </div>
          <div className="flex gap-2">
            <label htmlFor="note" className="sr-only">Update text</label>
            <input id="note" className={input} placeholder="Progress update" value={note} onChange={(e) => setNote(e.target.value)} />
            <button disabled={busy || !note.trim()} className={btn} onClick={() => run(async () => { await appendEvent(current, "update", OFFICIAL, { note: note.trim() }); setNote(""); })}>Post</button>
          </div>
          <div className="flex gap-2">
            <label htmlFor="resp" className="sr-only">Response text</label>
            <input id="resp" className={input} placeholder="Official response" value={resp} onChange={(e) => setResp(e.target.value)} />
            <button disabled={busy || !resp.trim()} className={btn} onClick={() => run(async () => { await appendEvent(current, "response", OFFICIAL, { note: resp.trim() }); setResp(""); })}>Respond</button>
          </div>
        </section>
      )}

      {role === "Admin" && (
        <section className="space-y-3 border-t border-slate-300 pt-4">
          <h2 className="text-xl font-bold">Admin (demo only)</h2>
          <p className="text-sm text-slate-700">Move the demo date forward to watch deadlines pass and complaints escalate.</p>
          <div className="grid grid-cols-4 gap-2">{[1, 7, 15, 30].map((n) => <button key={n} disabled={busy} className={btn} onClick={() => run(async () => addDays(n))}>+{n}d</button>)}</div>
          <p className="text-sm text-slate-700">Tamper test edits one stored entry behind the app's back. Then press "Verify this record".</p>
          <div className="flex gap-2 flex-wrap">
            <button disabled={!current} className={btn} onClick={() => { tamper(current); setResult(null); refresh(); }}>Tamper test</button>
            <button className={btn} onClick={() => run(async () => { await resetDemo(); setResult(null); setSel(""); })}>Reset demo</button>
          </div>
        </section>
      )}
    </div>
  );
}
