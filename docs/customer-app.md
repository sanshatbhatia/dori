# Dori customer app — test-mode build

This build is a working front end for investor demos. Everything runs in the browser in **test mode**.
Nothing here is a production service.

## Run it

```
npm install
npm run dev      # http://localhost:3000
npm run build    # production bundle in dist/
npm run lint     # type check
```

Sign in with any Indian mobile number (for example 98765 43210) and the test code **123456**.
Profile → Demo tools can:

- simulate a network failure
- expire the session
- record sample measurements as a stylist
- erase demo data

Each request page has demo controls that move it through the workflow.

## Structure

| Area | Files |
| --- | --- |
| App shell, routing, tab bar | `src/App.tsx`, `src/app/nav.tsx` |
| Service interface (what a real backend implements) | `src/app/services/api.ts`, `types.ts` |
| Demo data provider (test mode) | `src/app/services/devBackend.ts` |
| Business configuration (fabrics, garments, urgency, statuses) | `src/app/data/catalog.ts` |
| Session and order draft | `src/app/state/session.tsx`, `orderDraft.tsx` |
| Screens | `src/app/screens/*` |
| Existing Design Studio (now a component with entry and exit points) | `src/components/DesignStudio.tsx` |
| Studio ↔ order contract | `src/app/screens/StudioScreen.tsx` |

## The Studio ↔ order contract

The Studio opens with the order's starting design and context:

- the selections
- the latkan setting
- notes
- garment, size, occasion, fabric and height chips

It returns a `StudioResult` with the structured selections, the latkan setting, notes and an optional preview JPEG. The preview picture is never the design itself; the design is the structured selections.

- **Save** stores a draft design without creating an order.
- **Done** returns the design to the order review.
- **Back** asks the user to save or discard unsaved changes.

## What is demo-only, and what production needs

| Feature | In this build | Production needs |
| --- | --- | --- |
| Phone OTP | Fixed test code, no SMS | An SMS OTP provider (e.g. Firebase Auth, MSG91, Twilio Verify) |
| Accounts and data | Stored in this browser's localStorage | A database with per-customer authorization |
| Reference images | Downscaled and stored on the device | File storage (e.g. Firebase Storage or S3) with private access |
| Consultation availability | Generated sample slots | Real stylist calendars |
| Stylist assignment | Job runs in the browser on each request and every 30 s | **Backend scheduled job** (see below) |
| Notifications | In-app list only | Push, SMS, WhatsApp and email integrations |
| Production updates | Demo controls only (marked "Simulated") | Operations / warehouse tools writing order events |
| Pricing and payment | Not implemented (shown as "agreed with your stylist") | A pricing service and a payment gateway |
| Account deletion | Request recorded | A deletion workflow that applies the retention policy |

### Required backend job: stylist assignment

The job runs every 5 minutes. For each consultation that is scheduled and not yet assigned:

1. If the consultation starts within 2 hours (`now >= slotStart - 2h`), assign an available stylist.
   - Pick a stylist who is free at that time.
   - Record `assignedAt`.
   - Move the request to `stylist_assigned`.
   - Release the stylist's contact details to the customer.
   - Notify the customer.
2. If the consultation was booked less than 2 hours ahead, assign it on the next run.
3. If no stylist is free:
   - Mark the assignment `failed`.
   - Alert operations.
   - Tell the customer that a stylist is being reassigned.
   - Retry on the next run.
4. On reschedule, re-evaluate. An existing assignment is kept unless that stylist is no longer free.

The browser version of this job is `runAssignmentJob` in `devBackend.ts`. It shows the rule, but it only runs while the app is open, so it is not a substitute for the backend job.

## Rules the app follows

- A consultation request is not an order. Production starts only at `order_confirmed`.
- Delivery dates, prices and urgency feasibility are shown only once the business confirms them.
- If the requested turnaround is not feasible, the customer is told before the order is confirmed.
- Measurements can be recorded only by a stylist or admin. The service rejects customer edits; the UI does not rely on a disabled field.
- Each record is returned only to its owner. No private data goes in the URL.
- Every order draft has its own idempotency key, so a repeated submission returns the request already created.
