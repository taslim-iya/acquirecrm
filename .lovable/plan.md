

# Google OAuth Integration Plan

## Overview
This plan implements a complete Google OAuth flow that will allow users to connect their Gmail and Google Calendar accounts. Once connected, the app will sync emails and calendar events automatically.

## Prerequisites (Action Required)

Before implementation, you'll need to set up Google Cloud credentials:

1. **Go to** [Google Cloud Console](https://console.cloud.google.com)
2. **Create a new project** (or select existing)
3. **Enable APIs**: Gmail API and Google Calendar API
4. **Configure OAuth Consent Screen**:
   - Add authorized domains including `lovable.app`
   - Add scopes: `email`, `profile`, `gmail.readonly`, `calendar.readonly`
5. **Create OAuth Credentials**:
   - Application type: Web application
   - Authorized redirect URI: `https://ygreplqxqazgxkudonso.supabase.co/functions/v1/google-oauth-callback`
6. **Save your Client ID and Client Secret**

---

## Implementation Steps

### Step 1: Add Required Secrets

I'll prompt you to add two secrets via a secure form:
- `GOOGLE_CLIENT_ID` - Your OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Your OAuth client secret

### Step 2: Create OAuth Initiation Edge Function

**File**: `supabase/functions/google-oauth-init/index.ts`

This function generates the Google OAuth URL and redirects users to Google's consent screen. It will:
- Build the OAuth URL with required scopes (Gmail read, Calendar read)
- Include a state parameter containing the user's ID for security
- Redirect to Google's authorization endpoint

### Step 3: Create OAuth Callback Edge Function

**File**: `supabase/functions/google-oauth-callback/index.ts`

This function handles the callback from Google after user consent. It will:
- Exchange the authorization code for access/refresh tokens
- Fetch the user's Google email address
- Store tokens securely in the `user_integrations` table
- Redirect back to the Settings page with success/error status

### Step 4: Create Email Sync Edge Function

**File**: `supabase/functions/sync-google-emails/index.ts`

This function fetches recent emails from Gmail and stores them. It will:
- Retrieve stored access token (refresh if expired)
- Call Gmail API to fetch recent messages
- Parse email metadata (subject, from, date, preview)
- Upsert into the `emails` table with `external_id` to prevent duplicates

### Step 5: Create Calendar Sync Edge Function

**File**: `supabase/functions/sync-google-calendar/index.ts`

This function fetches calendar events from Google Calendar. It will:
- Retrieve stored access token (refresh if expired)
- Call Calendar API for upcoming events
- Parse event details (title, time, location, attendees)
- Upsert into the `calendar_events` table with `external_id`

### Step 6: Update Frontend Settings Page

**File**: `src/pages/Settings.tsx`

Modify the "Connect" button to:
- Call the OAuth initiation edge function
- Open the OAuth flow in the current window
- Handle success/error query parameters on return
- Show toast notifications for connection status

### Step 7: Create Manual Sync Hook

**File**: `src/hooks/useSyncIntegration.ts`

A hook that triggers manual sync for connected integrations:
- Calls the sync edge functions
- Shows loading state during sync
- Displays success/error feedback

---

## Technical Details

### OAuth Scopes Requested
```text
https://www.googleapis.com/auth/gmail.readonly
https://www.googleapis.com/auth/calendar.readonly
https://www.googleapis.com/auth/userinfo.email
https://www.googleapis.com/auth/userinfo.profile
```

### Token Storage
Tokens will be encrypted and stored in the existing `user_integrations` table:
- `access_token`: Short-lived API access
- `refresh_token`: Long-lived token for renewal
- `token_expires_at`: Expiration timestamp
- `scope`: Granted permissions
- `email`: Connected Google account email

### Edge Function Configuration
Each function will have `verify_jwt = false` in config.toml with manual authentication validation where needed.

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `supabase/functions/google-oauth-init/index.ts` | Create | OAuth flow initiation |
| `supabase/functions/google-oauth-callback/index.ts` | Create | Token exchange handler |
| `supabase/functions/sync-google-emails/index.ts` | Create | Gmail sync logic |
| `supabase/functions/sync-google-calendar/index.ts` | Create | Calendar sync logic |
| `supabase/config.toml` | Modify | Add function JWT settings |
| `src/pages/Settings.tsx` | Modify | Connect button integration |
| `src/hooks/useSyncIntegration.ts` | Create | Manual sync trigger |

---

## Security Considerations

- Tokens stored server-side only (never exposed to frontend)
- State parameter prevents CSRF attacks
- RLS policies ensure users only access their own integrations
- Refresh tokens allow long-term access without re-authentication

