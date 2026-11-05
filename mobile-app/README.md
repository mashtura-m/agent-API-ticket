# Helpdesk Mobile — prototype

A mobile-first support console prototype: one inbox for human and AI chats,
bulk actions, a human-review queue for AI drafts, tickets, and contacts.
Vanilla HTML/CSS/JS, no build step, all data mocked in memory.

## Run

Any static server works, from the repo root:

```bash
npx serve mobile-app        # or
python3 -m http.server 5173 --directory mobile-app
```

Open `http://localhost:5173`. On a phone the app fills the screen; on desktop it
renders inside a phone-sized frame. Use the **Admin / Agent** switch at the top
right to see the permission differences.

## What's in it

| Area | Features |
| --- | --- |
| Inbox | Open / Mine / Unassigned / Snoozed / Closed filters, search, priority and AI chips, unread counts |
| Bulk actions | Long-press a chat (or tap **Select**), then Reply, Assign, Snooze or Close several at once |
| Chat | Text, photos, documents, voice notes (record/send), voice call overlay, snooze, close/reopen, take over from AI |
| AI assistant | Quick-reply buttons, product carousels, live bot chat by vertical (e-commerce, BFSI, business) |
| Human review | Financial or sensitive AI drafts are held. Approve, edit, or reject before the visitor sees them |
| Visitor info | Labels (add/remove), contact details, linked tickets, quick Chat / Email / Ticket actions |
| Tickets | Status and assignee changes, create from a chat or from the Tickets tab |
| Contacts | Searchable, alphabetised list; add contacts |
| AI rules | Admin-only toggles for bot behaviour; agents see them read-only |

## Roles

| Action | Admin | Agent |
| --- | --- | --- |
| Reply, snooze, close, take over, create tickets | ✅ | ✅ |
| Assign chats or tickets to self | ✅ | ✅ |
| Assign chats or tickets to other agents | ✅ | 🔒 |
| Create new labels (existing labels are allowed) | ✅ | 🔒 |
| Delete contacts and tickets | ✅ | 🔒 |
| Change AI rules | ✅ | 🔒 |

Locked controls stay visible and explain why when tapped.

## Design

- **Type:** Inter for UI, Fraunces for headings (loaded from Google Fonts).
- **Palette:** warm cream base, black ink, burnt orange for human/agent actions,
  plum purple reserved for AI hints (AI messages, drafts, review states).
- **Layout:** 44px minimum touch targets, 16px side gutters, reduced-motion support,
  visible focus rings, and `aria` labels on icon-only buttons.

## Files

- `index.html`: shell and font links
- `styles.css`: design tokens (`:root`, dark mode via `prefers-color-scheme`) and components
- `app.js`: mock data, bot simulator, state, rendering and actions

## Next steps

- Replace the in-memory data with the existing Express API (`server.js` already
  has customer and ticket endpoints). Swap the `CONVS` / `TICKETS` / `CONTACTS`
  arrays for fetch calls.
- Real-time delivery over WebSocket or SSE for new messages and review-queue updates.
- Channel adapters for WhatsApp, Messenger and web chat.
- Auth and per-tenant role management; today the role switch is a demo control.
