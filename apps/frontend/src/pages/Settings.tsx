import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { useActivitiesQuery, useUpdateActivitiesMutation } from "@/api/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useCurrentUser } from "@/lib/auth";

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
              Manage the activities available in your timesheet. Changes are saved per user.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SettingsActivitiesEditor
              key={`${username}-${activitiesQuery.dataUpdatedAt}`}
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
  const [activities, setActivities] = useState<string[]>(initialActivities);
  const [newActivity, setNewActivity] = useState("");
  const updateActivities = useUpdateActivitiesMutation(username);

  const persist = async (next: string[]) => {
    setActivities(next);
    await updateActivities.mutateAsync(next);
  };

  const handleAdd = async () => {
    const value = newActivity.trim();
    if (!value) {
      return;
    }
    if (activities.includes(value)) {
      toast.error("Activity already exists");
      return;
    }
    await persist([...activities, value]);
    setNewActivity("");
    toast.success("Activity added");
  };

  const handleEdit = async (index: number, value: string) => {
    const next = [...activities];
    next[index] = value;
    await persist(next);
  };

  const handleDelete = async (index: number) => {
    const next = activities.filter((_, currentIndex) => currentIndex !== index);
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
          activities.map((activity, index) => (
            <div key={`${activity}-${index}`} className="flex gap-2 items-center">
              <Input value={activity} onChange={(e) => void handleEdit(index, e.target.value)} />
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 shrink-0"
                onClick={() => void handleDelete(index)}
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
