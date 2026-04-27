"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle2, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ValidationIssue } from "@/lib/thermal";

export interface ValidationItem extends ValidationIssue {
  id: string;
  titre: string;
  /** Index de la section à activer au clic (optionnel). */
  sectionIdx?: number;
}

interface Props {
  issues: ValidationItem[];
  onGoTo?: (sectionIdx: number) => void;
}

export default function ValidationBanner({ issues, onGoTo }: Props) {
  const [expanded, setExpanded] = useState(true);

  if (issues.length === 0) {
    return (
      <Card className="border-emerald-200 bg-emerald-50/40">
        <CardContent className="py-3 px-4 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <p className="text-sm text-emerald-800">
            Cohérence vérifiée — aucune incohérence détectée sur les saisies.
          </p>
        </CardContent>
      </Card>
    );
  }

  const errors = issues.filter((i) => i.niveau === "error").length;
  const warns = issues.length - errors;

  return (
    <Card className="border-amber-200 bg-amber-50/40">
      <CardContent className="p-0">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="w-full flex items-center gap-2 px-4 py-3 text-left"
        >
          <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
          <p className="text-sm font-medium text-amber-900 flex-1">
            {issues.length} point{issues.length > 1 ? "s" : ""} de vigilance détecté{issues.length > 1 ? "s" : ""}
            <span className="ml-2 text-xs font-normal text-amber-700">
              {errors > 0 && `${errors} bloquant${errors > 1 ? "s" : ""}`}
              {errors > 0 && warns > 0 && " · "}
              {warns > 0 && `${warns} avertissement${warns > 1 ? "s" : ""}`}
            </span>
          </p>
          {expanded ? (
            <ChevronDown className="h-4 w-4 text-amber-700" />
          ) : (
            <ChevronRight className="h-4 w-4 text-amber-700" />
          )}
        </button>

        {expanded && (
          <ul className="border-t border-amber-200 divide-y divide-amber-200/70">
            {issues.map((issue) => (
              <li
                key={issue.id}
                className="px-4 py-2.5 flex items-start gap-3 text-sm"
              >
                <span
                  className={cn(
                    "mt-0.5 inline-block h-1.5 w-1.5 rounded-full shrink-0",
                    issue.niveau === "error" ? "bg-red-500" : "bg-amber-500",
                  )}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-amber-900">{issue.titre}</p>
                  <p className="text-xs text-amber-800 mt-0.5">{issue.message}</p>
                </div>
                {typeof issue.sectionIdx === "number" && onGoTo && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs h-7 text-amber-900 hover:text-amber-950 hover:bg-amber-100"
                    onClick={() => onGoTo(issue.sectionIdx!)}
                  >
                    Aller à la section
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
