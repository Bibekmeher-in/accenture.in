# Analytics Architecture

This project uses a privacy-safe, real-time analytics system built on top of the local MongoDB database.

## 1. Tracking Principles & Privacy
- **Consent-first**: Analytics identifiers and events are ONLY generated and sent if `localStorage.getItem("cookie_consent")` equals `"accepted"`.
- **Anonymity**: Visitor IDs are randomly generated UUIDs stored in `localStorage`. Session IDs are randomly generated UUIDs stored in `sessionStorage`. No emails, PII, passwords, or internal DB IDs are tracked.
- **Admin Exclusion**: Analytics are fully disabled for any paths matching `/admin/*` or `/api/admin/*`, and the server completely ignores events if an admin session cookie is detected.

## 2. Event Types
The system strictly allows only the following event types:
- `page_view`
- `session_start`
- `session_end`
- `form_start`
- `form_success`
- `form_error`
- `cta_click`
- `outbound_link`
- `404_error`

## 3. Database Schema
- **`analyticsEvents`**: Raw event streams. Retained for 90 days via MongoDB TTL index (`expireAfterSeconds`).
- **`analyticsSessions`**: Active visitor sessions aggregated dynamically. Retained for 90 days via MongoDB TTL index.

## 4. Real-time Dashboard
- Data is streamed to the `/admin/analytics` dashboard via **Server-Sent Events (SSE)** from `/api/admin/analytics/live`.
- The dashboard receives push updates every 10 seconds.
- "Active Visitors" represent distinct `visitorId` values from sessions whose `lastActiveAt` timestamp is within the last 5 minutes.

## 5. Security Controls
- **Payload Validation**: `zod` ensures only valid string primitives (and limited metadata length) are accepted.
- **Rate Limiting**: IP-based rate limiting restricts clients to 100 events per minute.
- **Graceful Degradation**: Failed analytics calls (`POST /api/analytics/events`) fail silently in the background, never crashing the public application.
