// Made-up sample complaints. Every name, office and event here is fictional.
const SUNITA = { name: "Sunita Devi (sample)", phone: "98XXXXXX01" };
export const SEED = [
  {
    id: "JD-2026-004821",
    meta: { category: "Bribe demand", department: "Municipal", office: "Ward Office 14, Jaipur (sample)", description: "Sunita Devi says the licensing clerk asked her for money to speed up renewal of her vending licence. Her neighbour Meena Sharma was standing next to her.", complainant: SUNITA, witness: "Meena Sharma (sample)" },
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
];
