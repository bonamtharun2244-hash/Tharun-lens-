# Prakruthi Boys & Girls Hostel – Booking Website

PG hostel website for **Prakruthi Boys & Girls Hostel**, Vasavi Nagar (near Honda showroom), Puttur, Andhra Pradesh.

**Stack:** React + Vite + JavaScript · Supabase (Postgres, Auth, Storage, RLS) · Netlify (static hosting + Functions) · Razorpay (test mode first)

> **Status:** This is a complete project scaffold. Features are marked as working only after you test them on your own Supabase/Netlify/Razorpay accounts (see *Testing checklist*). Nothing here has been tested against live accounts.

---

## 1. What you need from the owner (not included in this code)

| Item | Where it goes |
|---|---|
| Supabase project URL + anon key | Netlify env vars (`VITE_SUPABASE_*`) |
| Supabase service-role key | Netlify env vars only (`SUPABASE_SERVICE_ROLE_KEY`). **Never commit.** |
| Owner email + strong password | Created in Supabase Auth (step 3.3) |
| Razorpay **test** key id & secret | Netlify env vars (`RAZORPAY_*`). Live keys only after approval. |
| Razorpay webhook secret | Netlify env var (`RAZORPAY_WEBHOOK_SECRET`) |
| Real room photos | Uploaded from the admin dashboard |
| Confirmed room prices, deposits, bed counts | Entered in the admin dashboard |
| Facilities, meal timings, weekly menu | Entered in the admin dashboard (only what is confirmed) |
| Payment-provider approval | Required before switching Razorpay to live mode |

Until the owner supplies real data, the site shows only what is in the database. Seed rows are **unpublished** and labelled SAMPLE.

---

## 2. Project structure

```
prakruthi-hostel/
├── netlify.toml              Build, SPA routing, security headers
├── package.json              Scripts: dev, build (npm run build), preview
├── .env.example              Variable NAMES only
├── index.html
├── public/                   Favicon, placeholder image (SAMPLE)
├── src/
│   ├── App.jsx, main.jsx     Routes
│   ├── components/Layout.jsx Header, footer, floating WhatsApp button
│   ├── pages/                Home, Rooms, Facilities, Food, Booking, Location, Contact, Pay, NotFound
│   ├── pages/admin/          Owner login + dashboard (rooms, enquiries, bookings, menu, settings)
│   ├── lib/                  Supabase client (anon key only), data access, WhatsApp links, formatting
│   └── data/sample.js        SAMPLE data used only when Supabase is not configured
├── netlify/
│   ├── functions/            enquiry, contact, create-order, verify-payment, razorpay-webhook
│   └── lib/                  Server-only helpers: service-role client, validation, Razorpay, signature checks
└── supabase/
    ├── migrations/001_schema.sql        Tables, helper function, storage bucket
    ├── migrations/002_rls.sql           Row Level Security policies
    ├── migrations/003_contact_messages.sql
    ├── create_owner.sql                 Template: grants the owner role (you fill in the user id)
    └── seed.sql                         Optional unpublished starter rows and settings placeholders
```

---

## 3. Supabase setup (about 15 minutes)

### 3.1 Create the project
1. Go to <https://supabase.com>, create a project (region: closest to India, e.g. Mumbai if offered).
2. Save the database password in a password manager. Do not put it in the code.

### 3.2 Run the migrations (in order)
In **SQL Editor → New query**, paste and run each file, in this order:
1. `supabase/migrations/001_schema.sql`
2. `supabase/migrations/002_rls.sql`
3. `supabase/migrations/003_contact_messages.sql`
4. (Optional) `supabase/seed.sql`

### 3.3 Create the owner account (owner-only access)
1. **Authentication → Providers → Email**: keep email enabled.
2. **Authentication → Sign In / Providers → Allow new users to sign up**: turn this **OFF**. This stops strangers creating accounts.
3. **Authentication → Users → Add user → Create new user**: enter the owner's email and a strong password (12+ characters, unique). Tick *Auto Confirm User*.
4. Copy the new user's **UUID** from the users list.
5. Open `supabase/create_owner.sql`, replace `REPLACE-WITH-OWNER-UUID`, and run it in SQL Editor. Only one owner should exist.

Only users listed in `admin_users` can read or change data. Nobody can add themselves through the website. There are no hardcoded passwords anywhere in the code.

