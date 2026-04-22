import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getActivities, saveUserActivities } from "@/lib/services/activities";
import { getUserProfile } from "@/lib/services/users";
import { getUsernameFromSearch, toUserPath } from "@/lib/session";

export default function Settings() {
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState<string | null>(null);
  const [activities, setActivities] = useState<string[]>([]);
  const [newActivity, setNewActivity] = useState("");

  useEffect(() => {
    const currentUser = getUsernameFromSearch(location.search);
    if (!currentUser) {
      navigate("/login", { replace: true });
      return;
    }

    void Promise.all([getUserProfile(currentUser), getActivities(currentUser)])
      .then(([user, nextActivities]) => {
        setUsername(user.username);
        setActivities(nextActivities);
      })
      .catch(() => navigate("/login", { replace: true }));
  }, [location.search, navigate]);

  const persist = (next: string[]) => {
    setActivities(next);
    if (username) {
      void saveUserActivities(username, next).catch(() => {
        toast.error("Unable to save activities");
      });
    }
  };

  const handleAdd = () => {
    const value = newActivity.trim();
    if (!value) return;
    if (activities.includes(value)) {
      toast.error("Activity already exists");
      return;
    }

    persist([...activities, value]);
    setNewActivity("");
    toast.success("Activity added");
  };

  const handleEdit = (index: number, value: string) => {
    const next = [...activities];
    next[index] = value;
    persist(next);
  };

  const handleDelete = (index: number) => {
    const next = activities.filter((_, currentIndex) => currentIndex !== index);
    persist(next);
    toast.success("Activity removed");
  };

  if (!username) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur">
        <div className="container flex h-14 items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate(toUserPath("/", username))}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <h1 className="text-base font-semibold tracking-tight">Settings</h1>
        </div>
      </header>
      <main className="container max-w-2xl py-6">
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
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No activities yet. Add one above.
                </p>
              ) : (
                activities.map((activity, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input value={activity} onChange={(e) => handleEdit(index, e.target.value)} />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 shrink-0"
                      onClick={() => handleDelete(index)}
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
