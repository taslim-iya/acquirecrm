

# Send Emails Through Your Connected Gmail/Microsoft Account

## What This Changes

Currently, your app sends emails through **Resend** (a third-party email service) from `taslim@mungerlongview.com`. This update will instead send emails **directly through your connected Gmail or Microsoft account**, so:

- Emails appear in your actual **Sent folder**
- Recipients see your real email address as the sender
- Better deliverability and trust
- Resend remains as a **fallback** if no provider is connected

## What You Need To Do

After this update, you will need to **reconnect your Google and/or Microsoft account** in Settings, because the app currently only has "read" permission for your email. It will need "send" permission too. This is a one-time step — just click disconnect and reconnect in Settings.

---

## Technical Details

### 1. Update Google OAuth Scopes

**File:** `supabase/functions/google-oauth-init/index.ts`

Add `https://www.googleapis.com/auth/gmail.send` to the requested scopes so the app can send emails on your behalf via Gmail.

### 2. Update Microsoft OAuth Scopes

**File:** `supabase/functions/microsoft-oauth-init/index.ts`

Add `Mail.Send` to the requested scopes for Microsoft Graph API sending.

### 3. Rewrite the Send Email Function

**File:** `supabase/functions/send-email/index.ts`

The function will be updated to:

1. Check if the user has an active **Google** integration -- if so, use the Gmail API (`POST https://gmail.googleapis.com/gmail/v1/users/me/messages/send`) to send the email as a properly formatted RFC 2822 message with base64url encoding.

2. If no Google integration, check for an active **Microsoft** integration -- if so, use the Microsoft Graph API (`POST https://graph.microsoft.com/v1.0/me/sendMail`) to send.

3. If **neither** provider is connected, fall back to **Resend** (current behavior), so email sending never breaks.

4. Token refresh logic (already proven in the sync functions) will be reused to handle expired OAuth tokens.

5. Attachment support will be preserved for all three paths (Gmail, Microsoft, Resend).

6. The email record saved to the database will reflect which provider was used (`external_provider: 'google' | 'microsoft' | 'resend'`).

### 4. No Database Changes Needed

The existing `emails` table already has `external_provider` and `external_id` columns that will store the provider used and the message ID returned by Gmail/Microsoft.

### 5. Files Modified

| File | Change |
|------|--------|
| `supabase/functions/google-oauth-init/index.ts` | Add `gmail.send` scope |
| `supabase/functions/microsoft-oauth-init/index.ts` | Add `Mail.Send` scope |
| `supabase/functions/send-email/index.ts` | Rewrite to try Gmail API, then Microsoft Graph, then Resend fallback |

