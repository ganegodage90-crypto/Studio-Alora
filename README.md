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
