import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { AppHeader } from "@/components/AppHeader";
import { MonthTabs } from "@/components/MonthTabs";
import { TimesheetTable, newId } from "@/components/TimesheetTable";
import { SummaryPanel } from "@/components/SummaryPanel";
import { clearCurrentUser, getCurrentUser } from "@/lib/auth";
import { loadEntries, saveEntries, type TimeEntry } from "@/lib/storage";
import { loadActivities } from "@/lib/activities";

const Index = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState<string | null>(null);
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
    setUsername(u);
    setActivities(loadActivities(u));
  }, [navigate]);

  // Load entries when user/month changes
  useEffect(() => {
    if (!username) return;
    isFirstLoad.current = true;
    setEntries(loadEntries(username, year, month));
  }, [username, year, month]);

  // Auto-save (debounced)
  useEffect(() => {
    if (!username) return;
    if (isFirstLoad.current) {
      isFirstLoad.current = false;
      return;
    }
    setSaveStatus("saving");
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      saveEntries(username, year, month, entries);
      setSaveStatus("saved");
      window.setTimeout(() => setSaveStatus("idle"), 1200);
    }, 300);
    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    };
  }, [entries, username, year, month]);

  const handleLogout = () => {
    clearCurrentUser();
    navigate("/login", { replace: true });
  };

  const handleAdd = (date: string) => {
    setEntries((prev) => [
      ...prev,
      { id: newId(), date, activity: "", hours: 0, notes: "" },
    ]);
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

  if (!username) return null;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader username={username} saveStatus={saveStatus} onLogout={handleLogout} />
      <MonthTabs year={year} month={month} onMonthChange={setMonth} onYearChange={setYear} />
      <main className="container py-6">
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <section>
            <h2 className="sr-only">Timesheet</h2>
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
      </main>
    </div>
  );
};

export default Index;
