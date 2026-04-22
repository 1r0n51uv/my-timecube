import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
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
import { ALLOWED_USERS } from "@/lib/constants";
import { loadEntries, saveEntries, type TimeEntry } from "@/lib/storage";
import { loadActivities } from "@/lib/activities";
import { MonthTabs } from "@/components/MonthTabs";
import { TimesheetTable, newId } from "@/components/TimesheetTable";
import { SummaryPanel } from "@/components/SummaryPanel";
import { totalHours } from "@/lib/timesheet";

export default function Admin() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUserState] = useState<string | null>(null);
  const [targetUser, setTargetUser] = useState<string>(ALLOWED_USERS[0]);
  const now = new Date();
  const [year, setYear] = useState<number>(now.getFullYear());
  const [month, setMonth] = useState<number>(now.getMonth() + 1);
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [activities, setActivities] = useState<string[]>([]);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const saveTimer = useRef<number | null>(null);
  const isFirstLoad = useRef(true);

  useEffect(() => {
    const u = getCurrentUser();
    if (!u) {
      navigate("/login", { replace: true });
      return;
    }
    if (!isAdminUser(u)) {
      toast.error("Admin access only");
      navigate("/", { replace: true });
      return;
    }
    setCurrentUserState(u);
  }, [navigate]);

  // Load when target/month/year changes
  useEffect(() => {
    if (!currentUser) return;
    isFirstLoad.current = true;
    setEntries(loadEntries(targetUser, year, month));
    setActivities(loadActivities(targetUser));
  }, [currentUser, targetUser, year, month]);

  // Auto-save
  useEffect(() => {
    if (!currentUser) return;
    if (isFirstLoad.current) {
      isFirstLoad.current = false;
      return;
    }
    setSaveStatus("saving");
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      saveEntries(targetUser, year, month, entries);
      setSaveStatus("saved");
      window.setTimeout(() => setSaveStatus("idle"), 1200);
    }, 300);
    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    };
  }, [entries, currentUser, targetUser, year, month]);

  const userTotals = useMemo(
    () =>
      ALLOWED_USERS.map((u) => ({
        user: u,
        hours: totalHours(loadEntries(u, year, month)),
      })),
    [year, month, entries, targetUser],
  );

  const handleAdd = (date: string) => {
    setEntries((prev) => [...prev, { id: newId(), date, activity: "", hours: 0, notes: "" }]);
  };
  const handleUpdate = (id: string, patch: Partial<TimeEntry>) => {
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  };
  const handleDelete = (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
    toast.success("Entry deleted");
  };

  const sortedEntries = useMemo(
    () => [...entries].sort((a, b) => a.date.localeCompare(b.date)),
    [entries],
  );

  if (!currentUser) return null;

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
              <span className="text-xs text-muted-foreground">Saving…</span>
            )}
            {saveStatus === "saved" && (
              <span className="text-xs text-muted-foreground">Saved ✓</span>
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
              {userTotals.map((u) => (
                <button
                  key={u.user}
                  onClick={() => setTargetUser(u.user)}
                  className={`flex items-center justify-between rounded-md border px-3 py-2 text-left transition-colors hover:bg-accent ${
                    targetUser === u.user ? "border-primary bg-accent" : ""
                  }`}
                >
                  <span className="text-sm font-medium">{u.user}</span>
                  <span className="text-sm text-muted-foreground">{u.hours}h</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Editing: {targetUser}</CardTitle>
              <CardDescription>Changes are saved to this user's timesheet.</CardDescription>
            </div>
            <div className="w-56">
              <Select value={targetUser} onValueChange={setTargetUser}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ALLOWED_USERS.map((u) => (
                    <SelectItem key={u} value={u}>
                      {u}
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