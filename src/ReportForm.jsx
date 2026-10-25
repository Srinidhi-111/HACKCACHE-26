import { useState, useRef } from "react";
import { DEPARTMENTS } from "./data/authorities";
import { DEADLINES } from "./data/config";
import { CATEGORIES } from "./lib/labels";
import { FIELD_KEYS, FIELD_LABEL, NOT_STATED, requestDraft } from "./lib/aiDraft";

export default function ReportForm({ onSubmit, busy }) {
  const [step, setStep] = useState(1);
  const [dept, setDept] = useState(DEPARTMENTS[0]);
  const [cat, setCat] = useState(CATEGORIES[0]);
  const [text, setText] = useState("");
  const [lang, setLang] = useState("hi-IN");
  const [listening, setListening] = useState(false);
  const [name, setName] = useState("Sunita Devi (sample)");
  const [phone, setPhone] = useState("98XXXXXX01");
  const [witness, setWitness] = useState("");
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState(null);
  const [mode, setMode] = useState("demo");
  const [fields, setFields] = useState({});
  const [receipt, setReceipt] = useState(null);
  const rec = useRef(null);
  const SR = typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition);

  function toggleMic() {
    if (listening) { rec.current && rec.current.stop(); return; }
    const r = new SR();
    r.lang = lang; r.continuous = true; r.interimResults = false;
    r.onresult = (e) => {
      let t = "";
      for (let i = e.resultIndex; i < e.results.length; i++) if (e.results[i].isFinal) t += e.results[i][0].transcript + " ";
      if (t.trim()) setText((p) => (p ? p + " " : "") + t.trim());
    };
    r.onend = () => setListening(false);
    r.onerror = () => setListening(false);
    rec.current = r; r.start(); setListening(true);
  }

  async function toReview() {
    setLoading(true);
    const r = await requestDraft(text.trim());
    setDraft(r.draft); setMode(r.mode);
    setFields(Object.fromEntries(FIELD_KEYS.map((k) => [k, r.draft[k].value])));
    setLoading(false); setStep(4);
  }

  async function submit() {
    const report = Object.fromEntries(FIELD_KEYS.map((k) => [k, { value: (fields[k] || "").trim() || NOT_STATED, source: draft[k].source }]));
    const id = await onSubmit({ category: cat, department: dept, office: "Sample office", description: text.trim(), complainant: { name: name.trim(), phone: phone.trim() }, witness: witness.trim() || null, aiMode: mode, aiDraft: draft, report });
    setReceipt({ id, dept, cat });
  }

  if (receipt) {
    return (
      <div className="max-w-xl space-y-5">
        <h1 className="text-3xl">Your complaint is recorded</h1>
        <div className="border-2 border-dashed border-ink bg-panel p-5 space-y-3">
          <p className="lbl">Acknowledgement slip</p>
          <p className="mono text-2xl" style={{ fontSize: "1.6rem" }}>{receipt.id}</p>
          <p>{receipt.cat} · sent to the {receipt.dept} chain.</p>
          <p className="text-muted">The first office must acknowledge within {DEADLINES.acknowledgeDays} days and respond within {DEADLINES.respondDays} days. If it does not, your complaint moves to the next authority and you are told. That never means anyone has been found guilty, only that the deadline passed.</p>
          <p className="font-medium">Keep this number to track your complaint.</p>
        </div>
        <div className="flex flex-wrap gap-3 no-print">
          <a className="btn-main" href={`#/complaint/${receipt.id}`}>Track my complaint</a>
          <button className="btn" onClick={() => window.print()}>Print this slip</button>
          <button className="btn" onClick={() => { setReceipt(null); setStep(1); setText(""); setWitness(""); setDraft(null); }}>Report another problem</button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <div className="flex gap-1" aria-hidden="true">{[1, 2, 3, 4].map((i) => <span key={i} className={"h-1.5 flex-1 rounded-sm " + (i <= step ? "bg-ink" : "bg-rule")} />)}</div>
        <p className="lbl mt-2">Step {step} of 4</p>
      </div>

      {step === 1 && (
        <section className="space-y-5">
          <h1 className="text-3xl">What happened?</h1>
          <div><label htmlFor="dept" className="font-medium block mb-1">Which department?</label>
            <select id="dept" className="field" value={dept} onChange={(e) => setDept(e.target.value)}>{DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}</select></div>
          <fieldset className="space-y-2"><legend className="font-medium mb-1">What kind of problem?</legend>
            {CATEGORIES.map((c) => (
              <label key={c} className={"flex items-center gap-3 min-h-12 rounded border px-3 cursor-pointer " + (cat === c ? "border-ink bg-tint" : "border-ink/30 bg-panel")}>
                <input type="radio" name="cat" checked={cat === c} onChange={() => setCat(c)} /> {c}
              </label>
            ))}
          </fieldset>
          <button className="btn-main" onClick={() => setStep(2)}>Continue</button>
        </section>
      )}

      {step === 2 && (
        <section className="space-y-4">
          <h1 className="text-3xl">Tell us in your own words</h1>
          <label htmlFor="desc" className="sr-only">Your account</label>
          <textarea id="desc" rows={6} className="field" value={text} onChange={(e) => setText(e.target.value)} />
          {SR ? (
            <div className="flex gap-2 max-w-sm">
              <label htmlFor="lang" className="sr-only">Speaking language</label>
              <select id="lang" className="field" value={lang} onChange={(e) => setLang(e.target.value)}><option value="hi-IN">हिंदी</option><option value="en-IN">English</option></select>
              <button className="btn" onClick={toggleMic}>{listening ? "Stop" : "Speak"}</button>
            </div>
          ) : <p className="text-sm text-muted">Speaking is not supported in this browser. Try Chrome, or type instead.</p>}
          <p className="text-sm text-muted">To draft your report, your words (not your name or phone) are sent to an AI service. Do not type real names or numbers in this demo.</p>
          <div className="flex gap-3"><button className="btn" onClick={() => setStep(1)}>Back</button><button className="btn-main" disabled={!text.trim()} onClick={() => setStep(3)}>Continue</button></div>
        </section>
      )}

      {step === 3 && (
        <section className="space-y-4">
          <h1 className="text-3xl">About you</h1>
          <p className="text-muted">Only the reviewer sees these. The office and the public never do.</p>
          <div><label htmlFor="nm" className="font-medium block mb-1">Your name (made-up)</label><input id="nm" className="field" value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div><label htmlFor="ph" className="font-medium block mb-1">Your phone (made-up)</label><input id="ph" className="field" value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
          <div><label htmlFor="wt" className="font-medium block mb-1">Witness name, optional</label><input id="wt" className="field" value={witness} onChange={(e) => setWitness(e.target.value)} /></div>
          <div className="flex gap-3"><button className="btn" onClick={() => setStep(2)}>Back</button><button className="btn-main" disabled={loading || !name.trim()} onClick={toReview}>{loading ? "Preparing your report…" : "Prepare my report"}</button></div>
        </section>
      )}

      {step === 4 && (
        <section className="space-y-5">
          <h1 className="text-3xl">Check your report</h1>
          <p className="card text-sm">{mode === "ai" ? "Drafted by AI from your words. The AI can be wrong, so check every line." : "Demo result: no AI key is set, so simple rules made this draft from your words. Check every line."} You can correct anything. Your corrections are kept next to the draft.</p>
          {FIELD_KEYS.map((k) => (
            <div key={k}>
              <label htmlFor={"f-" + k} className="font-medium block mb-1">{FIELD_LABEL[k]}</label>
              <textarea id={"f-" + k} rows={2} className="field" value={fields[k]} onChange={(e) => setFields({ ...fields, [k]: e.target.value })} />
              <p className="text-sm text-muted mt-1">{draft[k].source ? `From your words: "${draft[k].source}"` : "Not stated in your account."}</p>
            </div>
          ))}
          <div className="flex gap-3"><button className="btn" onClick={() => setStep(3)}>Back</button><button disabled={busy} className="btn-main" onClick={submit}>Submit complaint</button></div>
        </section>
      )}
    </div>
  );
}
