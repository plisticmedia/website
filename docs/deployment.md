# Vercel Deployment

This project is a Next.js app intended to run on Vercel with pnpm.

## Project Settings

- Framework preset: `Next.js`
- Install command: `pnpm install --frozen-lockfile`
- Build command: `pnpm build`
- Output directory: leave unset for Next.js

Vercel will deploy preview builds for non-production branches and production builds from the production branch configured in the Vercel project.

## Environment Variables

Set these in Vercel for Production before launch:

- `RESEND_API_KEY`: required for `/api/earn` to send notification and confirmation emails.
- `EARN_NOTIFY_EMAIL`: optional comma-separated internal recipient list. Defaults to `hello@plistic.media`.
- `EARN_FROM_EMAIL`: optional Resend-verified sender, for example `Plistic <hello@plistic.media>`.

The earn form route intentionally returns a `503` in production when `RESEND_API_KEY` is missing, so configure it before sharing the production URL.

## First Deploy

Git integration is the preferred deployment path:

1. Import the repository in Vercel.
2. Confirm the project settings above.
3. Add the environment variables for Production and Preview as needed.
4. Trigger the first deployment from the production branch.

For a CLI preview deploy from this checkout:

```bash
pnpm vercel:preview
```

For a CLI production deploy:

```bash
pnpm vercel:prod
```
