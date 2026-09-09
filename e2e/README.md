# End-to-end tests

Automated browser tests that click through the **live site** (or a Vercel
preview) and check the key journeys still work. They complement the manual
launch checklist — run them after every deploy to catch regressions fast.

## One-time setup

```bash
pnpm install
npx playwright install chromium   # downloads the browser (first time only)
```

## Run them

Point `BASE_URL` at whatever site you want to test:

```bash
# Against production
BASE_URL=https://www.plisticmedia.com pnpm test:e2e

# Against a Vercel preview deploy
BASE_URL=https://your-preview.vercel.app pnpm test:e2e

# Watch them run in a browser UI
BASE_URL=https://www.plisticmedia.com pnpm test:e2e:ui
```

After a run: `pnpm test:e2e:report` opens a full report (with screenshots and a
video for anything that failed).

## What they cover

| File | Checks |
|------|--------|
| `public.spec.ts` | Homepage, pricing, list-your-business, the guide page video, feedback page, and a 404 all load (also run on a phone viewport). |
| `signup.spec.ts` | "List your business" gates on making an account; the login page renders in business sign-up mode. |
| `feedback.spec.ts` | The feedback form renders and blocks an empty submit. |
| `directory.spec.ts` | Directory + search load; **"podcasting" returns results whenever "podcast" does**; compare page loads; a listing opens. (Enters the beta password automatically.) |
| `authenticated.spec.ts` | Sign in → dashboard. *Skipped unless a test account is provided.* |

## Optional env vars

| Var | Purpose | Default |
|-----|---------|---------|
| `BASE_URL` | Which site to test | `https://www.plisticmedia.com` |
| `BETA_PASSWORD` | Directory beta password | `plisticbeta` |
| `TEST_EMAIL` / `TEST_PASSWORD` | A test account — enables the signed-in tests | *(skipped)* |
| `RUN_WRITE_TESTS` | `=1` also runs tests that submit real data (sends a real feedback email) | off |

## Not automated on purpose

**Payments.** Run those manually in Stripe **test mode** with card
`4242 4242 4242 4242` (any future expiry + CVC), following the launch checklist —
they involve real Stripe redirects and money-handling that are safest to watch
by hand.
