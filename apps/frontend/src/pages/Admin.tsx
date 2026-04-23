import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Users } from "lucide-react";
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
import { isAdminUser, useCurrentUser } from "@/lib/auth";
import { isCompleteTimeEntry } from "@/lib/entry-validation";
import { MonthTabs } from "@/components/MonthTabs";
import { TimesheetTable, newId } from "@/components/TimesheetTable";
import { SummaryPanel } from "@/components/SummaryPanel";
import type { TimeEntry } from "@/lib/types";

export default function Admin() {
  const currentUser = useCurrentUser();
  const configQuery = useAppConfigQuery();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (configQuery.data && !isAdminUser(currentUser, configQuery.data.adminUsers)) {
    return <Navigate to="/" replace />;
  }

  return <AdminPageContent currentUser={currentUser} />;
}

function AdminPageContent({ currentUser }: { currentUser: string }) {
  const navigate = useNavigate();
  const configQuery = useAppConfigQuery();
  const [targetUser, setTargetUser] = useState<string>("");
  const now = new Date();
  const [year, setYear] = useState<number>(now.getFullYear());
  const [month, setMonth] = useState<number>(now.getMonth() + 1);
  const summaryQuery = useMonthlySummaryQuery(year, month, true);
  const userTotals = useMemo(() => summaryQuery.data?.summaries ?? [], [summaryQuery.data]);
  const allowedUsers = configQuery.data?.allowedUsers ?? [];
  const selectedUser =
    targetUser && allowedUsers.includes(targetUser) ? targetUser : (allowedUsers[0] ?? "");
  const activitiesQuery = useActivitiesQuery(selectedUser || null);
  const entriesQuery = useEntriesQuery(selectedUser || null, year, month);
  const activities = activitiesQuery.data?.activities ?? configQuery.data?.defaultActivities ?? [];
  const initialEntries = entriesQuery.data?.entries ?? [];

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
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to="/admin/users">
                <Users className="h-4 w-4" />
                Manage users
              </Link>
            </Button>
            <Badge variant="secondary">{currentUser}</Badge>
          </div>
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
                    selectedUser === summary.user ? "border-primary bg-accent" : ""
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
              <CardTitle>Editing: {selectedUser || "No user selected"}</CardTitle>
              <CardDescription>Changes are saved to this user&apos;s timesheet.</CardDescription>
            </div>
            <div className="w-56">
              <Select value={selectedUser} onValueChange={setTargetUser} disabled={!selectedUser}>
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
            {selectedUser ? (
              <>
                <MonthTabs year={year} month={month} onMonthChange={setMonth} onYearChange={setYear} />
                <div className="p-6 grid gap-6 lg:grid-cols-[1fr_360px]">
                  <section>
                    <AdminTimesheetEditor
                      key={`${selectedUser}-${year}-${month}`}
                      username={selectedUser}
                      year={year}
                      month={month}
                      activities={activities}
                      initialEntries={initialEntries}
                    />
                  </section>
                  <aside>
                    <SummaryPanel
                      key={`${selectedUser}-${year}-${month}`}
                      username={selectedUser}
                      year={year}
                      month={month}
                      entries={initialEntries}
                    />
                  </aside>
                </div>
              </>
            ) : (
              <div className="p-6 text-sm text-muted-foreground">No users available yet.</div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

function AdminTimesheetEditor({
  username,
  year,
  month,
  activities,
  initialEntries,
}: {
  username: string;
  year: number;
  month: number;
  activities: string[];
  initialEntries: TimeEntry[];
}) {
  const [entries, setEntries] = useState<TimeEntry[]>(initialEntries);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const saveTimer = useRef<number | null>(null);
  const replaceEntries = useReplaceEntriesMutation(username, year, month);
  const sortedEntries = useMemo(
    () => [...entries].sort((a, b) => a.date.localeCompare(b.date)),
    [entries],
  );

  useLayoutEffect(() => {
    return () => {
      if (saveTimer.current) {
        window.clearTimeout(saveTimer.current);
      }
    };
  }, []);

  const scheduleSave = (nextEntries: TimeEntry[]) => {
    const hasIncompleteEntries = nextEntries.some((entry) => !isCompleteTimeEntry(entry));
    if (saveTimer.current) {
      window.clearTimeout(saveTimer.current);
    }
    if (hasIncompleteEntries) {
      setSaveStatus("idle");
      return;
    }

    setSaveStatus("saving");
    saveTimer.current = window.setTimeout(() => {
      replaceEntries.mutate(nextEntries, {
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
  };

  const updateEntries = (updater: (current: TimeEntry[]) => TimeEntry[]) => {
    setEntries((current) => {
      const nextEntries = updater(current);
      scheduleSave(nextEntries);
      return nextEntries;
    });
  };

  const handleAdd = (date: string) => {
    updateEntries((current) => [...current, { id: newId(), date, activity: "", hours: 0, notes: "" }]);
  };

  const handleUpdate = (id: string, patch: Partial<TimeEntry>) => {
    updateEntries((current) =>
      current.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)),
    );
  };

  const handleDelete = (id: string) => {
    updateEntries((current) => current.filter((entry) => entry.id !== id));
    toast.success("Entry deleted");
  };

  return (
    <>
      {saveStatus === "saving" || saveStatus === "saved" ? (
        <div className="mb-3 text-xs text-muted-foreground">
          {saveStatus === "saving" ? "Saving..." : "Saved"}
        </div>
      ) : null}
      <TimesheetTable
        year={year}
        month={month}
        entries={sortedEntries}
        activities={activities}
        onAdd={handleAdd}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
      />
    </>
  );
}