### 3.4 Get the keys
**Project Settings → API**:
- **Project URL** → `VITE_SUPABASE_URL` and `SUPABASE_URL`
- **anon public key** → `VITE_SUPABASE_ANON_KEY` (safe in the browser, because RLS limits it)
- **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` (**server only**. Never prefix with `VITE_`. Never commit.)

---

## 4. Razorpay setup (test mode first)

1. Sign in to the Razorpay Dashboard and switch to **Test Mode**.
2. **Account & Settings → API Keys → Generate Test Key**. Copy the Key ID and Key Secret.
3. **Webhooks → Add New Webhook** (test mode):
   - URL: `https://<your-site>.netlify.app/.netlify/functions/razorpay-webhook`
   - Events: `payment.captured`, `payment.failed`
   - Secret: create a long random string and save it as `RAZORPAY_WEBHOOK_SECRET`.
4. Test cards and UPI test IDs are in Razorpay's test-mode documentation. Use only test instruments in test mode.
5. Switching to **live mode** requires Razorpay account activation and the owner's approval. Do this only after the full testing checklist passes.

The website never stores card numbers, CVV or UPI PINs. Payments are verified server-side. The browser redirect alone never marks a booking as paid.

---

## 5. Local development

Requires **Node.js 20+**.

```bash
npm install
cp .env.example .env         # then fill in the values
npm run dev                  # website at http://localhost:5173
```

To test Netlify Functions locally (enquiry form, payments):

```bash
npm install -g netlify-cli
netlify dev                  # serves the site and functions together, usually at http://localhost:8888
```

Without `VITE_SUPABASE_URL`, the site shows clearly labelled SAMPLE data and the admin area reports that Supabase is not configured.

---

## 6. Deploy to Netlify

1. Push this project to a **private** GitHub repository (see section 8 for Android steps).
2. Netlify → **Add new site → Import an existing project → GitHub** → select the repo.
3. Build settings are read from `netlify.toml`: build command `npm run build`, publish directory `dist`, functions `netlify/functions`.
4. **Site configuration → Environment variables**: add every variable from `.env.example` that has a value (server-only ones included). Do **not** commit `.env`.
5. Trigger a deploy. Check the **Deploys** log for errors.
6. Optional: set a custom domain under **Domain management**.

### Keeping secrets safe
- `.gitignore` already excludes `.env`.
- Frontend variables (`VITE_*`) are visible to visitors by design. Only put public values there.
- Rotate any key that was ever pasted into chat, email or a public place.

---

## 7. Security model (summary)

| Layer | Protection |
|---|---|
| Admin access | Supabase Auth email + password. Public sign-up disabled. Owner row in `admin_users` required. |
| Database | Row Level Security on every table. Public can read only published rooms, published menu items and site settings. Enquiries, bookings, payments and contact messages are owner-only. |
| Enquiries | Inserted only through a Netlify Function (service role). Validated on server. Honeypot field. Rate limit: 5 per IP per 10 minutes (hashed IP, salted). |
| Contact form | Same protections: 3 per IP per 15 minutes. |
| Payments | Amount computed on the server from the room record. Order created server-side. Signature verified with HMAC. Webhook signature verified against the raw body. Duplicate callbacks are idempotent. |
| Routing | Direct navigation works (SPA redirect in `netlify.toml`). `/admin` is marked `noindex`. Real access control is in RLS and the functions, not in route hiding. |
| Headers | Content-Security-Policy, X-Frame-Options DENY, nosniff, strict referrer policy. |

**Known limits to review before launch:**
- Rate limiting uses the database, which is good for a small site, but it is not a full bot-protection service. Add Cloudflare Turnstile or hCaptcha if you see spam.
- Admin sign-in has no second factor. Supabase supports MFA. Enable it for the owner account if available on your plan.
- The enquiry route returns a generic success for honeypot hits, so bots get no signal.

---

## 8. Setup instructions for an Android phone (Chrome)

You can do the whole setup from an Android phone. A laptop is easier for the zip file.

### 8.1 Put the code on GitHub
1. Install the **GitHub** app from the Play Store, or open <https://github.com> in Chrome and sign in.
2. Create a new **private** repository named `prakruthi-hostel`.
3. Extract the zip on your phone (Files app → tap the zip → Extract). Keep the folder structure.
4. **Recommended:** use **github.dev** or **GitHub Codespaces** on Chrome (desktop mode): press `.` on the repo page, or use the GitHub web upload. GitHub limits how many files a single web upload can include, so if the upload is rejected, upload the folders in smaller batches.
5. Make sure `.env` is **not** uploaded. Only `.env.example` should be in the repo.
6. Check that `package.json`, `netlify.toml` and the `netlify/` and `supabase/` folders are at the top level of the repo.

### 8.2 Set up Supabase and Razorpay in Chrome
Follow sections 3 and 4 in Chrome. Use **Request desktop site** (⋮ menu → Desktop site) for the Supabase and Razorpay dashboards. Copy keys into a password manager, not into notes or messages.

### 8.3 Deploy on Netlify in Chrome
1. Open <https://app.netlify.com>, sign in, and follow section 6.
2. Add the environment variables under **Site configuration → Environment variables**. Paste values carefully and check for stray spaces.
3. Watch the deploy log. When it says *Published*, open the site URL.

