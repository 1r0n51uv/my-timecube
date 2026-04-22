import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import type { TimeEntry } from "@/lib/types";
import { daysInMonth, formatDateLabel, isWeekend, toDateStr } from "@/lib/timesheet";
import { cn } from "@/lib/utils";

interface Props {
  year: number;
  month: number; // 1-12
  entries: TimeEntry[];
  activities: string[];
  onAdd: (date: string) => void;
  onUpdate: (id: string, patch: Partial<TimeEntry>) => void;
  onDelete: (id: string) => void;
}

function newId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function TimesheetTable({ year, month, entries, activities, onAdd, onUpdate, onDelete }: Props) {
  const total = daysInMonth(year, month);

  const rows: Array<{ date: string; day: number; weekend: boolean; entry: TimeEntry | null }> = [];
  for (let d = 1; d <= total; d++) {
    const date = toDateStr(year, month, d);
    const weekend = isWeekend(year, month, d);
    const dayEntries = entries.filter((e) => e.date === date);
    if (dayEntries.length === 0) {
      rows.push({ date, day: d, weekend, entry: null });
    } else {
      for (const e of dayEntries) rows.push({ date, day: d, weekend, entry: e });
    }
  }

  // Mark last row per date for "+ Add entry" button
  const lastIndexPerDate = new Map<string, number>();
  rows.forEach((r, i) => lastIndexPerDate.set(r.date, i));

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <div className="max-h-[70vh] overflow-auto">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-card">
            <TableRow>
              <TableHead className="w-[200px]">Date</TableHead>
              <TableHead className="w-[160px]">Activity</TableHead>
              <TableHead className="w-[100px]">Hours</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead className="w-[60px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r, i) => {
              const isLastForDate = lastIndexPerDate.get(r.date) === i;
              const showDateLabel =
                i === 0 || rows[i - 1].date !== r.date;
              const invalid = r.entry && (!r.entry.activity || !r.entry.hours);
              return (
                <TableRow
                  key={r.entry ? r.entry.id : `empty-${r.date}`}
                  className={cn(
                    r.weekend && "bg-muted/40 text-muted-foreground",
                    invalid && r.entry && "bg-destructive/5",
                  )}
                >
                  <TableCell className="align-top">
                    {showDateLabel ? (
                      <div className="flex flex-col gap-1">
                        <span className="font-medium">{formatDateLabel(year, month, r.day)}</span>
                        {isLastForDate && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-7 w-fit px-2 text-xs"
                            onClick={() => onAdd(r.date)}
                          >
                            <Plus className="h-3 w-3" />
                            Add entry
                          </Button>
                        )}
                      </div>
                    ) : (
                      isLastForDate && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 w-fit px-2 text-xs"
                          onClick={() => onAdd(r.date)}
                        >
                          <Plus className="h-3 w-3" />
                          Add entry
                        </Button>
                      )
                    )}
                  </TableCell>
                  <TableCell>
                    {r.entry ? (
                      <Select
                        value={r.entry.activity || undefined}
                        onValueChange={(v) => onUpdate(r.entry!.id, { activity: v })}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Select…" />
                        </SelectTrigger>
                        <SelectContent>
                          {activities.map((a) => (
                            <SelectItem key={a} value={a}>{a}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">No entry</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {r.entry && (
                      <Input
                        type="number"
                        step={0.5}
                        min={0}
                        max={24}
                        value={r.entry.hours || ""}
                        onChange={(e) =>
                          onUpdate(r.entry!.id, { hours: parseFloat(e.target.value) || 0 })
                        }
                        className="h-9"
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    {r.entry && (
                      <Input
                        value={r.entry.notes}
                        onChange={(e) => onUpdate(r.entry!.id, { notes: e.target.value })}
                        placeholder="Optional notes"
                        className="h-9"
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    {r.entry && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onDelete(r.entry!.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export { newId };
