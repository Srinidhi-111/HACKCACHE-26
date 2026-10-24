import { GENESIS, hashEvent, sha256Bytes } from "./hash";
import { SEED } from "../data/seed";

const KEY = "jd_events";
const DB = "jd_evidence";
const FILES = "files";
const chan = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel("jd") : null;

// Other open tabs call this when something changes (so citizen / official / reviewer tabs stay in sync).
export function onChange(fn) {
  if (!chan) return () => {};
  chan.addEventListener("message", fn);
  return () => chan.removeEventListener("message", fn);
}
const ping = () => chan && chan.postMessage("changed");

export function loadEvents() {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
}
function save(events) { localStorage.setItem(KEY, JSON.stringify(events)); ping(); }

// ---------- evidence files (IndexedDB) ----------
function openDb() {
  return new Promise((res, rej) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(FILES);
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}
async function putFile(key, buf) {
  const db = await openDb();
  return new Promise((res, rej) => {
    const t = db.transaction(FILES, "readwrite");
    t.objectStore(FILES).put(buf, key);
    t.oncomplete = () => res();
    t.onerror = () => rej(t.error);
  });
}
async function getFile(key) {
  const db = await openDb();
  return new Promise((res, rej) => {
    const q = db.transaction(FILES).objectStore(FILES).get(key);
    q.onsuccess = () => res(q.result);
    q.onerror = () => rej(q.error);
  });
}
async function clearFiles() {
  const db = await openDb();
  return new Promise((res, rej) => {
    const t = db.transaction(FILES, "readwrite");
    t.objectStore(FILES).clear();
    t.oncomplete = () => res();
    t.onerror = () => rej(t.error);
  });
}

// ---------- the append-only record ----------
// There is no edit and no delete function in this file, on purpose.
// A correction or withdrawal is just another event added to the end.
export async function appendEvent(complaintId, type, actor, data = {}, file = null) {
  const events = loadEvents();
  const mine = events.filter((e) => e.complaintId === complaintId);
  const last = mine[mine.length - 1];
  const seq = last ? last.seq + 1 : 1;
  const prevHash = last ? last.hash : GENESIS;
  const id = `${complaintId}#${seq}`;
  let payload = { ...data };
  if (file) {
    const buf = await file.arrayBuffer();
    payload = { ...payload, fileName: file.name, size: file.size, sha256: await sha256Bytes(buf) };
    await putFile(id, buf); // file is stored first, then the event that points to it
  }
  const body = { complaintId, seq, type, actor, at: new Date().toISOString(), data: payload };
  const hash = await hashEvent(prevHash, body);
  save([...loadEvents(), { id, ...body, prevHash, hash }]);
  return id;
}

export async function createComplaint(meta, id) {
  const cid = id || `JD-2026-${String(Math.floor(100000 + Math.random() * 899999)).slice(0, 6)}`;
  await appendEvent(cid, "submitted", "Citizen (Sunita, sample)", meta);
  return cid;
}

// Recomputes the whole chain and every evidence fingerprint. Reports the first entry that does not match.
export async function verifyComplaint(complaintId) {
  const evs = loadEvents().filter((e) => e.complaintId === complaintId).sort((a, b) => a.seq - b.seq);
  const fail = (badSeq, reason) => ({ ok: false, badSeq, reason });
  let prev = GENESIS;
  for (let i = 0; i < evs.length; i++) {
    const e = evs[i];
    if (e.seq !== i + 1) return fail(i + 1, `Entry ${i + 1} is missing from the record.`);
    if (e.prevHash !== prev) return fail(e.seq, "This entry no longer links to the one before it.");
    const h = await hashEvent(prev, { complaintId: e.complaintId, seq: e.seq, type: e.type, actor: e.actor, at: e.at, data: e.data });
    if (h !== e.hash) return fail(e.seq, "The content of this entry was changed after it was recorded.");
    if (e.type === "evidence_added") {
      const buf = await getFile(e.id);
      if (!buf) return fail(e.seq, "The evidence file for this entry is missing.");
      if ((await sha256Bytes(buf)) !== e.data.sha256) return fail(e.seq, "The evidence file was changed after it was added.");
    }
    prev = e.hash;
  }
  return { ok: true, count: evs.length };
}

// Admin demo only: edits one stored event directly in storage, WITHOUT fixing its hash,
// so "Verify this record" can be shown catching it.
export function tamper(complaintId) {
  const events = loadEvents();
  const mine = events.filter((e) => e.complaintId === complaintId);
  if (!mine.length) return null;
  const target = mine[Math.min(1, mine.length - 1)];
  const changed = events.map((e) => (e.id === target.id ? { ...e, data: { ...e.data, note: "(quietly rewritten by someone)" } } : e));
  save(changed);
  return target.seq;
}

let seeding = null;
export function seedIfEmpty() {
  if (loadEvents().length) return Promise.resolve();
  if (!seeding) {
    seeding = (async () => {
      for (const c of SEED) {
        await createComplaint(c.meta, c.id);
        for (const s of c.steps) await appendEvent(c.id, s.type, s.actor, s.data);
      }
    })().finally(() => { seeding = null; });
  }
  return seeding;
}

export async function resetDemo() {
  localStorage.removeItem(KEY);
  await clearFiles();
  await seedIfEmpty();
  ping();
}
