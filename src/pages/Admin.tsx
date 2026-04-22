import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
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
import { isAdminUser } from "@/lib/auth";
import { MonthTabs } from "@/components/MonthTabs";
import { TimesheetTable, newId } from "@/components/TimesheetTable";
import { SummaryPanel } from "@/components/SummaryPanel";
import { totalHours } from "@/lib/timesheet";
import type { TimeEntry } from "@/lib/persistence/types";
import { getActivities } from "@/lib/services/activities";
import { getTimesheetEntries, saveTimesheetEntries } from "@/lib/services/timesheets";
import { getUserProfile, getUsers, type UserProfile } from "@/lib/services/users";
import { getUsernameFromSearch, toUserPath } from "@/lib/session";

export default function Admin() {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [availableUsers, setAvailableUsers] = useState<UserProfile[]>([]);
  const [targetUser, setTargetUser] = useState<string>("");
  const now = new Date();
  const [year, setYear] = useState<number>(now.getFullYear());
  const [month, setMonth] = useState<number>(now.getMonth() + 1);
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [activities, setActivities] = useState<string[]>([]);
  const [userTotals, setUserTotals] = useState<Array<{ user: string; hours: number }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const saveTimer = useRef<number | null>(null);
  const isFirstLoad = useRef(true);

  useEffect(() => {
    const username = getUsernameFromSearch(location.search);
    if (!username) {
      navigate("/login", { replace: true });
      return;
    }

    void Promise.all([getUserProfile(username), getUsers()])
      .then(([user, users]) => {
        if (!isAdminUser(user)) {
          toast.error("Admin access only");
          navigate(toUserPath("/", username), { replace: true });
          return;
        }

        setCurrentUser(user);
        setAvailableUsers(users);
        setTargetUser((prev) => prev || users[0]?.username || "");
      })
      .catch(() => navigate("/login", { replace: true }));
  }, [location.search, navigate]);

  useEffect(() => {
    if (!currentUser || !targetUser) return;

    let active = true;
    setIsLoading(true);
    isFirstLoad.current = true;

    void Promise.all([
      getTimesheetEntries(targetUser, year, month),
      getActivities(targetUser),
    ]).then(([nextEntries, nextActivities]) => {
      if (!active) return;

      setEntries(nextEntries);
      setActivities(nextActivities);
      setIsLoading(false);
    });

    return () => {
      active = false;
    };
  }, [currentUser, targetUser, year, month]);

  useEffect(() => {
    if (!currentUser || availableUsers.length === 0) return;

    let active = true;

    void Promise.all(
      availableUsers.map(async (user) => ({
        user: user.username,
        hours: totalHours(await getTimesheetEntries(user.username, year, month)),
      })),
    ).then((nextTotals) => {
      if (!active) return;
      setUserTotals(nextTotals);
    });

    return () => {
      active = false;
    };
  }, [currentUser, availableUsers, year, month, entries]);

  useEffect(() => {
    if (!currentUser || !targetUser) return;
    if (isFirstLoad.current) {
      isFirstLoad.current = false;
      return;
    }

    setSaveStatus("saving");
    if (saveTimer.current) window.clearTimeout(saveTimer.current);

    saveTimer.current = window.setTimeout(() => {
      void saveTimesheetEntries(targetUser, year, month, entries)
        .then(() => {
          setSaveStatus("saved");
          window.setTimeout(() => setSaveStatus("idle"), 1200);
        })
        .catch(() => {
          setSaveStatus("idle");
          toast.error("Unable to save timesheet");
        });
    }, 300);

    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    };
  }, [entries, currentUser, targetUser, year, month]);

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

  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur">
        <div className="container flex h-14 items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate(toUserPath("/", currentUser.username))}>
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
          <Badge variant="secondary">{currentUser.username}</Badge>
        </div>
      </header>

      <main className="container space-y-6 py-6">
        <Card>
          <CardHeader>
            <CardTitle>Team overview</CardTitle>
            <CardDescription>
              Totals for {String(month).padStart(2, "0")}/{year}. Click a user to manage their timesheet.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {userTotals.map((userSummary) => (
                <button
                  key={userSummary.user}
                  onClick={() => setTargetUser(userSummary.user)}
                  className={`flex items-center justify-between rounded-md border px-3 py-2 text-left transition-colors hover:bg-accent ${
                    targetUser === userSummary.user ? "border-primary bg-accent" : ""
                  }`}
                >
                  <span className="text-sm font-medium">{userSummary.user}</span>
                  <span className="text-sm text-muted-foreground">{userSummary.hours}h</span>
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
                  {availableUsers.map((user) => (
                    <SelectItem key={user.username} value={user.username}>
                      {user.username}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <MonthTabs year={year} month={month} onMonthChange={setMonth} onYearChange={setYear} />
            <div className="grid gap-6 p-6 lg:grid-cols-[1fr_360px]">
              <section>
                {isLoading ? (
                  <div className="rounded-lg border bg-card p-6 text-sm text-muted-foreground">
                    Loading timesheet...
                  </div>
                ) : (
                  <TimesheetTable
                    year={year}
                    month={month}
                    entries={sortedEntries}
                    activities={activities}
                    onAdd={handleAdd}
                    onUpdate={handleUpdate}
                    onDelete={handleDelete}
                  />
                )}
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
