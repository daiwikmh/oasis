"use client";

import { useEffect, useRef } from "react";

interface Props {
  lines: string[];
  isRunning: boolean;
}

export default function ThinkingTerminal({ lines, isRunning }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines]);

  function lineColor(text: string): string {
    if (text.startsWith("ERROR") || text.includes("REJECTED")) return "text-red-400";
    if (text.startsWith("Done") || text.includes("Confirmed")) return "text-emerald-400";
    if (text.includes("APPROVED") || text.includes("OK")) return "text-emerald-300";
    if (text.startsWith("Verification") || text.startsWith("Tx")) return "text-zinc-300";
    return "text-zinc-400";
  }

  return (
    <div className="w-full rounded border border-zinc-800 bg-[#0a0a0a] p-4 font-mono text-sm">
      <div className="mb-2 flex items-center gap-2 border-b border-zinc-800 pb-2">
        <span className="h-2.5 w-2.5 rounded-full bg-red-600" />
        <span className="h-2.5 w-2.5 rounded-full bg-yellow-600" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-600" />
        <span className="ml-2 text-xs text-zinc-600">parellax / verified-brain</span>
      </div>
      <div className="min-h-[200px] max-h-[400px] overflow-y-auto space-y-1">
        {lines.length === 0 && (
          <span className="text-zinc-700">Awaiting intent...</span>
        )}
        {lines.map((line, i) => (
          <div key={i} className={`${lineColor(line)} leading-6`}>
            <span className="text-zinc-700 select-none">{"> "}</span>
            {line}
          </div>
        ))}
        {isRunning && (
          <div className="text-zinc-500 animate-pulse">{">"} ...</div>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
