// Free legal aid eligibility follows Section 12 of the Legal Services Authorities Act, 1987 (as listed in the brief).
export const SECTION_12 = ["I am a woman", "I am a child, or I am applying for a child", "I belong to a Scheduled Caste or Scheduled Tribe", "I have a disability", "I am in custody", "I am an industrial worker", "I am a victim of trafficking or of a disaster", "My yearly income is below my state's limit"];
export const INCOME_NOTE = "Sample limit: Rs 3,00,000 a year. Each state sets its own limit. Check with your DLSA.";

export const FREE_OPTIONS = [
  { name: "District Legal Services Authority (DLSA)", label: "Government legal aid", how: "Go to the DLSA office at your district court and ask for free legal aid. Bring ID, proof of income or category, and your complaint papers." },
  { name: "NALSA helpline 15100", label: "Government legal aid", how: "Call 15100 to be connected to your state legal services authority." },
  { name: "Tele-Law at Common Service Centres", label: "Free consultation", how: "Get video advice from a lawyer at your nearest Common Service Centre." },
  { name: "Nyaya Bandhu", label: "Free consultation", how: "Pro bono lawyers who take referrals through the government's Nyaya Bandhu programme." },
  { name: "Law school legal aid clinics", label: "Free consultation", how: "Many law colleges run free clinics. Ask at the nearest one." },
];

// Every name below is made up.
export const LAWYERS = [
  { name: "Adv. Kavita Rao (sample)", city: "Jaipur", area: "Anti-corruption", languages: ["Hindi", "English"], formats: ["In person", "Remote"], label: "Free consultation" },
  { name: "Adv. Mohan Iyer (sample)", city: "Chennai", area: "Service matters", languages: ["Tamil", "English"], formats: ["In person"], label: "Paid" },
  { name: "Adv. Farida Khan (sample)", city: "Delhi", area: "Criminal law", languages: ["Hindi", "English", "Urdu"], formats: ["Remote"], label: "Free consultation" },
  { name: "Adv. Suresh Patel (sample)", city: "Jaipur", area: "Public interest", languages: ["Hindi"], formats: ["In person", "Remote"], label: "Paid" },
  { name: "Adv. Lakshmi Narayan (sample)", city: "Chennai", area: "Anti-corruption", languages: ["Tamil", "English", "Hindi"], formats: ["Remote"], label: "Paid" },
  { name: "Adv. Deepa Singh (sample)", city: "Delhi", area: "Public interest", languages: ["Hindi", "English"], formats: ["In person"], label: "Free consultation" },
];
