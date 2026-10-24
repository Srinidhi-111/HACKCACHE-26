import { useEffect, useState, useCallback } from "react";
import { loadEvents, onChange, appendEvent, createComplaint, verifyComplaint, tamper, resetDemo, seedIfEmpty } from "./lib/store";

const LABEL = {
  submitted: "Complaint submitted",
  acknowledged: "Acknowledged by office",
  update: "Update from office",
  evidence_added: "Evidence added",
};
const CATEGORIES = ["Bribe demand", "Refused service", "Rude or abusive behaviour", "Not doing their duty", "Other"];
const btn = "min-h-12 px-4 rounded-lg font-semibold border border-slate-400 bg-white active:bg-slate-100";
const btnMain = "min-h-12 px-4 rounded-lg font-semibold bg-blue-800 text-white active:bg-blue-900";

export default function App() {
  const [events, setEvents] = useState(loadEvents());
  const [sel, setSel] = useState("");
  const [result, setResult] = useState(null);
  const [note, setNote] = useState("");
  const [cat, setCat] = useState(CATEGORIES[0]);
  const [desc, setDesc] = useState("");
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(() => setEvents(loadEvents()), []);
  useEffect(() => {
    seedIfEmpty().then(refresh);
    return onChange(refresh);
  }, [refresh]);

  const ids = events.filter((e) => e.type === "submitted").map((e) => e.complaintId);
  const current = ids.includes(sel) ? sel : ids[0] || "";
  const timeline = events.filter((e) => e.complaintId === current).sort((a, b) => a.seq - b.seq);
  const first = timeline[0];

  const run = async (fn) => { setBusy(true); try { await fn(); } finally { setBusy(false); refresh(); } };
  const pick = (id) => { setSel(id); setResult(null); };

  return (
    <div className="max-w-xl mx-auto p-4 space-y-5">
      <header>
        <h1 className="text-2xl font-bold">Jawabdehi</h1>
        <p className="text-slate-700">A complaint record that nobody can quietly rewrite. Everything here is made-up sample data.</p>
        <p className="mt-2 rounded bg-amber-100 border border-amber-400 p-2 text-sm font-semibold">If you are in danger right now, call 112.</p>
      </header>

      <section className="space-y-2">
        <label htmlFor="cid" className="font-semibold block">Choose a complaint</label>
        <select id="cid" className="w-full min-h-12 border border-slate-400 rounded-lg px-3 bg-white" value={current} onChange={(e) => pick(e.target.value)}>
          {ids.map((id) => <option key={id} value={id}>{id}</option>)}
        </select>
        {first && (
          <p className="text-sm text-slate-700">
            {first.data.category} at {first.data.office}. <span className="font-semibold">This is an allegation, not a finding.</span>
          </p>
        )}
      </section>

      {current && (
        <section className="space-y-3">
          <h2 className="text-xl font-bold">Timeline</h2>
          <ol className="space-y-2">
            {timeline.map((e) => {
              const bad = result && !result.ok && result.badSeq === e.seq;
              return (
                <li key={e.id} className={"rounded-lg border p-3 " + (bad ? "border-red-700 bg-red-50" : "border-slate-300 bg-white")}>
                  <div className="font-semibold">{e.seq}. {LABEL[e.type] || e.type}</div>
                  <div className="text-sm text-slate-700">{e.actor} · {new Date(e.at).toLocaleString()}</div>
                  {e.data.description && <div className="text-sm mt-1">{e.data.description}</div>}
                  {e.data.note && <div className="text-sm mt-1">{e.data.note}</div>}
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

      {current && (
        <section className="space-y-3">
          <h2 className="text-xl font-bold">Add to this record</h2>
          <p className="text-sm text-slate-700">There is no edit or delete button anywhere. Every action adds a new entry at the end.</p>
          <div className="flex gap-2 flex-wrap">
            <button disabled={busy} className={btn} onClick={() => run(() => appendEvent(current, "acknowledged", "Office official (sample)", { note: "Complaint received and under review." }))}>Office: acknowledge</button>
          </div>
          <div className="flex gap-2">
            <label htmlFor="note" className="sr-only">Update text</label>
            <input id="note" className="flex-1 min-h-12 border border-slate-400 rounded-lg px-3" placeholder="Write an update" value={note} onChange={(e) => setNote(e.target.value)} />
            <button disabled={busy || !note.trim()} className={btn} onClick={() => run(async () => { await appendEvent(current, "update", "Office official (sample)", { note: note.trim() }); setNote(""); })}>Post</button>
          </div>
          <div>
            <label htmlFor="file" className="font-semibold block mb-1">Citizen: add evidence (photo, audio, document)</label>
            <input id="file" type="file" className="w-full min-h-12" onChange={(e) => { const f = e.target.files[0]; if (f) run(() => appendEvent(current, "evidence_added", "Citizen (Sunita, sample)", { note: "Evidence file added." }, f)); e.target.value = ""; }} />
          </div>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-xl font-bold">Report a new problem</h2>
        <label htmlFor="cat" className="font-semibold block">What happened?</label>
        <select id="cat" className="w-full min-h-12 border border-slate-400 rounded-lg px-3 bg-white" value={cat} onChange={(e) => setCat(e.target.value)}>
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
        <label htmlFor="desc" className="font-semibold block">Tell us in your own words</label>
        <textarea id="desc" rows={3} className="w-full border border-slate-400 rounded-lg p-3" value={desc} onChange={(e) => setDesc(e.target.value)} />
        <button disabled={busy || !desc.trim()} className={btnMain + " w-full"} onClick={() => run(async () => { const id = await createComplaint({ category: cat, department: "Municipal", office: "Ward Office 14, Jaipur (sample)", description: desc.trim() }); setDesc(""); pick(id); })}>Submit complaint</button>
      </section>

      <section className="space-y-3 border-t border-slate-300 pt-4">
        <h2 className="text-xl font-bold">Admin (demo only)</h2>
        <p className="text-sm text-slate-700">Tamper test edits one stored entry behind the app's back. Then press "Verify this record" to watch it get caught.</p>
        <div className="flex gap-2 flex-wrap">
          <button disabled={!current} className={btn} onClick={() => { tamper(current); setResult(null); refresh(); }}>Tamper test</button>
          <button className={btn} onClick={() => run(async () => { await resetDemo(); setResult(null); setSel(""); })}>Reset demo</button>
        </div>
      </section>
    </div>
  );
}
