# Support Feature Implementation Plan

## Overview
Add a full customer support system: in-app ticket submission with history, public contact page, email notifications via Resend, and navigation links throughout the app.

---

## Implementation Order

### Step 1: Database & Types
- **SQL migration** for `support_tickets` table with RLS (`user_id = auth.uid()`)
- **Modify `src/types/database.ts`** — add `TicketCategory`, `TicketUrgency`, `TicketStatus` union types and `SupportTicket` interface

### Step 2: UI Utilities
- **Modify `src/lib/ui-utils.ts`** — add `ticketStatusBadge()` and `ticketUrgencyColor()` helpers

### Step 3: API Routes
- **Create `src/app/api/support/tickets/route.ts`** — authenticated GET (list user's tickets) + POST (create ticket, send confirmation + alert emails via Resend)
- **Create `src/app/api/contact/route.ts`** — unauthenticated POST (send alert email to support@captivly.ai)

### Step 4: Dashboard Support Page
- **Create `src/app/(dashboard)/support/page.tsx`** — server component: auth check, fetch tickets, render page header + form + tickets table with status badges
- **Create `src/app/(dashboard)/support/submit-ticket-form.tsx`** — client component: subject, category dropdown, message textarea, urgency dropdown, loading/error/success states, calls `router.refresh()` on success

### Step 5: Public Contact Page
- **Create `src/app/contact/page.tsx`** — public page with MarketingHeader + MarketingFooter
- **Create `src/app/contact/contact-form.tsx`** — client component: name, email, message fields, POSTs to `/api/contact`, shows thank-you on success

### Step 6: Navigation Updates
- **Modify `src/app/(dashboard)/sidebar-nav.tsx`** — add `{ href: "/support", label: "Support" }` after Help Guide
- **Modify `src/components/marketing-footer.tsx`** — add "Contact Us" link pointing to `/contact`
- **Modify `src/app/(dashboard)/help-guide/page.tsx`** — replace bottom email fallback with link to `/support`
- **Modify `src/app/(dashboard)/settings/page.tsx`** — add Support section with links to `/support` and `/help-guide`

---

## Files to Create (6)
1. `src/app/api/support/tickets/route.ts`
2. `src/app/api/contact/route.ts`
3. `src/app/(dashboard)/support/page.tsx`
4. `src/app/(dashboard)/support/submit-ticket-form.tsx`
5. `src/app/contact/page.tsx`
6. `src/app/contact/contact-form.tsx`

## Files to Modify (6)
1. `src/types/database.ts`
2. `src/lib/ui-utils.ts`
3. `src/app/(dashboard)/sidebar-nav.tsx`
4. `src/components/marketing-footer.tsx`
5. `src/app/(dashboard)/help-guide/page.tsx`
6. `src/app/(dashboard)/settings/page.tsx`

## Database Migration (1)
- `support_tickets` table + RLS policy

## Key Design Decisions
- Categories: billing, technical, meta_integration, sequences, general
- Urgency: low, normal (default), high
- Status: open (default), in_progress, resolved, closed
- Public `/contact` sends email only (no DB write) to avoid unauthenticated table access
- Email notifications are fire-and-forget (non-blocking, logged on error)
- Follows existing patterns: deals API for auth, invite-member for client forms, help-guide for page layout