### 8.4 Check the site on your phone
- Open the site in Chrome, check the menu, the WhatsApp button and the booking form.
- Add the site to the home screen: ⋮ → **Add to Home screen**. It opens like an app.

---

## 9. Launch checklist

- [ ] Supabase migrations 001, 002, 003 run without errors
- [ ] Owner user created, sign-up disabled, `create_owner.sql` run with the owner's UUID
- [ ] Netlify env vars set (all `VITE_*` and server-only variables); no `.env` committed
- [ ] Razorpay still in **test mode**
- [ ] Owner has replaced all SAMPLE text, photos and prices (none of the sample content is published)
- [ ] Facilities, meal timings and menu contain only what the owner confirmed
- [ ] Room availability and deposits match what the owner actually has
- [ ] Google Maps link opens the correct place
- [ ] WhatsApp number confirmed as **+91 9121497402** in `src/lib/config.js` and the owner's WhatsApp account
- [ ] Custom domain (optional) with HTTPS enabled
- [ ] Privacy notice and terms reviewed by the owner (if required by local practice)
- [ ] Owner trained to use the dashboard and to confirm bookings
- [ ] Only then: switch Razorpay to live keys (after approval), and update the webhook to live mode

## 10. Testing checklist (do these before calling the site "working")

**Public site**
- [ ] Home, Rooms, Facilities, Food, Booking, Location, Contact, 404 all load on phone (Chrome, Android) and desktop
- [ ] Direct navigation to `/rooms`, `/food`, `/pay/anything` loads the app instead of a Netlify 404
- [ ] Mobile menu opens and closes; all links work
- [ ] Floating WhatsApp button opens `wa.me/919121497402`

**Booking enquiry**
- [ ] Empty form shows field errors; invalid phone (e.g. `12345`) is rejected; `+91 98765 43210` is accepted
- [ ] Past move-in date is rejected
- [ ] Review screen shows the "not a confirmed reservation" note
- [ ] Submit creates a row in `enquiries` (check in Supabase Table Editor)
- [ ] After submit, the "Also send on WhatsApp" button opens WhatsApp with the prefilled text (test on a real phone)
- [ ] Sixth enquiry from the same connection within 10 minutes is refused (429)
- [ ] A filled honeypot field returns success but creates no row

**Contact form** – send a message; it appears in the admin *Contact form messages* table.

**Admin**
- [ ] `/admin` shows login; wrong password fails
- [ ] A non-owner account (create a second user in Supabase Auth) can sign in but sees "not authorised"
- [ ] Owner: add a room, upload a JPG photo, publish it, see it on `/rooms`
- [ ] Owner: change a price; the public page updates after reload
- [ ] Owner: set beds available > capacity is refused
- [ ] Owner: update a menu item; it appears on `/food`
- [ ] Owner: enquiry → *Create booking* → payment link copied

**Security checks (very important)**
- [ ] Logged out, open the browser console and try: `supabase.from('enquiries').select('*')` with the anon key → returns no rows
- [ ] Anonymous request to `/rest/v1/rooms?is_published=eq.false` → returns no rows
- [ ] Anonymous request to `/rest/v1/bookings` → returns no rows
- [ ] View page source and the built JS: no `service_role`, no `RAZORPAY_KEY_SECRET`, no database password
- [ ] `/.netlify/functions/enquiry` with GET returns 405

**Payments (test mode only)**
- [ ] Owner creates a booking with a room that has a deposit set → shares `/pay/<token>`
- [ ] Guest pays deposit with a Razorpay **test** card/UPI → page shows success after server verification
- [ ] `payments` row becomes `captured` with a `razorpay_payment_id`
- [ ] Webhook: Razorpay dashboard → Webhooks → *Test* delivers `payment.captured` → HTTP 200
- [ ] Cancel the Razorpay popup → page says cancelled; no `captured` row is created
- [ ] Replay the same verify request → still 200 and no duplicate row
- [ ] Tamper with `razorpay_signature` → 400 and no change to the database
- [ ] Booking status is **not** changed to confirmed by payment alone (owner confirms manually)

---

## 11. Known limitations

- Razorpay live mode, Google Maps embed quality and photo sizes depend on external services.
- Room availability is entered manually; it does not automatically reduce when bookings are confirmed.
- No automatic email or SMS notifications. Owner replies via WhatsApp.
- Facilities and prices are shown only as entered by the owner.
- The admin dashboard is functional but basic. It is designed for a single owner.

## 12. Licence / ownership

Code provided for Prakruthi Boys & Girls Hostel. Replace this section with your preferred licence or "All rights reserved" before publishing the repository.
