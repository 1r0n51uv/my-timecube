
# Agile Team Time Tracker

A multi-user time tracking app with month-by-month timesheets, half-day reporting, and per-user isolated localStorage persistence.

## Auth
- **Login page** (`/login`): username-only form (react-hook-form + Zod). Validates against hardcoded list of 5 users (mario.rossi, giulia.bianchi, luca.verdi, anna.neri, marco.esposito). Min 1 char, must be in allowlist.
- On submit → store username in `localStorage.currentUser` → redirect to `/`.
- **Header bar** (always visible when logged in): app title, current username badge, Logout button (clears `currentUser`, redirects to login).
- **Route guard**: `/` and all app routes redirect to `/login` if no current user.

## Layout & Navigation
- **Header**: app name left, user badge + logout right.
- **Month tabs**: horizontal tabs for Jan→Dec of current year, current month preselected. Each tab loads/saves its own timesheet.
- Responsive: tabs scroll horizontally on mobile; summary stacks under table on mobile, sits beside it on desktop (lg+).

## Timesheet Table (per month)
- shadcn `Table` with sticky header. Columns: **Date** (read-only, formatted "Mar 1 – Monday"), **Activity** (Select with 10 hardcoded options), **Hours** (number input, step 0.5, min 0, max 24), **Notes** (text input), **Delete** (trash icon).
- Rows are grouped/sorted by date. Every calendar day of the month appears at least once (empty placeholder row if no entry).
- Per-day **"+ Add entry"** button appended after each day's last row to add another row for the same date.
- **Weekend rows** (Sat/Sun): muted background + dimmed text, still fully editable.
- **Inline editing**: changes commit immediately to state and auto-persist to localStorage.
- Zod validation per row: activity required, hours > 0 (validated when computing summaries / on blur — invalid rows highlighted but still saved as draft).
- **Unsaved changes indicator**: small "Saving…" / "Saved ✓" pill in header, plus shadcn Toast on save/delete events.

## Summary Panel
Card beside (desktop) or below (mobile) the table.

### 1. Monthly Total
- Total hours summed across all month entries.
- Working-days conversion: `total / 8`, formatted e.g. **"88h → 11g"**.

### 2. Period Report (Half-day breakdown)
- Two shadcn DatePickers: **From** / **To**, constrained to the selected month.
- On range selection, compute per-activity breakdown using exact rules:
  - Group entries by (date, activity) within range, summing hours per group.
  - Per group: if hours ≥ 8 → `1g`; elif hours ≥ 4 → `0.5g`; else → raw `Xh`.
  - Aggregate per activity: sum half-day counts separately from leftover raw hours.
- Output as shadcn Table: **Activity | Half-days | Raw hours** matching spec example.

## Data Model & Persistence
- Storage key: `timetracking__{username}__{year}__{month}` (month 1-12, zero-padded).
- Value: `[{ id, date: "YYYY-MM-DD", activity, hours, notes }]`.
- Auto-save on every change (debounced ~300ms). Toast on explicit delete.
- Per-user isolation enforced via username in key — switching users shows independent data.

## Components & Files
- `src/pages/Login.tsx` — login form
- `src/pages/Index.tsx` — main app shell (header + month tabs + active month view)
- `src/components/AppHeader.tsx`
- `src/components/MonthTabs.tsx`
- `src/components/TimesheetTable.tsx`
- `src/components/SummaryPanel.tsx`
- `src/components/PeriodReport.tsx`
- `src/lib/auth.ts` — current user helpers + allowed users constant
- `src/lib/storage.ts` — load/save entries by user/year/month
- `src/lib/timesheet.ts` — date helpers, half-day calc, totals
- `src/lib/constants.ts` — ALLOWED_USERS, ACTIVITIES
- Routes added in `App.tsx`: `/login`, `/` (guarded)

## UX Polish
- shadcn Toast (sonner) for save/delete confirmations.
- Empty-state hint when a day has no entries.
- Keyboard-friendly inputs; trash icon from lucide-react.
- Clean minimal styling using existing design tokens.
