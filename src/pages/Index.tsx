import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { AppHeader } from "@/components/AppHeader";
import { MonthTabs } from "@/components/MonthTabs";
import { TimesheetTable, newId } from "@/components/TimesheetTable";
import { SummaryPanel } from "@/components/SummaryPanel";
import type { TimeEntry } from "@/lib/persistence/types";
import { getActivities } from "@/lib/services/activities";
import { getTimesheetEntries, saveTimesheetEntries } from "@/lib/services/timesheets";
import { getUserProfile, type UserProfile } from "@/lib/services/users";
import { toUserPath, getUsernameFromSearch } from "@/lib/session";

const Index = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<UserProfile | null>(null);
  const now = new Date();
  const [year, setYear] = useState<number>(now.getFullYear());
  const [month, setMonth] = useState<number>(now.getMonth() + 1);
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [activities, setActivities] = useState<string[]>([]);
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

    void getUserProfile(username)
      .then(setUser)
      .catch(() => navigate("/login", { replace: true }));
  }, [location.search, navigate]);

  useEffect(() => {
    if (!user) return;

    let active = true;
    setIsLoading(true);
    isFirstLoad.current = true;

    void Promise.all([
      getActivities(user.username),
      getTimesheetEntries(user.username, year, month),
    ]).then(([nextActivities, nextEntries]) => {
      if (!active) return;

      setActivities(nextActivities);
      setEntries(nextEntries);
      setIsLoading(false);
    });

    return () => {
      active = false;
    };
  }, [user, year, month]);

  useEffect(() => {
    if (!user) return;
    if (isFirstLoad.current) {
      isFirstLoad.current = false;
      return;
    }

    setSaveStatus("saving");
    if (saveTimer.current) window.clearTimeout(saveTimer.current);

    saveTimer.current = window.setTimeout(() => {
      void saveTimesheetEntries(user.username, year, month, entries)
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
  }, [entries, user, year, month]);

  const handleLogout = () => {
    navigate("/login", { replace: true });
  };

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

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader user={user} saveStatus={saveStatus} onLogout={handleLogout} />
      <MonthTabs year={year} month={month} onMonthChange={setMonth} onYearChange={setYear} />
      <main className="container py-6">
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <section>
            <h2 className="sr-only">Timesheet</h2>
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
      </main>
    </div>
  );
};

export default Index;
