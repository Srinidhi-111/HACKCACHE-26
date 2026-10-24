// The first event of every complaint links back to this fixed starting value.
export const GENESIS = "0".repeat(64);

const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");

export async function sha256Text(text) {
  return hex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text)));
}
export async function sha256Bytes(arrayBuffer) {
  return hex(await crypto.subtle.digest("SHA-256", arrayBuffer));
}

// Canonical JSON: keys sorted, so the same content always gives the same text (and the same hash).
export function canonical(v) {
  if (Array.isArray(v)) return "[" + v.map(canonical).join(",") + "]";
  if (v && typeof v === "object")
    return "{" + Object.keys(v).sort().map((k) => JSON.stringify(k) + ":" + canonical(v[k])).join(",") + "}";
  return JSON.stringify(v);
}

// hash = SHA-256( previous hash + this event's content )
export function hashEvent(prevHash, body) {
  return sha256Text(prevHash + canonical(body));
}
