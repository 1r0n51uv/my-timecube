import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useActivitiesQuery, useAppConfigQuery, useEntriesQuery, useReplaceEntriesMutation } from "@/api/hooks";
import { AppHeader } from "@/components/AppHeader";
import { MonthTabs } from "@/components/MonthTabs";
import { TimesheetTable, newId } from "@/components/TimesheetTable";
import { SummaryPanel } from "@/components/SummaryPanel";
import { clearCurrentUser, getCurrentUser } from "@/lib/auth";
import { isCompleteTimeEntry } from "@/lib/entry-validation";
import type { TimeEntry } from "@/lib/types";

const Index = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState<string | null>(null);
  const now = new Date();
  const [year, setYear] = useState<number>(now.getFullYear());
  const [month, setMonth] = useState<number>(now.getMonth() + 1);
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const saveTimer = useRef<number | null>(null);
  const isFirstLoad = useRef(true);
  const configQuery = useAppConfigQuery();
  const activitiesQuery = useActivitiesQuery(username);
  const entriesQuery = useEntriesQuery(username, year, month);
  const replaceEntries = useReplaceEntriesMutation(username ?? "", year, month);

  const handleLogout = () => {
    clearCurrentUser();
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
  const hasIncompleteEntries = useMemo(
    () => entries.some((entry) => !isCompleteTimeEntry(entry)),
    [entries],
  );

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      navigate("/login", { replace: true });
      return;
    }
    setUsername(currentUser);
  }, [navigate]);

  useEffect(() => {
    isFirstLoad.current = true;
  }, [username, year, month]);

  useEffect(() => {
    setEntries(entriesQuery.data?.entries ?? []);
  }, [entriesQuery.data]);

  useEffect(() => {
    if (!username) {
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
  }, [entries, hasIncompleteEntries, replaceEntries, username]);


  if (!username) {
    return null;
  }

  const activities = activitiesQuery.data?.activities ?? configQuery.data?.defaultActivities ?? [];

  return (
    <div className="min-h-screen bg-background">
      <AppHeader
        username={username}
        adminUsers={configQuery.data?.adminUsers ?? []}
        saveStatus={saveStatus}
        onLogout={handleLogout}
      />
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
