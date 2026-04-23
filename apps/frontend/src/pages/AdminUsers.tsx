import { useMemo, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Plus, Shield, Trash2, UserPlus } from "lucide-react";
import { useAppConfigQuery, useAdminUsersQuery, useCreateUserMutation, useDeleteUserMutation } from "@/api/hooks";
import { isAdminUser, useCurrentUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function AdminUsers() {
  const currentUser = useCurrentUser();
  const configQuery = useAppConfigQuery();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (configQuery.data && !isAdminUser(currentUser, configQuery.data.adminUsers)) {
    return <Navigate to="/" replace />;
  }

  return <AdminUsersPage currentUser={currentUser} />;
}

function AdminUsersPage({ currentUser }: { currentUser: string }) {
  const navigate = useNavigate();
  const usersQuery = useAdminUsersQuery(true);
  const createUser = useCreateUserMutation();
  const deleteUser = useDeleteUserMutation();
  const [username, setUsername] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  const users = useMemo(() => usersQuery.data?.users ?? [], [usersQuery.data]);

  const handleCreate = async () => {
    const value = username.trim();
    if (!value) {
      return;
    }

    try {
      await createUser.mutateAsync({
        username: value,
        isAdmin,
      });
      setUsername("");
      setIsAdmin(false);
      toast.success("User created");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create user");
    }
  };

  const handleDelete = async (targetUsername: string) => {
    if (targetUsername === currentUser) {
      toast.error("You cannot remove the current signed-in admin");
      return;
    }

    if (!window.confirm(`Remove user ${targetUsername}? This also deletes their activities and time entries.`)) {
      return;
    }

    try {
      await deleteUser.mutateAsync(targetUsername);
      toast.success("User removed");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to remove user");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur">
        <div className="container flex h-14 items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/admin")}>
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <h1 className="text-base font-semibold tracking-tight">User Management</h1>
          </div>
          <Badge variant="secondary">{currentUser}</Badge>
        </div>
      </header>

      <main className="container max-w-4xl py-6 space-y-6">
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertTitle>Admin-only area</AlertTitle>
          <AlertDescription>
            Add or remove users here. Removing a user also removes their saved timesheets and activities.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle>Add user</CardTitle>
            <CardDescription>Create a new account available on the login page.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="new.username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    void handleCreate();
                  }
                }}
              />
              <Button onClick={() => void handleCreate()} disabled={createUser.isPending}>
                <UserPlus className="h-4 w-4" />
                Add
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="is-admin"
                checked={isAdmin}
                onCheckedChange={(checked) => setIsAdmin(checked === true)}
              />
              <Label htmlFor="is-admin">Create as admin</Label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Existing users</CardTitle>
              <CardDescription>These users can sign in and manage timesheets.</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link to="/admin">
                <Plus className="h-4 w-4" />
                Go to admin panel
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {users.length === 0 ? (
              <p className="text-sm text-muted-foreground">No users found.</p>
            ) : (
              users.map((user) => (
                <div
                  key={user.username}
                  className="flex items-center justify-between rounded-md border px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <div>
                      <div className="font-medium">{user.username}</div>
                      <div className="text-sm text-muted-foreground">
                        {user.username === currentUser ? "Current session" : "Standard account"}
                      </div>
                    </div>
                    {user.isAdmin ? <Badge>Admin</Badge> : <Badge variant="secondary">User</Badge>}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => void handleDelete(user.username)}
                    disabled={deleteUser.isPending || user.username === currentUser}
                  >
                    <Trash2 className="h-4 w-4" />
                    Remove
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
