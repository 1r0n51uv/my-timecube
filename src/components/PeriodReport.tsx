import { useMemo } from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { TimeEntry } from "@/lib/storage";
import { periodBreakdown, toDateStr, formatHalfDays, type ActivityBreakdown } from "@/lib/timesheet";

interface Props {
  entries: TimeEntry[];
  from: Date | undefined;
  to: Date | undefined;
  onFromChange: (d: Date | undefined) => void;
  onToChange: (d: Date | undefined) => void;
  onBreakdownChange?: (b: ActivityBreakdown[]) => void;
}

export function PeriodReport({ entries, from, to, onFromChange, onToChange }: Props) {
  const breakdown = useMemo(() => {
    if (!from || !to) return [];
    const f = toDateStr(from.getFullYear(), from.getMonth() + 1, from.getDate());
    const t = toDateStr(to.getFullYear(), to.getMonth() + 1, to.getDate());
    const [lo, hi] = f <= t ? [f, t] : [t, f];
    return periodBreakdown(entries, lo, hi);
  }, [entries, from, to]);

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-2">
        <DateField label="From" value={from} onChange={onFromChange} />
        <DateField label="To" value={to} onChange={onToChange} />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Activity</TableHead>
              <TableHead>Half-days</TableHead>
              <TableHead>Raw hours</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {breakdown.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-sm text-muted-foreground py-6">
                  No data in selected range
                </TableCell>
              </TableRow>
            ) : (
              breakdown.map((b) => (
                <TableRow key={b.activity}>
                  <TableCell className="font-medium">{b.activity}</TableCell>
                  <TableCell>{formatHalfDays(b)}</TableCell>
                  <TableCell>{b.totalHours}h</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function DateField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: Date | undefined;
  onChange: (d: Date | undefined) => void;
}) {
  return (
    <div className="flex flex-col gap-1 flex-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn("justify-start text-left font-normal", !value && "text-muted-foreground")}
          >
            <CalendarIcon className="h-4 w-4" />
            {value ? format(value, "PP") : <span>Pick a date</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={value}
            onSelect={onChange}
            initialFocus
            className={cn("p-3 pointer-events-auto")}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}