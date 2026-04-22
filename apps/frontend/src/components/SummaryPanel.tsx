import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import type { TimeEntry } from "@/lib/types";
import {
  daysInMonth,
  formatHalfDays,
  periodBreakdown,
  toDateStr,
  totalHours,
} from "@/lib/timesheet";
import { PeriodReport } from "./PeriodReport";

interface Props {
  year: number;
  month: number;
  entries: TimeEntry[];
}

export function SummaryPanel({ year, month, entries }: Props) {
  const total = totalHours(entries);
  const days = Math.round((total / 8) * 100) / 100;

  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month - 1, daysInMonth(year, month));
  const [from, setFrom] = useState<Date | undefined>(monthStart);
  const [to, setTo] = useState<Date | undefined>(monthEnd);

  // Reset range when month/year changes
  useMemo(() => {
    setFrom(new Date(year, month - 1, 1));
    setTo(new Date(year, month - 1, daysInMonth(year, month)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, month]);

  const rawString = useMemo(() => {
    if (!from || !to) return "";
    const f = toDateStr(from.getFullYear(), from.getMonth() + 1, from.getDate());
    const t = toDateStr(to.getFullYear(), to.getMonth() + 1, to.getDate());
    const [lo, hi] = f <= t ? [f, t] : [t, f];
    const breakdown = periodBreakdown(entries, lo, hi);
    if (breakdown.length === 0) return "";
    return breakdown.map((b) => `${b.activity}: ${formatHalfDays(b)}`).join(" | ");
  }, [entries, from, to]);

  const copyRaw = async () => {
    if (!rawString) return;
    await navigator.clipboard.writeText(rawString);
    toast.success("Copied to clipboard");
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Monthly total</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-semibold tracking-tight">{total}h</div>
          <div className="text-sm text-muted-foreground mt-1">→ {days}g (working days)</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Period report</CardTitle>
        </CardHeader>
        <CardContent>
          <PeriodReport
            entries={entries}
            from={from}
            to={to}
            onFromChange={setFrom}
            onToChange={setTo}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-medium text-muted-foreground">Raw export</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2"
            disabled={!rawString}
            onClick={copyRaw}
          >
            <Copy className="h-3 w-3" />
            Copy
          </Button>
        </CardHeader>
        <CardContent>
          <pre className="whitespace-pre-wrap break-words rounded-md bg-muted p-3 text-xs font-mono">
            {rawString || "No data in selected range"}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
