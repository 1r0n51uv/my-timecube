import { MONTHS } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface Props {
  month: number; // 1-12
  onChange: (m: number) => void;
}

export function MonthTabs({ month, onChange }: Props) {
  return (
    <div className="border-b bg-card">
      <div className="container">
        <div className="flex gap-1 overflow-x-auto py-2">
          {MONTHS.map((m, i) => {
            const idx = i + 1;
            const active = idx === month;
            return (
              <button
                key={m}
                onClick={() => onChange(idx)}
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