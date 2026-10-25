import { useState } from "react";
import { ROUTES, NOTE } from "./data/legal";
import { SECTION_12, INCOME_NOTE, FREE_OPTIONS, LAWYERS } from "./data/legalaid";
import { LABEL } from "./lib/labels";

const input = "field";
const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const uniq = (a) => ["Any", ...new Set(a)];

// Opens a print-ready page the citizen can hand to a lawyer. Built only from the citizen's own view of the record.
function openCaseSummary(view) {
  const rows = view.timeline.map((e) => `<tr><td>${e.seq}</td><td>${esc(LABEL[e.type] || e.type)}</td><td>${esc(e.actor)}</td><td>${esc(new Date(e.at).toLocaleString("en-IN"))}</td><td>${esc(e.data.notice || e.data.note || "")}</td></tr>`).join("");
  const files = view.timeline.filter((e) => e.data.fileName).map((e) => `<li>${esc(e.data.fileName)} (${e.data.size} bytes)<br><code>SHA-256: ${esc(e.data.sha256)}</code></li>`).join("") || "<li>No evidence files recorded.</li>";
  const replies = view.timeline.filter((e) => ["response", "update", "escalated", "reached_top"].includes(e.type)).map((e) => `<li><b>${esc(LABEL[e.type])}</b> (${esc(new Date(e.at).toLocaleDateString("en-IN"))}): ${esc(e.data.notice || e.data.note || "")}</li>`).join("") || "<li>No replies recorded.</li>";
  const h = view.head;
  const report = h.report ? Object.entries(h.report).map(([k, v]) => `<li>${esc(k.replace("_", " "))}: ${esc(v.value)}</li>`).join("") : "";
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Case summary ${esc(view.id)}</title><style>body{font-family:Arial,sans-serif;max-width:800px;margin:24px auto;padding:0 16px;line-height:1.5}table{border-collapse:collapse;width:100%}td,th{border:1px solid #999;padding:4px 6px;font-size:13px;vertical-align:top}code{font-size:11px;word-break:break-all}.n{border:1px solid #999;padding:8px;background:#f3f3f3}@media print{button{display:none}}</style></head><body>
<button onclick="window.print()">Print or save as PDF</button>
<h1>Case summary: ${esc(view.id)}</h1>
<p><b>${esc(h.category)}</b> · ${esc(h.department)} · ${esc(h.office)}<br>Current status: ${esc(view.state.status)}, with ${esc(view.state.office)}.<br>This is an allegation, not a finding.</p>
<h2>Complainant's account</h2><p>${esc(h.description)}</p><ul>${report}</ul>
<h2>Timeline</h2><table><tr><th>#</th><th>Event</th><th>By</th><th>When</th><th>Details</th></tr>${rows}</table>
<h2>Responses and decisions</h2><ul>${replies}</ul>
<h2>Evidence list</h2><ul>${files}</ul>
<p class="n">${esc(NOTE)} This summary was generated from the Jawabdehi record. Every entry is fingerprinted; use "Verify this record" in the app to confirm it is unchanged.</p>
</body></html>`;
  const w = window.open("", "_blank");
  if (!w) { alert("Allow pop-ups for this site to open the case summary."); return; }
  w.document.write(html); w.document.close();
}

export default function Legal({ view }) {
  const [checks, setChecks] = useState([]);
  const [showAll, setShowAll] = useState(false);
  const [city, setCity] = useState("Any");
  const [area, setArea] = useState("Any");
  const [lang, setLang] = useState("Any");
  const [fmt, setFmt] = useState("Any");
  const h = view ? view.head : null;
  const routes = ROUTES.filter((r) => showAll || !h || ((!r.categories || r.categories.includes(h.category)) && (!r.departments || r.departments.includes(h.department))));
  const lawyers = LAWYERS.filter((l) => (city === "Any" || l.city === city) && (area === "Any" || l.area === area) && (lang === "Any" || l.languages.includes(lang)) && (fmt === "Any" || l.formats.includes(fmt)));
  const toggle = (c) => setChecks(checks.includes(c) ? checks.filter((x) => x !== c) : [...checks, c]);

  return (
    <div className="space-y-10 max-w-3xl">
      <section className="space-y-3">
        <h1 className="text-3xl">Next steps outside this system</h1>
        <p className="text-sm rounded border border-ink/40 bg-tint p-3 font-medium">{NOTE}</p>
        {view && <button className="btn-main w-full" onClick={() => openCaseSummary(view)}>Prepare my case summary for a lawyer</button>}
        {routes.map((r) => (
          <details key={r.id} className="card">
            <summary className="font-medium cursor-pointer min-h-8">{r.title}</summary>
            <p className="text-sm mt-2">{r.plain}</p>
            <ol className="list-decimal ml-5 text-sm mt-2 space-y-1">{r.steps.map((s) => <li key={s}>{s}</li>)}</ol>
            <p className="text-sm font-medium mt-2">Documents to gather</p>
            <ul className="list-disc ml-5 text-sm">{r.documents.map((d) => <li key={d}>{d}</li>)}</ul>
            <p className="text-sm mt-2">Source: {r.sources.map((s, i) => <span key={s.label}>{i ? ", " : ""}{s.url ? <a className="text-ink underline" href={s.url} target="_blank" rel="noreferrer">{s.label}</a> : s.label}</span>)}</p>
            <p className="text-xs text-muted mt-1">{NOTE}</p>
          </details>
        ))}
        <label className="flex items-center gap-2 text-sm min-h-12"><input type="checkbox" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} /> Show all routes, not only those for my complaint</label>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl">Free legal aid check</h2>
        <p className="text-sm">Under Section 12 of the Legal Services Authorities Act, 1987, some people get free legal aid. Tick anything that applies.</p>
        {SECTION_12.map((c) => <label key={c} className="flex items-center gap-2 min-h-12"><input type="checkbox" checked={checks.includes(c)} onChange={() => toggle(c)} /> {c}</label>)}
        <p className="text-xs text-muted">{INCOME_NOTE}</p>
        <p role="status" className="rounded border border-ink/40 bg-tint p-3 font-medium">{checks.length ? "You may qualify for free legal aid. Start with the free options below. The DLSA makes the final decision." : "Not sure? Ask your DLSA. They decide eligibility. The free options are listed first either way."}</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl">Free options first</h2>
        {FREE_OPTIONS.map((o) => (
          <div key={o.name} className="card border-ink">
            <p className="font-medium">{o.name} <span className="chip ml-1 bg-ink text-paper">{o.label}</span></p>
            <p className="text-sm">{o.how}</p>
          </div>
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl">Find a lawyer</h2>
        <p className="text-xs text-muted">All lawyers listed here are made up for this demo.</p>
        <div className="grid grid-cols-2 gap-2">
          {[["City", city, setCity, uniq(LAWYERS.map((l) => l.city))], ["Specialisation", area, setArea, uniq(LAWYERS.map((l) => l.area))], ["Language", lang, setLang, uniq(LAWYERS.flatMap((l) => l.languages))], ["Format", fmt, setFmt, uniq(LAWYERS.flatMap((l) => l.formats))]].map(([lab, val, set, opts]) => (
            <div key={lab}><label htmlFor={"lw-" + lab} className="text-sm font-medium block">{lab}</label><select id={"lw-" + lab} className={input} value={val} onChange={(e) => set(e.target.value)}>{opts.map((o) => <option key={o}>{o}</option>)}</select></div>
          ))}
        </div>
        {!lawyers.length && <p className="text-sm">No lawyers match. Try "Any" in one of the filters.</p>}
        {lawyers.map((l) => (
          <div key={l.name} className="card">
            <p className="font-medium">{l.name} <span className={"chip ml-1 " + (l.label === "Paid" ? "" : "bg-ink text-paper")}>{l.label}</span></p>
            <p className="text-sm">{l.area} · {l.city} · {l.languages.join(", ")} · {l.formats.join(", ")}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
