# Marketplace notes

Working notes and reference material for the marketplace / beta.

---

## Beta-tester update email (held — send on request)

Status: **held, not scheduled.** Send only when Kayla says to. Send via her Gmail,
**BCC'd** so no tester sees another's address.

At send time still needed:
1. Recipient list — run `select string_agg(email, ', ') from beta_signups;` in the
   Supabase SQL editor and use the result.
2. Confirm the greeting (a BCC blast can't personalise first names, so it uses
   "Hi there,").

**Subject:** You spoke, we listened — what's new on Plistic

> Hi there,
>
> First, a genuine thank you. The feedback you've sent as a Plistic beta tester has
> been amazing, and it's shaped a whole batch of improvements to the site. Here's
> what's new since you first signed up — nearly all of it thanks to you.
>
> GETTING IN IS SIMPLER
> The shared beta password is now entered right at the Media Directory (not on a
> separate screen), and once you're in you stay signed in — no typing it every time.
>
> SETTING UP YOUR LISTING
> The shared password lets you browse the directory during the beta. To build your
> own listing, you create your own free account. "List your business" now takes you
> through creating that account in one step, so your listing is always yours to
> manage.
>
> THE MARKETPLACE IS OPEN TO TEST
> This is the big one. Businesses can sell products and services and take bookings.
> You can send a buyer a one-off custom offer for bespoke work. You can even take
> payment in stages — a deposit up front, then the rest as you finish each part of
> the job. And everything's held safely in escrow until the work is delivered.
>
> BUYERS GET ACCOUNTS TOO
> Buyers can now create an account at checkout, just like any normal shop — to pay,
> track their orders and leave reviews.
>
> LOTS OF SMALLER TOUCHES
> Click any photo on a listing to see it full-screen and flick through the gallery,
> play/pause showreels, tidier pages throughout, and plenty of copy fixes — many of
> them straight from your notes.
>
> WANT TO TEST PAYMENTS?
> Everything is in test mode — no real money is taken and no card is ever charged.
> When you buy an item, book a package or accept an offer, you'll reach a Stripe
> payment screen; just use this test card:
>
> - Card number: 4242 4242 4242 4242
> - Expiry: any future date (e.g. 12/34)
> - CVC: any 3 digits
> - Name / address: anything you like
>
> A real card is declined in test mode, so you can run the whole flow safely.
>
> Please keep the feedback coming — just reply to this email or use the feedback
> button in the corner of the site. It genuinely shapes what we build next.
>
> Thanks so much,
> The Plistic team
>
> (Your access password is still plisticbeta. Take a look:
> https://www.plisticmedia.com/directory — or list your business here:
> https://www.plisticmedia.com/list-your-business)
