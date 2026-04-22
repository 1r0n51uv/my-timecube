import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import {
  useActivitiesQuery,
  useAppConfigQuery,
  useEntriesQuery,
  useMonthlySummaryQuery,
  useReplaceEntriesMutation,
} from "@/api/hooks";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getCurrentUser, isAdminUser } from "@/lib/auth";
import { isCompleteTimeEntry } from "@/lib/entry-validation";
import { MonthTabs } from "@/components/MonthTabs";
import { TimesheetTable, newId } from "@/components/TimesheetTable";
import { SummaryPanel } from "@/components/SummaryPanel";
import type { TimeEntry } from "@/lib/types";

export default function Admin() {
  const navigate = useNavigate();
  const configQuery = useAppConfigQuery();
  const [currentUser, setCurrentUserState] = useState<string | null>(null);
  const [targetUser, setTargetUser] = useState<string>("");
  const now = new Date();
  const [year, setYear] = useState<number>(now.getFullYear());
  const [month, setMonth] = useState<number>(now.getMonth() + 1);
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const saveTimer = useRef<number | null>(null);
  const isFirstLoad = useRef(true);
  const activitiesQuery = useActivitiesQuery(targetUser || null);
  const entriesQuery = useEntriesQuery(targetUser || null, year, month);
  const replaceEntries = useReplaceEntriesMutation(targetUser, year, month);
  const summaryQuery = useMonthlySummaryQuery(year, month, Boolean(currentUser));

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      navigate("/login", { replace: true });
      return;
    }
    if (!isAdminUser(user, configQuery.data?.adminUsers ?? [])) {
      toast.error("Admin access only");
      navigate("/", { replace: true });
      return;
    }
    setCurrentUserState(user);
  }, [configQuery.data, navigate]);

  useEffect(() => {
    if (!targetUser && configQuery.data?.allowedUsers?.[0]) {
      setTargetUser(configQuery.data.allowedUsers[0]);
    }
  }, [configQuery.data, targetUser]);

  useEffect(() => {
    isFirstLoad.current = true;
  }, [currentUser, targetUser, year, month]);

  useEffect(() => {
    setEntries(entriesQuery.data?.entries ?? []);
  }, [entriesQuery.data]);

  useEffect(() => {
    if (!currentUser || !targetUser) {
      return;
    }
    if (isFirstLoad.current) {
      isFirstLoad.current = false;
      return;
    }
    if (hasIncompleteEntries) {
      setSaveStatus("idle");
      return;
    }

    setSaveStatus("saving");
    if (saveTimer.current) {
      window.clearTimeout(saveTimer.current);
    }

    saveTimer.current = window.setTimeout(() => {
      replaceEntries.mutate(entries, {
        onSuccess: () => {
          setSaveStatus("saved");
          window.setTimeout(() => setSaveStatus("idle"), 1200);
        },
        onError: () => {
          setSaveStatus("idle");
          toast.error("Failed to save entries");
        },
      });
    }, 300);

    return () => {
      if (saveTimer.current) {
        window.clearTimeout(saveTimer.current);
      }
    };
  }, [currentUser, entries, hasIncompleteEntries, replaceEntries, targetUser]);

  const userTotals = useMemo(() => summaryQuery.data?.summaries ?? [], [summaryQuery.data]);

  const handleAdd = (date: string) => {
    setEntries((prev) => [...prev, { id: newId(), date, activity: "", hours: 0, notes: "" }]);
  };

  const handleUpdate = (id: string, patch: Partial<TimeEntry>) => {
    setEntries((prev) => prev.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)));
  };

  const handleDelete = (id: string) => {
    setEntries((prev) => prev.filter((entry) => entry.id !== id));
    toast.success("Entry deleted");
  };

  const sortedEntries = useMemo(
    () => [...entries].sort((a, b) => a.date.localeCompare(b.date)),
    [entries],
  );
  const hasIncompleteEntries = useMemo(
    () => entries.some((entry) => !isCompleteTimeEntry(entry)),
    [entries],
  );

  if (!currentUser) {
    return null;
  }

  const allowedUsers = configQuery.data?.allowedUsers ?? [];
  const activities = activitiesQuery.data?.activities ?? configQuery.data?.defaultActivities ?? [];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur">
        <div className="container flex h-14 items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <h1 className="text-base font-semibold tracking-tight">Admin Panel</h1>
            {saveStatus === "saving" && (
              <span className="text-xs text-muted-foreground">Saving...</span>
            )}
            {saveStatus === "saved" && (
              <span className="text-xs text-muted-foreground">Saved</span>
            )}
          </div>
          <Badge variant="secondary">{currentUser}</Badge>
        </div>
      </header>

      <main className="container py-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Team overview</CardTitle>
            <CardDescription>
              Totals for {String(month).padStart(2, "0")}/{year}. Click a user to manage their timesheet.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {userTotals.map((summary) => (
                <button
                  key={summary.user}
                  onClick={() => setTargetUser(summary.user)}
                  className={`flex items-center justify-between rounded-md border px-3 py-2 text-left transition-colors hover:bg-accent ${
                    targetUser === summary.user ? "border-primary bg-accent" : ""
                  }`}
                >
                  <span className="text-sm font-medium">{summary.user}</span>
                  <span className="text-sm text-muted-foreground">{summary.hours}h</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Editing: {targetUser}</CardTitle>
              <CardDescription>Changes are saved to this user&apos;s timesheet.</CardDescription>
            </div>
            <div className="w-56">
              <Select value={targetUser} onValueChange={setTargetUser}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {allowedUsers.map((user) => (
                    <SelectItem key={user} value={user}>
                      {user}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <MonthTabs year={year} month={month} onMonthChange={setMonth} onYearChange={setYear} />
            <div className="p-6 grid gap-6 lg:grid-cols-[1fr_360px]">
              <section>
                <TimesheetTable
                  year={year}
                  month={month}
                  entries={sortedEntries}
                  activities={activities}
                  onAdd={handleAdd}
                  onUpdate={handleUpdate}
                  onDelete={handleDelete}
                />
              </section>
              <aside>
                <SummaryPanel year={year} month={month} entries={entries} />
              </aside>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
