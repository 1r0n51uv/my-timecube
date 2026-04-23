import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useActivitiesQuery, useAppConfigQuery, useEntriesQuery, useReplaceEntriesMutation } from "@/api/hooks";
import { AppHeader } from "@/components/AppHeader";
import { MonthTabs } from "@/components/MonthTabs";
import { TimesheetTable, newId } from "@/components/TimesheetTable";
import { SummaryPanel } from "@/components/SummaryPanel";
import { clearCurrentUser, useCurrentUser } from "@/lib/auth";
import { isCompleteTimeEntry } from "@/lib/entry-validation";
import type { TimeEntry } from "@/lib/types";

const Index = () => {
  const username = useCurrentUser();
  if (!username) {
    return <Navigate to="/login" replace />;
  }

  return <IndexPageContent username={username} />;
};

function IndexPageContent({ username }: { username: string }) {
  const navigate = useNavigate();
  const now = new Date();
  const [year, setYear] = useState<number>(now.getFullYear());
  const [month, setMonth] = useState<number>(now.getMonth() + 1);
  const configQuery = useAppConfigQuery();
  const activitiesQuery = useActivitiesQuery(username);
  const entriesQuery = useEntriesQuery(username, year, month);

  const handleLogout = () => {
    clearCurrentUser();
    navigate("/login", { replace: true });
  };

  if (!entriesQuery.data && entriesQuery.isLoading) {
    return null;
  }

  const activities = activitiesQuery.data?.activities ?? configQuery.data?.defaultActivities ?? [];
  const initialEntries = entriesQuery.data?.entries ?? [];

  return (
    <div className="min-h-screen bg-background">
      <AppHeader
        username={username}
        adminUsers={configQuery.data?.adminUsers ?? []}
        saveStatus="idle"
        onLogout={handleLogout}
      />
      <MonthTabs year={year} month={month} onMonthChange={setMonth} onYearChange={setYear} />
      <main className="container py-6">
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <section>
            <h2 className="sr-only">Timesheet</h2>
            <TimesheetEditor
              key={`${username}-${year}-${month}`}
              username={username}
              year={year}
              month={month}
              activities={activities}
              initialEntries={initialEntries}
            />
          </section>
          <aside>
            <SummaryPanel
              key={`${username}-${year}-${month}`}
              username={username}
              year={year}
              month={month}
              entries={initialEntries}
            />
          </aside>
        </div>
      </main>
    </div>
  );
};

export default Index;

function TimesheetEditor({
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
