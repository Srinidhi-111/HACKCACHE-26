import { useState, useRef } from "react";
import { DEPARTMENTS } from "./data/authorities";
import { CATEGORIES } from "./lib/labels";
import { FIELD_KEYS, FIELD_LABEL, NOT_STATED, requestDraft } from "./lib/aiDraft";

const btn = "min-h-12 px-4 rounded-lg font-semibold border border-slate-400 bg-white active:bg-slate-100 disabled:opacity-50";
const btnMain = "min-h-12 px-4 rounded-lg font-semibold bg-blue-800 text-white active:bg-blue-900 disabled:opacity-50";
const input = "w-full min-h-12 border border-slate-400 rounded-lg px-3 bg-white";

export default function ReportForm({ onSubmit, busy }) {
  const [step, setStep] = useState("write");
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

  async function prepare() {
    setLoading(true);
    const r = await requestDraft(text.trim());
    setDraft(r.draft); setMode(r.mode);
    setFields(Object.fromEntries(FIELD_KEYS.map((k) => [k, r.draft[k].value])));
    setLoading(false); setStep("review");
  }

  async function submit() {
    const report = Object.fromEntries(FIELD_KEYS.map((k) => [k, { value: (fields[k] || "").trim() || NOT_STATED, source: draft[k].source }]));
    await onSubmit({ category: cat, department: dept, office: "Sample office", description: text.trim(), complainant: { name: name.trim(), phone: phone.trim() }, witness: witness.trim() || null, aiMode: mode, aiDraft: draft, report });
    setStep("write"); setText(""); setWitness(""); setDraft(null);
  }

  if (step === "review") {
    return (
      <section className="space-y-3">
        <h2 className="text-xl font-bold">Check your report</h2>
        <p className="text-sm rounded bg-slate-100 border border-slate-300 p-2">
          {mode === "ai" ? "Drafted by AI from your words. The AI can be wrong, so check every line." : "Demo result: no AI key is set, so simple rules made this draft from your words. Check every line."} You can correct anything. Your corrections are kept next to the draft.
        </p>
        {FIELD_KEYS.map((k) => (
          <div key={k}>
            <label htmlFor={"f-" + k} className="font-semibold block">{FIELD_LABEL[k]}</label>
            <textarea id={"f-" + k} rows={2} className="w-full border border-slate-400 rounded-lg p-3" value={fields[k]} onChange={(e) => setFields({ ...fields, [k]: e.target.value })} />
            <p className="text-xs text-slate-600">{draft[k].source ? `From your words: "${draft[k].source}"` : "Not stated in your account."}</p>
          </div>
        ))}
        <div className="flex gap-2">
          <button className={btn} onClick={() => setStep("write")}>Back</button>
          <button disabled={busy} className={btnMain + " flex-1"} onClick={submit}>Submit complaint</button>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-3">
      <h2 className="text-xl font-bold">Report a new problem</h2>
      <label htmlFor="dept" className="font-semibold block">Which department?</label>
      <select id="dept" className={input} value={dept} onChange={(e) => setDept(e.target.value)}>{DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}</select>
      <label htmlFor="cat" className="font-semibold block">What happened?</label>
      <select id="cat" className={input} value={cat} onChange={(e) => setCat(e.target.value)}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select>
      <label htmlFor="desc" className="font-semibold block">Tell us in your own words</label>
      <textarea id="desc" rows={4} className="w-full border border-slate-400 rounded-lg p-3" value={text} onChange={(e) => setText(e.target.value)} />
      {SR ? (
        <div className="flex gap-2">
          <label htmlFor="lang" className="sr-only">Speaking language</label>
          <select id="lang" className={input} value={lang} onChange={(e) => setLang(e.target.value)}><option value="hi-IN">हिंदी</option><option value="en-IN">English</option></select>
          <button className={btn} onClick={toggleMic}>{listening ? "Stop" : "Speak"}</button>
        </div>
      ) : <p className="text-xs text-slate-600">Speaking is not supported in this browser. Try Chrome, or type instead.</p>}
      <label htmlFor="nm" className="font-semibold block">Your name (made-up)</label>
      <input id="nm" className={input} value={name} onChange={(e) => setName(e.target.value)} />
      <label htmlFor="ph" className="font-semibold block">Your phone (made-up)</label>
      <input id="ph" className={input} value={phone} onChange={(e) => setPhone(e.target.value)} />
      <label htmlFor="wt" className="font-semibold block">Witness name, optional (only the reviewer will see it)</label>
      <input id="wt" className={input} value={witness} onChange={(e) => setWitness(e.target.value)} />
      <p className="text-xs text-slate-600">To draft your report, your words (not your name or phone) are sent to an AI service. Don't type real names or numbers in this demo.</p>
      <button disabled={loading || !text.trim() || !name.trim()} className={btnMain + " w-full"} onClick={prepare}>{loading ? "Preparing draft…" : "Prepare my report"}</button>
    </section>
  );
}
