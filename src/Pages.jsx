import { useState } from "react";
import { appendEvent, verifyComplaint, addDays, tamper, resetDemo } from "./lib/store";
import { fmtDate } from "./lib/escalation";
import { complaintView, redactDraft } from "./lib/views";
import { LABEL } from "./lib/labels";
import { FIELD_KEYS, FIELD_LABEL } from "./lib/aiDraft";
import { Status, Seal } from "./ui.jsx";

const OFFICIAL = "Office official (sample)";
const CITIZEN = "Citizen (Sunita, sample)";
const REVIEWER = "Reviewer (sample)";

export function Restricted({ who }) {
  return <div className="card max-w-xl"><h1 className="text-2xl">This page is for {who}</h1><p className="mt-2 text-muted">Use "Viewing as" in the bar at the top of the page to switch role.</p></div>;
}

export function Home() {
  const steps = [["1", "Report in your own words", "Speak or type. An AI drafts your report and shows the exact words each line came from. You check it."], ["2", "Silence moves it up", "If an office does not act by its deadline, your complaint moves to the next authority and you are told."], ["3", "Verify and find help", "Anyone can check the record is untouched. If nothing works, you see free legal help first."]];
  return (
    <div className="space-y-14">
      <section className="max-w-3xl pt-4">
        <p className="lbl">Jawabdehi · जवाबदेही</p>
        <h1 className="text-4xl md:text-5xl mt-3 leading-tight">A complaint that can't quietly disappear.</h1>
        <p className="text-lg mt-5 text-muted max-w-2xl">Report a problem with a government office. Your complaint is kept in a record nobody can rewrite, moves up the chain if the office stays silent, and you always have a next step, including free legal help.</p>
        <div className="mt-7 flex flex-wrap gap-3">
          <a className="btn-main" href="#/report">Report a problem</a>
          <a className="btn" href="#/complaints">Track my complaint</a>
          <a className="btn" href="#/legal">Find legal help</a>
        </div>
      </section>
      <section className="grid gap-px bg-rule border border-rule md:grid-cols-3">
        {steps.map(([n, t, d]) => (
          <div key={n} className="bg-panel p-6">
            <p className="font-serif text-3xl text-muted">{n}</p>
            <h2 className="text-xl mt-2">{t}</h2>
            <p className="mt-2 text-muted">{d}</p>
          </div>
        ))}
      </section>
      <section className="card flex flex-wrap items-center justify-between gap-4">
        <div className="max-w-xl"><h2 className="text-xl">The public record</h2><p className="text-muted mt-1">Anyone can look up a complaint by its ID and see its office, status and timeline. Names, details and evidence are never shown.</p></div>
        <a className="btn" href="#/public">Open the public record</a>
      </section>
    </div>
  );
}

