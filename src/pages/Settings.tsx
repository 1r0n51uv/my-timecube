import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth";
import { loadActivities, saveActivities } from "@/lib/activities";

export default function Settings() {
  const navigate = useNavigate();
  const [username, setUsername] = useState<string | null>(null);
  const [activities, setActivities] = useState<string[]>([]);
  const [newActivity, setNewActivity] = useState("");

  useEffect(() => {
    const u = getCurrentUser();
    if (!u) {
      navigate("/login", { replace: true });
      return;
    }
    setUsername(u);
    setActivities(loadActivities(u));
  }, [navigate]);

  const persist = (next: string[]) => {
    setActivities(next);
    if (username) saveActivities(username, next);
  };

  const handleAdd = () => {
    const v = newActivity.trim();
    if (!v) return;
    if (activities.includes(v)) {
      toast.error("Activity already exists");
      return;
    }
    persist([...activities, v]);
    setNewActivity("");
    toast.success("Activity added");
  };

  const handleEdit = (idx: number, value: string) => {
    const next = [...activities];
    next[idx] = value;
    persist(next);
  };

  const handleDelete = (idx: number) => {
    const next = activities.filter((_, i) => i !== idx);
    persist(next);
    toast.success("Activity removed");
  };

  if (!username) return null;

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
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="New activity name"
                value={newActivity}
                onChange={(e) => setNewActivity(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAdd();
                  }
                }}
              />
              <Button onClick={handleAdd}>
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
                activities.map((a, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <Input value={a} onChange={(e) => handleEdit(i, e.target.value)} />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 shrink-0"
                      onClick={() => handleDelete(i)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}