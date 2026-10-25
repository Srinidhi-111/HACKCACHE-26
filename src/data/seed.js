// Made-up sample complaints. Every name, office and event here is fictional.
const SUNITA = { name: "Sunita Devi (sample)", phone: "98XXXXXX01" };
const NS = { value: "not stated", source: "" };
const f = (value, source) => ({ value, source: source || value });
export const SEED = [
  {
    id: "JD-2026-004821",
    meta: { category: "Bribe demand", department: "Municipal", office: "Ward Office 14, Jaipur (sample)", description: "Sunita Devi says the licensing clerk asked her for money to speed up renewal of her vending licence. Her neighbour Meena Sharma was standing next to her.", complainant: SUNITA, witness: "Meena Sharma (sample)", aiMode: "seed", report: { what_happened: f("A clerk allegedly asked for money to speed up a licence renewal", "asked her for money to speed up renewal of her vending licence"), when: NS, where: f("Ward Office 14", "Ward Office 14"), who: f("The licensing clerk", "licensing clerk"), asked_for: f("Money to speed up the renewal", "asked her for money") } },
    steps: [
      { type: "redaction_approved", actor: "Reviewer (sample)", data: { summary: "A vendor alleges that a clerk at the ward office asked for an unofficial payment to speed up a licence renewal. A [removed] was present." } },
      { type: "acknowledged", actor: "Office official (sample)", data: { note: "Complaint received and under review." } },
      { type: "update", actor: "Office official (sample)", data: { note: "Asked the licensing clerk for the file." } },
    ],
  },
  {
    id: "JD-2026-004822",
    meta: { category: "Refused service", department: "Public hospital", office: "District Hospital OPD (sample)", description: "Ravi Menon (sample), 52, says the OPD counter refused to issue a slip and gave no reason.", complainant: { name: "Ravi Menon (sample)", phone: "98XXXXXX02" }, witness: null },
    steps: [
      { type: "redaction_approved", actor: "Reviewer (sample)", data: { summary: "A patient alleges the OPD counter refused to issue a slip and gave no reason." } },
    ],
  },
  ...[
    ["JD-2026-004830", "Anil Verma (sample)", "98XXXXXX11", "A clerk at Ward Office 9 asked me for money to clear my property tax file."],
    ["JD-2026-004831", "Rekha Joshi (sample)", "98XXXXXX12", "A clerk at Ward Office 9 asked me for money to clear my property tax file today."],
    ["JD-2026-004832", "Imran Qureshi (sample)", "98XXXXXX13", "The clerk at Ward Office 9 asked me for money to clear my property tax file."],
  ].map(([id, name, phone, description]) => ({
    id,
    meta: { category: "Bribe demand", department: "Municipal", office: "Ward Office 9, Jaipur (sample)", description, complainant: { name, phone }, witness: null, aiMode: "seed", report: { what_happened: f(description), when: NS, where: f("Ward Office 9", "Ward Office 9"), who: f("A clerk", "clerk"), asked_for: f("Money to clear a property tax file", "asked me for money") } },
    steps: [],
  })),
];
