import { useEffect, useState, useCallback } from "react";
import { loadEvents, onChange, createComplaint, seedIfEmpty, runEscalations, nowMs, getOffset } from "./lib/store";
import { fmtDate } from "./lib/escalation";
import { ROLES, ROLE_NOTE, listComplaints, complaintView } from "./lib/views";
import { Home, ComplaintList, ComplaintPage, PublicPage, AdminPage, Restricted } from "./Pages.jsx";
import ReportForm from "./ReportForm.jsx";
import Legal from "./Legal.jsx";

const ROLE_HOME = { Citizen: "/", "Office official": "/office", Reviewer: "/review", Public: "/public", Admin: "/admin" };
const NAV = {
  Citizen: [["/", "Home"], ["/report", "Report a problem"], ["/complaints", "My complaints"], ["/legal", "Legal help"], ["/public", "Public record"]],
  "Office official": [["/office", "Inbox"]],
  Reviewer: [["/review", "Review queue"], ["/public", "Public record"]],
  Public: [["/public", "Public record"]],
  Admin: [["/admin", "Demo tools"], ["/public", "Public record"]],
};

function useRoute() {
  const [h, setH] = useState(window.location.hash);
  useEffect(() => { const f = () => { setH(window.location.hash); window.scrollTo(0, 0); }; window.addEventListener("hashchange", f); return () => window.removeEventListener("hashchange", f); }, []);
  return h.replace(/^#/, "") || "/";
}

export default function App() {
  const [role, setRoleState] = useState(sessionStorage.getItem("jd_role") || "Citizen");
  const [events, setEvents] = useState(loadEvents());
  const [busy, setBusy] = useState(false);
  const route = useRoute();
  const [, page = "", arg = ""] = route.split("/");

  const refresh = useCallback(async () => { await runEscalations(); setEvents(loadEvents()); }, []);
  useEffect(() => { seedIfEmpty().then(refresh); return onChange(refresh); }, [refresh]);
  const run = async (fn) => { setBusy(true); try { return await fn(); } finally { setBusy(false); await refresh(); } };
  const setRole = (r) => { sessionStorage.setItem("jd_role", r); setRoleState(r); window.location.hash = ROLE_HOME[r]; };

  const now = nowMs();
  const off = getOffset();
  let rows = listComplaints(role, events, now);
  if (role === "Reviewer") rows = rows.map((r) => { const h = complaintView("Reviewer", events, r.id, now).head; return { ...r, flags: h.flags.length, approved: h.approved }; });

  let content;
  if (page === "") content = role === "Citizen" ? <Home /> : <Home />;
  else if (page === "report") content = role === "Citizen" ? <ReportForm busy={busy} onSubmit={(meta) => run(() => createComplaint(meta))} /> : <Restricted who="citizens" />;
  else if (page === "complaints") content = role === "Citizen" ? <ComplaintList rows={rows} title="My complaints" intro="Every complaint you have filed, and where it is now." empty="You have not filed a complaint yet." /> : <Restricted who="citizens" />;
  else if (page === "legal") content = role === "Citizen" ? <Legal view={arg ? complaintView("Citizen", events, arg, now) : null} /> : <Restricted who="citizens" />;
  else if (page === "complaint") content = <ComplaintPage key={role + arg} role={role} events={events} id={arg} now={now} run={run} busy={busy} />;
  else if (page === "public") content = <PublicPage rows={listComplaints("Public", events, now)} />;
  else if (page === "office") content = role === "Office official" ? <ComplaintList rows={rows} title="Office inbox" intro="Complaints for your office, with names and details removed." /> : <Restricted who="office officials" />;
  else if (page === "review") content = role === "Reviewer" ? <ComplaintList rows={rows} title="Review queue" intro="You see everything here, including identity and evidence. You decide what the office is allowed to see." /> : <Restricted who="reviewers" />;
  else if (page === "admin") content = role === "Admin" ? <AdminPage rows={rows} run={run} busy={busy} /> : <Restricted who="the admin" />;
  else content = <Home />;

  return (
    <div className="min-h-screen flex flex-col">
      <div className="no-print bg-ink text-paper text-sm">
        <div className="max-w-6xl mx-auto px-4 py-2 flex flex-wrap items-center gap-x-4 gap-y-1">
          <span className="font-medium tracking-wider text-xs">DEMO</span>
          <label htmlFor="role" className="flex items-center gap-2">Viewing as
            <select id="role" className="bg-paper text-ink rounded px-2 min-h-8" value={role} onChange={(e) => setRole(e.target.value)}>{ROLES.map((r) => <option key={r}>{r}</option>)}</select>
          </label>
          <span>Demo date: {fmtDate(now)}{off ? ` (+${off} days)` : ""}</span>
          <span className="opacity-80 hidden md:inline">{ROLE_NOTE[role]}</span>
        </div>
      </div>

      <header className="no-print border-b border-rule">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-wrap items-baseline justify-between gap-3">
          <a href={"#" + ROLE_HOME[role]} className="no-underline text-ink"><span className="font-serif text-2xl font-semibold">Jawabdehi</span> <span className="text-muted">जवाबदेही</span></a>
          <nav aria-label="Main" className="flex flex-wrap gap-x-5 gap-y-1">
            {NAV[role].map(([to, label]) => { const on = to === "/" ? page === "" : page === to.slice(1); return <a key={to} href={"#" + to} aria-current={on ? "page" : undefined} className={"no-underline py-1 border-b-2 " + (on ? "border-ink font-medium" : "border-transparent text-muted hover:text-ink")}>{label}</a>; })}
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">{content}</main>

      <footer className="no-print border-t border-rule">
        <div className="max-w-6xl mx-auto px-4 py-4 text-sm text-muted flex flex-wrap justify-between gap-2">
          <span className="font-medium text-ink">If you are in danger right now, call 112.</span>
          <span>Everything here is made-up sample data. Prototype for HACKCACHE'26.</span>
        </div>
      </footer>
    </div>
  );
}
