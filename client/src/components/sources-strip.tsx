import React, { useState } from "react";
import { ExternalLink, BookOpen, Globe } from "lucide-react";
import { cn } from "@/lib/utils";

interface Source {
  title: string;
  url: string;
  snippet: string;
}

interface SourcesStripProps {
  sources: Source[];
}

export function SourcesStrip({ sources }: SourcesStripProps) {
  const [selectedSource, setSelectedSource] = useState<Source | null>(null);

  if (!sources || sources.length === 0) return null;

  return (
    <div className="space-y-2 select-none">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
        <Globe className="w-3.5 h-3.5" />
        <span>Grounded Web Sources ({sources.length})</span>
      </div>
      
      {/* Horizontal scrolling chips list */}
      <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        {sources.map((source, idx) => (
          <button
            key={idx}
            onClick={() => setSelectedSource(selectedSource === source ? null : source)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs whitespace-nowrap transition-all duration-200",
              selectedSource === source
                ? "bg-primary/20 border-primary/40 text-primary-foreground font-medium shadow-[0_0_12px_rgba(var(--primary-rgb),0.15)]"
                : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:border-white/20"
            )}
          >
            <span className="flex items-center justify-center w-4 h-4 text-[10px] font-bold bg-white/10 rounded-full">
              {idx + 1}
            </span>
            <span className="max-w-[150px] truncate">{source.title}</span>
          </button>
        ))}
      </div>

      {/* Expanded snippet display panel */}
      {selectedSource && (
        <div className="rounded-xl border border-white/10 bg-slate-900/40 p-3.5 backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-center justify-between gap-4 mb-1.5">
            <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-primary" />
              {selectedSource.title}
            </h4>
            <a
              href={selectedSource.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline font-semibold"
            >
              <span>Visit Link</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed font-sans select-text">
            {selectedSource.snippet}
          </p>
          <div className="mt-2 text-[9px] text-slate-600 truncate select-text">
            {selectedSource.url}
          </div>
        </div>
      )}
    </div>
  );
}
