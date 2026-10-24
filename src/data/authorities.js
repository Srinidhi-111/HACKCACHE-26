// Simplified sample chains; real chains differ by state. Level 0 is the first office, the last is the top.
export const CHAINS = {
  Municipal: ["Ward Office", "Zonal Officer", "Municipal Commissioner", "State Urban Development Department", "Lokayukta"],
  Police: ["Station House Officer", "Superintendent of Police", "Police Complaints Authority", "State Human Rights Commission"],
  "Public hospital": ["Medical Superintendent", "Chief Medical Officer (District)", "State Health Department"],
  School: ["Principal", "Block Education Officer", "District Education Officer", "State Education Department"],
};
export const chainFor = (dept) => CHAINS[dept] || CHAINS.Municipal;
export const DEPARTMENTS = Object.keys(CHAINS);
