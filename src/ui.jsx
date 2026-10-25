// Small shared pieces: status chip and the record seal.
export function Status({ s }) {
  const cls = s === "Reached the top of the chain" ? "border-stamp text-stamp" : s === "Investigation in progress" ? "bg-ink text-paper border-ink" : s === "Response received" ? "bg-tint border-ink" : "border-ink/50";
  return <span className={"inline-block rounded-sm border px-2 py-0.5 text-sm font-medium " + cls}>{s}</span>;
}

export function Seal({ state }) {
  const cfg = {
    none: { c: "text-muted border-muted border-dashed", icon: "–", label: "NOT CHECKED", o: "dashed" },
    ok: { c: "text-ink border-ink", icon: "✓", label: "INTACT", o: "solid" },
    bad: { c: "text-stamp border-stamp border-dashed -rotate-6", icon: "✕", label: "BROKEN", o: "dashed" },
  }[state];
  return (
    <div aria-hidden="true" className={"w-24 h-24 rounded-full border-2 flex flex-col items-center justify-center flex-none " + cfg.c} style={{ outline: `1px ${cfg.o} currentColor`, outlineOffset: "-7px" }}>
      <span className="text-2xl leading-none">{cfg.icon}</span>
      <span className="text-[11px] font-medium tracking-wider mt-1">{cfg.label}</span>
    </div>
  );
}
