
# Smart Follow-Up Reminders + Tasks Page

## Overview
Add two features: (1) a **notification bell** in the top bar showing overdue tasks and stale contacts/investors needing follow-up, and (2) a **dedicated Tasks page** for full task management with filtering, recurring reminders, and contact/investor linking.

---

## Feature 1: Notification Bell

A bell icon added to the `MainLayout` header (top-right area) that shows a count badge of actionable items:
- **Overdue tasks** (due date has passed, not completed)
- **Stale contacts** (contacts with `last_interaction_at` older than 7 days, or null)
- **Investors needing follow-up** (investors in active stages like `outreach_sent` or `follow_up` with no recent activity)

Clicking the bell opens a dropdown/popover listing these items grouped by type, with quick actions (mark complete, snooze, navigate to contact/investor).

### Components
- `NotificationBell.tsx` - Bell icon + badge + dropdown popover
- `useNotifications.ts` - Hook combining overdue tasks, stale contacts, and stale investors into a unified notification list

---

## Feature 2: Dedicated Tasks Page

A full `/tasks` route with:
- **Tabs**: All, Today, Upcoming, Overdue, Completed
- **Task creation** with full fields: title, description, priority, due date, linked contact/investor/company, recurring option
- **Filters**: By priority, by linked entity, by status
- **Bulk actions**: Mark complete, delete
- **Recurring tasks**: A `recurrence` field (none, daily, weekly, monthly) that auto-creates the next task when one is completed

### Database Changes
Add columns to the `tasks` table:
- `description` (text, nullable) - task notes/details
- `recurrence` (text, nullable, default null) - values: `daily`, `weekly`, `monthly`, or null
- `investor_deal_id` (uuid, nullable) - link task to an investor

### New Files
- `src/pages/Tasks.tsx` - Full tasks page with tabs and filters
- `src/components/tasks/TaskFormModal.tsx` - Create/edit task modal with all fields
- `src/components/tasks/TaskRow.tsx` - Individual task row component
- `src/components/tasks/DeleteTaskDialog.tsx` - Confirmation dialog
- `src/components/layout/NotificationBell.tsx` - Bell dropdown component
- `src/hooks/useNotifications.ts` - Unified notifications hook

### Modified Files
- `src/components/layout/MainLayout.tsx` - Add NotificationBell to header
- `src/components/layout/Sidebar.tsx` - Add Tasks nav item
- `src/App.tsx` - Add `/tasks` route
- `src/hooks/useTasks.ts` - Update types for new columns

---

## Technical Details

### Database Migration
```sql
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS recurrence text,
  ADD COLUMN IF NOT EXISTS investor_deal_id uuid;
```

### Notification Logic (useNotifications hook)
```text
1. Query tasks where due_date < today AND completed = false
2. Query contacts where last_interaction_at < (now - 7 days) OR null
3. Query investor_deals in active stages with updated_at < (now - 5 days)
4. Merge into a single sorted list by urgency
```

### Sidebar Addition
Add a "Tasks" item with `CheckSquare` icon between "Calendar" and "Cap Table" in the navigation array.

### Recurring Task Flow
When a task with `recurrence` is marked complete, the `useToggleTaskComplete` mutation will also create a new task with the next due date calculated from the recurrence interval.
