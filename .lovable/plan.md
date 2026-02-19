
# Email Sending with Resend

## Overview

Use **Resend** for sending emails from DealScope. This is simpler than the Gmail API approach -- no OAuth scope changes needed. Gmail sync continues handling incoming email.

## What You'll Need

- A **Resend API key** (free tier: 100 emails/day, 3,000/month)
- A **verified sending domain** or use Resend's default `onboarding@resend.dev` for testing
- You can sign up at resend.com and get an API key from the dashboard

## What Will Be Built

### 1. Send Email Backend Function
A new backend function (`send-email`) that:
- Accepts `to`, `subject`, `body`, and optional `reply_to`
- Sends via Resend's API
- Saves a copy to the `emails` table as an outbound email

### 2. Inbox Page
A new `/inbox` route with:
- List of all emails (sent and received) in chronological order
- Email detail view when clicking an email
- Compose button to write new emails
- Sync button to pull latest from Gmail

### 3. Compose Email Modal
A compose form with:
- To, Subject, Body fields
- Template picker (uses existing saved templates)
- Send button

### 4. Database Update
Add a `direction` column to the `emails` table to distinguish sent vs received emails.

### 5. Navigation Update
Add "Inbox" to the sidebar with an unread badge.

---

## Implementation Steps

### Step 1: Store Resend API Key
Securely store your Resend API key as a backend secret.

### Step 2: Database Migration
Add `direction` column to `emails` table:
```sql
ALTER TABLE emails ADD COLUMN direction text NOT NULL DEFAULT 'inbound';
```

### Step 3: Create `send-email` Backend Function
New file: `supabase/functions/send-email/index.ts`
- Calls Resend API (`POST https://api.resend.com/emails`)
- Uses stored API key
- Saves sent email to database with `direction = 'outbound'`
- Returns success/failure

### Step 4: Create Compose Email Modal
New file: `src/components/email/ComposeEmailModal.tsx`
- To, Subject, Body fields
- Template dropdown to auto-fill from saved templates
- Send button calling the backend function

### Step 5: Create Send Email Hook
New file: `src/hooks/useSendEmail.ts`
- Mutation hook wrapping the backend function call
- Invalidates email queries on success

### Step 6: Create Inbox Page
New file: `src/pages/Inbox.tsx`
- Split layout: email list on left, detail on right
- Shows both inbound and outbound emails
- Compose button opens the modal
- Sync button triggers Gmail sync
- Unread indicators

### Step 7: Update Navigation
- Add "Inbox" entry to `Sidebar.tsx` with unread badge
- Add `/inbox` route to `App.tsx`

---

## Files to Create
- `supabase/functions/send-email/index.ts` -- Backend function for sending via Resend
- `src/pages/Inbox.tsx` -- Inbox page
- `src/components/email/ComposeEmailModal.tsx` -- Compose modal
- `src/hooks/useSendEmail.ts` -- Send email hook

## Files to Modify
- `src/App.tsx` -- Add `/inbox` route
- `src/components/layout/Sidebar.tsx` -- Add Inbox nav item
- `supabase/config.toml` -- Add send-email function config

## Database Changes
- Add `direction` column to `emails` table

## Secret Required
- `RESEND_API_KEY` -- Your Resend API key from resend.com/api-keys

---

## Resend Send Flow

```text
User composes email in Inbox
        |
        v
Frontend calls send-email backend function
        |
        v
Backend reads RESEND_API_KEY secret
        |
        v
POST to https://api.resend.com/emails
  { from, to, subject, html }
        |
        v
Save to emails table (direction = 'outbound')
        |
        v
Return success to frontend
```

## Important Notes

- **Sending domain**: By default you can send from `onboarding@resend.dev` for testing. For production, you'll need to verify your own domain in Resend's dashboard.
- **Free tier**: 100 emails/day, 3,000/month -- plenty for investor outreach.
- **Receiving**: Gmail sync continues working as-is for incoming emails.
