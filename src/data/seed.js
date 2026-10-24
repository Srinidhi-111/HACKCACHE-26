// Made-up sample complaints. Every name, office and event here is fictional.
export const SEED = [
  {
    id: "JD-2026-004821",
    meta: { category: "Bribe demand", department: "Municipal", office: "Ward Office 14, Jaipur (sample)", description: "Alleged request for money to speed up renewal of a vending licence." },
    steps: [
      { type: "acknowledged", actor: "Office official (sample)", data: { note: "Complaint received and under review." } },
      { type: "update", actor: "Office official (sample)", data: { note: "Asked the licensing clerk for the file." } },
    ],
  },
  {
    id: "JD-2026-004822",
    meta: { category: "Refused service", department: "Public hospital", office: "District Hospital OPD (sample)", description: "Alleged refusal to issue an OPD slip without a reason." },
    steps: [],
  },
];
