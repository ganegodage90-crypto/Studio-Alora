# Studio Alora — studioalora.online

React + Vite + Tailwind site for Studio Alora, deployed on Vercel.

| Path | Page |
| --- | --- |
| `/` | Check-in and session timer (the original app) |
| `/book` | Booking request, sent over WhatsApp |
| `/calculator` | Price calculator |
| `/gallery` | Photos |
| `/equipment` | Equipment and facilities |
| `/rules` | Studio rules, rental terms, contact |
| `/packages` | Monthly packages and request form |
| `/collab` | Collaboration conditions and application |

- Rates, phone numbers and links live in `src/lib/site.ts`. Change them there only.
- Photos are in `public/images`.
- `firestore.rules` includes a `requests` rule for saving booking and collab requests. Deploy it with `firebase deploy --only firestore:rules`.

```
npm install
npm run dev
```

Pushing to `main` deploys to production on Vercel. Other branches get a preview URL.

- Staff PIN: set `STAFF_PIN` in Vercel → Settings → Environment Variables (Production and Preview). It is checked by `api/verify-pin.js` and is never sent to the browser.

## Monthly package tracker

- `/my-hours`: customers enter their phone number to see hours bought, used and left.
- `/staff`: staff (PIN) create packages, adjust used hours and delete packages.
- At the end of a check-in session, a phone number with an active package gets a "Use Package Hours" button.
- Data lives in an Upstash Redis database connected to the Vercel project (Storage tab). The functions in `api/` read `KV_REST_API_URL` and `KV_REST_API_TOKEN` (or `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`), which the integration adds automatically.
