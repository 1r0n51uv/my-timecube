export interface TimeEntry {
  id: string;
  date: string;
  activity: string;
  hours: number;
  notes: string;
}

export interface TimesheetPayload {
  entries: TimeEntry[];
}

export interface ActivitiesPayload {
  activities: string[];
}
