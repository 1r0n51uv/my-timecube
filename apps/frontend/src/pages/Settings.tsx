import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { useActivitiesQuery, useUpdateActivitiesMutation } from "@/api/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useCurrentUser } from "@/lib/auth";
import { newId } from "@/components/TimesheetTable";

export default function Settings() {
  const navigate = useNavigate();
  const username = useCurrentUser();
  const activitiesQuery = useActivitiesQuery(username);

  if (!username) {
    return <Navigate to="/login" replace />;
  }

  if (!activitiesQuery.data && activitiesQuery.isLoading) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur">
        <div className="container flex h-14 items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <h1 className="text-base font-semibold tracking-tight">Settings</h1>
        </div>
      </header>
      <main className="container py-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Activities</CardTitle>
            <CardDescription>
              Manage the shared activities available in every user timesheet.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SettingsActivitiesEditor
              key={username}
              username={username}
              initialActivities={activitiesQuery.data?.activities ?? []}
            />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

function SettingsActivitiesEditor({
  username,
  initialActivities,
}: {
  username: string;
  initialActivities: string[];
}) {
  const [activities, setActivities] = useState<ActivityDraft[]>(
    () =>
      initialActivities.map((activity) => ({
        id: newId(),
        value: activity,
        savedValue: activity,
      })),
  );
  const [newActivity, setNewActivity] = useState("");
  const updateActivities = useUpdateActivitiesMutation(username);

  const persist = async (next: ActivityDraft[]) => {
    setActivities(
      next.map((activity) => {
        const trimmedValue = activity.value.trim();
        return {
          ...activity,
          value: trimmedValue,
          savedValue: trimmedValue,
        };
      }),
    );
    await updateActivities.mutateAsync(
      next.map((activity) => activity.value.trim()).filter(Boolean),
    );
  };

  const handleAdd = async () => {
    const value = newActivity.trim();
    if (!value) {
      return;
    }
    if (activities.some((activity) => activity.value === value)) {
      toast.error("Activity already exists");
      return;
    }
    await persist([...activities, { id: newId(), value, savedValue: value }]);
    setNewActivity("");
    toast.success("Activity added");
  };

  const handleDraftChange = (id: string, value: string) => {
    setActivities((current) =>
      current.map((activity) => (activity.id === id ? { ...activity, value } : activity)),
    );
  };

  const handleCommit = async (id: string) => {
    const current = activities.find((activity) => activity.id === id);
    if (!current) {
      return;
    }

    const value = current.value.trim();
    if (!value) {
      toast.error("Activity name cannot be empty");
      setActivities((items) =>
        items.map((activity) =>
          activity.id === id ? { ...activity, value: activity.savedValue } : activity,
        ),
      );
      return;
    }

    const normalizedActivities = activities.map((activity) =>
      activity.id === id ? { ...activity, value } : activity,
    );

    const duplicateCount = normalizedActivities.filter((activity) => activity.value === value).length;
    if (duplicateCount > 1) {
      toast.error("Activity already exists");
      setActivities((items) =>
        items.map((activity) =>
          activity.id === id ? { ...activity, value: activity.savedValue } : activity,
        ),
      );
      return;
    }

    await persist(normalizedActivities);
  };

  const handleDelete = async (id: string) => {
    const next = activities.filter((activity) => activity.id !== id);
    await persist(next);
    toast.success("Activity removed");
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="New activity name"
          value={newActivity}
          onChange={(e) => setNewActivity(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void handleAdd();
            }
          }}
        />
        <Button onClick={() => void handleAdd()} disabled={updateActivities.isPending}>
          <Plus className="h-4 w-4" />
          Add
        </Button>
      </div>

      <div className="space-y-2">
        {activities.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            No activities yet. Add one above.
          </p>
        ) : (
          activities.map((activity) => (
            <div key={activity.id} className="flex gap-2 items-center">
              <Input
                value={activity.value}
                onChange={(e) => handleDraftChange(activity.id, e.target.value)}
                onBlur={() => void handleCommit(activity.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    e.currentTarget.blur();
                  }
                }}
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 shrink-0"
                onClick={() => void handleDelete(activity.id)}
                disabled={updateActivities.isPending}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

interface ActivityDraft {
  id: string;
  value: string;
  savedValue: string;
}
