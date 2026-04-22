import { MONTHS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  year: number;
  month: number; // 1-12
  onMonthChange: (m: number) => void;
  onYearChange: (y: number) => void;
}

export function MonthTabs({ year, month, onMonthChange, onYearChange }: Props) {
  return (
    <div className="border-b bg-card">
      <div className="container flex items-center gap-3 py-2">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onYearChange(year - 1)} aria-label="Previous year">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-[3.5rem] text-center text-sm font-semibold tabular-nums">{year}</span>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onYearChange(year + 1)} aria-label="Next year">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="h-6 w-px bg-border" />
        <div className="flex gap-1 overflow-x-auto">
          {MONTHS.map((m, i) => {
            const idx = i + 1;
            const active = idx === month;
            return (
              <button
                key={m}
                onClick={() => onMonthChange(idx)}
                className={cn(
                  "px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {m}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}