export function ComplaintList({ rows, empty, title, intro }) {
  return (
    <div>
      <h1 className="text-3xl">{title}</h1>
      {intro && <p className="text-muted mt-2 max-w-2xl">{intro}</p>}
      {!rows.length && <p className="mt-6 text-muted">{empty || "No complaints found."}</p>}
      <ul className="mt-6 border-t border-rule">
        {rows.map((r) => (
          <li key={r.id} className="border-b border-rule">
            <a href={`#/complaint/${r.id}`} className="flex flex-wrap items-start justify-between gap-3 py-4 px-2 no-underline text-ink hover:bg-tint">
              <div>
                <span className="mono text-muted">{r.id}</span>
                <div className="font-serif text-xl">{r.category}</div>
                <div className="text-sm text-muted">{r.department} · {r.office}</div>
                {r.flags > 0 && <div className="text-sm mt-1 font-medium">Worth a closer look: {r.flags} flag{r.flags > 1 ? "s" : ""}</div>}
                {r.approved === false && <div className="text-sm mt-1 font-medium">Summary for the office not approved yet</div>}
              </div>
              <div className="sm:text-right"><Status s={r.status} /><div className="text-sm text-muted mt-1">With {r.with}</div></div>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function PublicPage({ rows }) {
  const [q, setQ] = useState("");
  const shown = rows.filter((r) => r.id.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="space-y-4">
      <div className="max-w-md"><label htmlFor="q" className="font-medium block mb-1">Search by complaint ID</label><input id="q" className="field" placeholder="JD-2026-" value={q} onChange={(e) => setQ(e.target.value)} /></div>
      <ComplaintList rows={shown} title="Public record" intro="Each entry shows only the complaint ID, department, office, category, status and timeline. Every complaint here is an allegation, not a finding." />
    </div>
  );
}

function ReviewerBox({ head, onApprove, busy }) {
  const [text, setText] = useState(head.summary || redactDraft(head.description, [head.complainant && head.complainant.name, head.complainant && head.complainant.phone, head.witness]));
  return (
    <div className="card space-y-2">
      <h2 className="text-xl">Approve what the office sees</h2>
      <label htmlFor="sum" className="text-sm text-muted block">Names, phone number and witness are already replaced. Check it, edit it, then approve.</label>
      <textarea id="sum" rows={4} className="field" value={text} onChange={(e) => setText(e.target.value)} />
      <button disabled={busy || !text.trim()} className="btn-main w-full" onClick={() => onApprove(text.trim())}>{head.approved ? "Approve updated summary" : "Approve summary"}</button>
    </div>
  );
}

function Details({ role, head }) {
  const rows = [];
  if (role === "Citizen" || role === "Reviewer") rows.push(["Your words", head.description]);
  if ((role === "Citizen" || role === "Reviewer") && head.report) FIELD_KEYS.forEach((k) => rows.push([FIELD_LABEL[k], head.report[k].value + (head.aiDraft && head.aiDraft[k] && head.aiDraft[k].value !== head.report[k].value ? `  (corrected by the complainant; the AI wrote: ${head.aiDraft[k].value})` : "")]));
  if (role === "Citizen" || role === "Reviewer") rows.push([role === "Reviewer" ? "Complainant (reviewer only)" : "Your details", head.complainant ? `${head.complainant.name}, ${head.complainant.phone}` : "not recorded"]);
  if (role === "Reviewer") rows.push(["Witness (reviewer only)", head.witness || "none"]);
  if (role === "Reviewer" || role === "Office official") rows.push(["Summary the office sees", head.summary || "Not approved yet. The office sees no details until the reviewer approves a summary."]);
  return (
    <div className="card">
      <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-[11rem,1fr]">
        {rows.map(([k, v]) => (<div key={k} className="contents"><dt className="lbl pt-1">{k}</dt><dd>{v}</dd></div>))}
        {(role === "Public" || role === "Admin") && <><dt className="lbl pt-1">Details</dt><dd>Details and evidence are never public.</dd></>}
      </dl>
      {role === "Reviewer" && head.aiMode && <p className="text-sm text-muted mt-3">Report source: {head.aiMode === "ai" ? "AI draft, corrected by the complainant" : head.aiMode === "demo" ? "demo result (rule-based), corrected by the complainant" : "sample data"}</p>}
      {role === "Reviewer" && head.flags && head.flags.length > 0 && (
        <div className="mt-4 rounded border border-ink/40 bg-tint p-3">
          <p className="font-medium">Worth a closer look</p>
          <ul className="list-disc ml-5 mt-1">{head.flags.map((f, i) => <li key={i}><span className="font-medium">{f.kind}:</span> {f.reason}</li>)}</ul>
          <p className="text-sm text-muted mt-2">These flags are prompts for you to check. They are not proof of anything.</p>
        </div>
      )}
    </div>
  );
}

export function ComplaintPage({ role, events, id, now, run, busy }) {
  const [result, setResult] = useState(null);
  const [note, setNote] = useState("");
  const [resp, setResp] = useState("");
  const [expected, setExpected] = useState("");
  const view = complaintView(role, events, id, now);
  if (!view) return <div className="card"><h1 className="text-2xl">Complaint not found</h1><p className="mt-2 text-muted">Check the ID, or go back to the list.</p></div>;
  const { head, state: st, timeline } = view;
  const seal = !result ? "none" : result.ok ? "ok" : "bad";

  return (
    <div>
      <p className="mono text-muted">{id}</p>
      <h1 className="text-3xl md:text-4xl">{head.category}</h1>
      <p className="text-muted">{head.department} · {head.office}</p>
      <p className="mt-1 text-sm font-medium">This is an allegation, not a finding.</p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.5fr,1fr]">
        <div className="space-y-8 min-w-0">
          <Details role={role} head={head} />
          <section>
            <h2 className="text-2xl">The record, in order</h2>
            <ol className="mt-5">
              {timeline.map((e) => {
                const bad = result && !result.ok && result.badSeq === e.seq;
                return (
                  <li key={e.id} className={"relative pl-6 pb-6 ml-1.5 border-l-2 " + (bad ? "border-stamp" : "border-ink")}>
                    <span className={"absolute -left-[7px] top-1.5 w-3 h-3 rounded-full border-2 bg-paper " + (bad ? "border-stamp" : "border-ink")} />
                    <p className="font-medium">{e.seq}. {LABEL[e.type] || e.type}</p>
                    <p className="text-sm text-muted">{e.actor} · {new Date(e.at).toLocaleString("en-IN")}</p>
                    {e.data.note && <p className="mt-1">{e.data.note}</p>}
                    {e.data.expectedDate && <p className="mt-1 text-sm">Expected by: {e.data.expectedDate}</p>}
                    {e.data.notice && <p className="mt-2 rounded bg-tint p-3 text-sm"><span className="font-medium">Message to the complainant: </span>{e.data.notice}</p>}
                    {e.data.fileName && <p className="mt-2 text-sm">File: {e.data.fileName} ({e.data.size} bytes)<br /><span className="chip break-all">SHA-256 {e.data.sha256.slice(0, 20)}…</span></p>}
                    <p className="mt-2"><span className="chip">{e.hash.slice(0, 6)} ← {e.prevHash.slice(0, 6)}</span></p>
                    {bad && <p className="mt-2 font-medium text-stamp">Does not match: {result.reason}</p>}
                  </li>
                );
              })}
            </ol>
          </section>
        </div>

        <aside className="space-y-5 lg:sticky lg:top-4 self-start min-w-0">
          <div className="card space-y-1">
            <p className="lbl">Now with</p>
            <p className="font-serif text-2xl">{st.office}</p>
            <p className="text-sm text-muted">Level {st.level + 1} of {st.chain.length}</p>
            <div className="pt-1"><Status s={st.status} /></div>
            {!st.responded && !st.reachedTop && !st.inv && !st.acked && <p className="text-sm pt-2">Must acknowledge by {fmtDate(st.ackDue)}</p>}
            {!st.responded && !st.reachedTop && !st.inv && <p className="text-sm">Must respond by {fmtDate(st.respondDue)}</p>}
            {st.paused && <p className="text-sm pt-2">Escalation is paused while updates keep coming. Next update due by {fmtDate(st.updateDue)}.</p>}
            {st.reachedTop && <p className="text-sm pt-2 font-medium">No higher authority in this system.</p>}
          </div>

          {st.reachedTop && role === "Citizen" && (
            <div className="card border-ink space-y-2"><h2 className="text-xl">What you can do next</h2><p className="text-sm text-muted">Routes outside this system, free legal aid first, and a case summary for a lawyer.</p><a className="btn-main w-full" href={`#/legal/${id}`}>See next steps</a></div>
          )}

          <div className="card">
            <div className="flex items-center gap-4">
              <Seal state={seal} />
              <div>
                <h2 className="text-xl">Verify this record</h2>
                <p role="status" className={"text-sm mt-1 " + (seal === "bad" ? "text-stamp font-medium" : "text-muted")}>
                  {!result ? "Rechecks every entry and every evidence fingerprint." : result.ok ? `All ${result.count} entries and fingerprints match.` : `Entry ${result.badSeq} does not match. ${result.reason}`}
                </p>
              </div>
            </div>
            <button disabled={busy} className="btn-main w-full mt-4" onClick={() => run(async () => setResult(await verifyComplaint(id)))}>Verify this record</button>
          </div>

          {role === "Citizen" && (
            <div className="card space-y-2">
              <h2 className="text-xl">Add evidence</h2>
              <label htmlFor="file" className="text-sm text-muted block">Photo, audio or document</label>
              <input id="file" type="file" className="w-full min-h-12" onChange={(e) => { const f = e.target.files[0]; if (f) run(() => appendEvent(id, "evidence_added", CITIZEN, { note: "Evidence file added." }, f)); e.target.value = ""; }} />
              <a className="btn w-full" href={`#/legal/${id}`}>Find legal help</a>
            </div>
          )}

          {role === "Reviewer" && <ReviewerBox key={id + head.approved} head={head} busy={busy} onApprove={(summary) => run(() => appendEvent(id, "redaction_approved", REVIEWER, { summary }))} />}

          {role === "Office official" && (
            <div className="card space-y-3">
              <h2 className="text-xl">Office actions</h2>
              <p className="text-sm text-muted">There is no edit or delete button anywhere. Every action adds a new entry at the end.</p>
              <button disabled={busy || st.acked} className="btn w-full" onClick={() => run(() => appendEvent(id, "acknowledged", OFFICIAL, { note: `Acknowledged by ${st.office}.` }))}>Acknowledge</button>
              <div><label htmlFor="exp" className="text-sm block">Investigation: expected date</label><div className="flex gap-2"><input id="exp" type="date" className="field" value={expected} onChange={(e) => setExpected(e.target.value)} /><button disabled={busy || !expected || st.inv} className="btn" onClick={() => run(() => appendEvent(id, "investigation_started", OFFICIAL, { expectedDate: expected, note: "Investigation in progress. Updates will follow at least every 15 days." }))}>Start</button></div></div>
              <div><label htmlFor="note" className="text-sm block">Progress update</label><div className="flex gap-2"><input id="note" className="field" value={note} onChange={(e) => setNote(e.target.value)} /><button disabled={busy || !note.trim()} className="btn" onClick={() => run(async () => { await appendEvent(id, "update", OFFICIAL, { note: note.trim() }); setNote(""); })}>Post</button></div></div>
              <div><label htmlFor="resp" className="text-sm block">Official response</label><div className="flex gap-2"><input id="resp" className="field" value={resp} onChange={(e) => setResp(e.target.value)} /><button disabled={busy || !resp.trim()} className="btn" onClick={() => run(async () => { await appendEvent(id, "response", OFFICIAL, { note: resp.trim() }); setResp(""); })}>Send</button></div></div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

export function AdminPage({ rows, run, busy }) {
  const [sel, setSel] = useState("");
  const [msg, setMsg] = useState("");
  const id = rows.some((r) => r.id === sel) ? sel : rows[0] ? rows[0].id : "";
  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-3xl">Demo tools</h1>
      <div className="card space-y-3"><h2 className="text-xl">Demo date</h2><p className="text-muted">Move "today" forward to watch deadlines pass and complaints escalate.</p>
        <div className="grid grid-cols-4 gap-2">{[1, 7, 15, 30].map((n) => <button key={n} disabled={busy} className="btn" onClick={() => run(async () => addDays(n))}>+{n} days</button>)}</div></div>
      <div className="card space-y-3"><h2 className="text-xl">Tamper test</h2><p className="text-muted">Edits one stored entry behind the app's back, without fixing its fingerprint. Then open the complaint and press Verify.</p>
        <label htmlFor="tid" className="text-sm block">Complaint</label>
        <select id="tid" className="field" value={id} onChange={(e) => setSel(e.target.value)}>{rows.map((r) => <option key={r.id} value={r.id}>{r.id}</option>)}</select>
        <button disabled={!id} className="btn w-full" onClick={() => { tamper(id); setMsg(id); }}>Run tamper test</button>
        {msg && <p role="status" className="text-sm">An entry in {msg} was changed. <a href={`#/complaint/${msg}`}>Open it and press Verify.</a></p>}</div>
      <div className="card space-y-3"><h2 className="text-xl">Reset</h2><p className="text-muted">Restores the sample complaints and today's real date.</p>
        <button className="btn w-full" onClick={() => run(async () => { await resetDemo(); setMsg(""); })}>Reset demo</button></div>
    </div>
  );
}
