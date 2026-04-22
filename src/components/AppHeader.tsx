import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogOut, Clock, Settings as SettingsIcon } from "lucide-react";
import { Link } from "react-router-dom";

interface Props {
  username: string;
  saveStatus: "idle" | "saving" | "saved";
  onLogout: () => void;
}

export function AppHeader({ username, saveStatus, onLogout }: Props) {
  return (
    <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur">
      <div className="container flex h-14 items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          <h1 className="text-base font-semibold tracking-tight">Agile Time Tracker</h1>
          {saveStatus === "saving" && (
            <span className="ml-2 text-xs text-muted-foreground">Saving…</span>
          )}
          {saveStatus === "saved" && (
            <span className="ml-2 text-xs text-muted-foreground">Saved ✓</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="secondary">{username}</Badge>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/settings">
              <SettingsIcon className="h-4 w-4" />
              Settings
            </Link>
          </Button>
          <Button variant="ghost" size="sm" onClick={onLogout}>
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}