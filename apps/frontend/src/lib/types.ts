export interface TimeEntry {
  id: string;
  date: string;
  activity: string;
  hours: number;
  notes: string;
}

export interface AppConfig {
  allowedUsers: string[];
  adminUsers: string[];
  defaultActivities: string[];
}
