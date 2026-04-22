import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TimeEntry } from "@/lib/storage";
import { totalHours } from "@/lib/timesheet";
import { PeriodReport } from "./PeriodReport";

interface Props {
  year: number;
  month: number;
  entries: TimeEntry[];
}

export function SummaryPanel({ year, month, entries }: Props) {
  const total = totalHours(entries);
  const days = Math.round((total / 8) * 100) / 100;

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
          <PeriodReport year={year} month={month} entries={entries} />
        </CardContent>
      </Card>
    </div>
  );
}