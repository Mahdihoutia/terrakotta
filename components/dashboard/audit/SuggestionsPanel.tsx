"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Check, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Suggestion } from "@/lib/thermal";

interface Props {
  suggestions: Suggestion[];
  onApply: (s: Suggestion) => void;
  onApplyAll: () => void;
}

export default function SuggestionsPanel({ suggestions, onApply, onApplyAll }: Props) {
  const [expanded, setExpanded] = useState(true);
  const [applied, setApplied] = useState<Set<string>>(new Set());

  if (suggestions.length === 0) return null;

  const remaining = suggestions.filter((s) => !applied.has(s.fieldId));
  if (remaining.length === 0) return null;

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardContent className="p-0">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="w-full flex items-center gap-2 px-4 py-3 text-left"
        >
          <Sparkles className="h-4 w-4 text-primary shrink-0" />
          <p className="text-sm font-medium flex-1">
            {remaining.length} valeur{remaining.length > 1 ? "s" : ""} suggérée{remaining.length > 1 ? "s" : ""}
            <Badge variant="outline" className="ml-2 text-[10px]">Pré-remplissage</Badge>
          </p>
          {expanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </button>

        {expanded && (
          <>
            <ul className="border-t divide-y divide-border/60">
              {remaining.map((s) => (
                <li key={s.fieldId} className="px-4 py-2.5 flex items-start gap-3 text-sm">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <p className="font-medium truncate">{s.label}</p>
                      <span className="text-xs tabular-nums text-foreground/80">
                        {s.value}{s.unit && <span className="text-muted-foreground ml-0.5">{s.unit}</span>}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">{s.rationale}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs h-7"
                    onClick={() => {
                      onApply(s);
                      setApplied((prev) => new Set(prev).add(s.fieldId));
                    }}
                  >
                    <Check className="h-3 w-3 mr-1" />
                    Appliquer
                  </Button>
                </li>
              ))}
            </ul>
            <div className="px-4 py-2 border-t flex justify-end">
              <Button
                size="sm"
                variant="outline"
                className="text-xs h-7"
                onClick={() => {
                  onApplyAll();
                  setApplied((prev) => {
                    const next = new Set(prev);
                    remaining.forEach((s) => next.add(s.fieldId));
                    return next;
                  });
                }}
              >
                Tout appliquer ({remaining.length})
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// silence unused import in some builds
void cn;
