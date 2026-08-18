# Marketplace notes

Working notes and reference material for the marketplace / beta.

---

## Beta-tester broadcast email (held — send on request)

Status: **held, not scheduled.** Send only when Kayla says to. Send via her Gmail,
**BCC'd** so no tester sees another's address.

At send time still needed:
1. Recipient list — run `select string_agg(email, ', ') from beta_signups;` in the
   Supabase SQL editor and use the result.
2. Confirm the greeting (a BCC blast can't personalise first names, so it uses
   "Hi there,").

**Subject:** You can now test payments on Plistic — here's how

> Hi there,
>
> Thanks again for being one of our beta testers — a quick update, because there's
> a lot new to try.
>
> The Plistic marketplace is now up and running for testing. Businesses can sell
> items and services, take bookings, send custom offers, and offer staged/deposit
> "milestone" payments — and buyers can pay, all the way through to delivery and
> release.
>
> Everything is in test mode — no real money is taken and no card is ever charged.
> When you try buying an item, booking a package, or paying an offer, you'll be
> sent to a Stripe payment screen. Just use this test card:
>
> - Card number: 4242 4242 4242 4242
> - Expiry: any future date (e.g. 12/34)
> - CVC: any 3 digits
> - Name / email / address: anything you like
>
> A real card will simply be declined in test mode, so you can safely run the whole
> flow — buy → deliver → confirm → payment released.
>
> What we'd love you to try: claim and set up your business page (logo, photos,
> showreel, packages), then test a purchase or booking end to end. If you're a
> seller, have a go at sending a custom offer or setting up a staged/milestone
> package.
>
> Spotted a bug or got feedback? Just reply to this email or use the feedback
> button in the corner of the site — every note genuinely helps us before launch.
>
> Thanks so much,
> The Plistic team
>
> (Your access password is still plisticbeta if you need it — when you open the
> Media Directory you'll be asked for it, and you'll stay signed in after that.)
