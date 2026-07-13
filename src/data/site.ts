export const brand = {
  name: "Plistic",
  tagline: "media made simPLISTIC",
  locationLine: "Made in Scotland",
  email: "hello@plisticmedia.com",
  bookingLabel: "Book a Call",
  quoteLabel: "Get an instant estimate",
};

// Default "From" for outbound email. MUST be on a domain verified in Resend —
// `updates.plisticmedia.com` is verified; the bare `plisticmedia.com` is not, so
// sending from it fails authentication and lands in spam. Replies still go to
// brand.email (the real inbox) via reply_to. An env var can override this.
export const fromEmail = "Plistic <hello@updates.plisticmedia.com>";

export const calendlyBookingUrl = "https://calendly.com/kayla-megan-burns/30min";
const calendlyEmbedSeparator = calendlyBookingUrl.includes("?") ? "&" : "?";
export const calendlyEmbedUrl = `${calendlyBookingUrl}${calendlyEmbedSeparator}embed_domain=plistic.media&embed_type=Inline`;
export const bookingPagePath = "/book";

export const launchOfferExpiresAt = "2026-08-31T23:59:59+01:00";

export const launchOffer = {
  eyebrow: "Launch early access",
  body: "Up to 50% off event filming, podcasting and documentaries until 31 August.",
  cta: "Get an instant estimate",
};

export const navItems = [
  { label: "Home", href: "/#top" },
  { label: "Services", href: "/#services" },
  { label: "Media Directory", href: "/directory" },
  { label: "Showcase", href: "/showcase" },
  { label: "Our Work", href: "/#work" },
  { label: "Pricing", href: "/pricing" },
  { label: "Earn With Us", href: "/earn" },
  { label: "About", href: "/about" },
];

export const prefixWords = ["pod", "vid", "song", "ad", "doc", "sim"];

export const testimonials = [
  {
    quote:
      "Inspire's long relationship with Podplistic has been built on the fact that they are flexible, reliable and collaborative. They've handled everything we've thrown at them, from recording live events and panel sessions, to full day sessions capturing multiple episodes of our Inspiring Entrepreneurs podcast. Their professionalism, adaptability and commitment to quality make them a trusted partner that we would confidently recommend to any organisation looking to create engaging, high-quality podcast content.",
    name: "Katy McNair",
    org: "Strathclyde Inspire",
  },
  {
    quote:
      "Working with Kayla and Ross is a complete joy! As an inexperienced host, they immediately put me at ease and set up the conditions so that I felt confident and natural in my role. Nothing was too much trouble and I would recommend them to anyone who is looking for audio visual production capability.",
    name: "Ross Tuffee",
    org: "Connect-Ed Network",
  },
  {
    quote:
      "In the early days of developing this new collaborative network, we needed a media partner that could work dynamically with us, to help define how we package our message and reach wider audiences. Kayla and Ross were professional and creative in their approach, bringing the right skill and experience to help transform our ideas into accessible, evergreen resources. I'd have no hesitation in working with them again on another project.",
    name: "Orla Kelly",
    org: "Connect-Ed Network",
  },
  {
    quote:
      "What stood out working with Plistic is their commitment to pushing boundaries, thoughtful content that resonated with our target audience, and the most brilliant project handover guide I've ever read.",
    name: "Kara Olayinka",
    org: "Tiny Changes",
  },
];

export const proofStats = [
  {
    value: "#1",
    label: "Apple Podcasts ranking achieved for a client's podcast in their niche",
  },
  {
    value: "648",
    label: "hours of recording completed and counting",
  },
  {
    value: "68",
    label: "countries reached across client audiences",
  },
];

type TrustedLogo = {
  name: string;
  src: string;
  treatment?: "native" | "nativeTall" | "tinyChanges";
};

export const trustedLogos: TrustedLogo[] = [
  { name: "King's Trust", src: "/assets/logos/king-s-trust-logo-svg.png" },
  { name: "Barclays Eagle Labs", src: "/assets/logos/eagle-labs-logo.png", treatment: "native" },
  { name: "AccelerateHER", src: "/assets/logos/accelerateher-logo.png", treatment: "native" },
  { name: "Techscaler", src: "/assets/logos/techscaler-logo.png" },
  { name: "Firstport", src: "/assets/logos/firstport-hero-logo-rgb.png" },
  { name: "St Andrews Innovation", src: "/assets/logos/download-8-removebg-preview-1.png" },
  { name: "Tiny Changes", src: "/assets/logos/tc-logo-v2-ilka-tc-donationlogo-wh.png", treatment: "tinyChanges" },
  { name: "ConnectEd Podcast", src: "/assets/logos/connect-ed-podcast-art-removebg-preview-1.png" },
  { name: "Robert Gordon University", src: "/assets/logos/rgu-logo.png", treatment: "native" },
  { name: "Royal Bank of Scotland", src: "/assets/logos/rbs-logo.png", treatment: "nativeTall" },
  { name: "Strathclyde Business School", src: "/assets/logos/strath-business-removebg-preview.png", treatment: "native" },
  { name: "University of Glasgow", src: "/assets/logos/uog-colour.png" },
  { name: "University of Strathclyde Inspire", src: "/assets/logos/18-1.png", treatment: "native" },
];

export const services = [
  {
    title: "Podcasting",
    summary: "Full-service podcast production, strategy, research, and on-air coaching - from first concept to a launch that actually lands.",
    image: "/assets/photos/site/ross-anderson.jpg",
    href: "/services/podcasting",
    bullets: ["Podcast launches", "Editing-only packages", "Research and show strategy"],
  },
  {
    title: "Video production",
    summary: "Corporate video, brand films, ads, and music videos - concept, strategy, and on-camera coaching included.",
    image: "/assets/photos/site/kokura-luck.jpg",
    href: "/services/video-production",
    bullets: ["Multi-camera filming", "Documentary production", "Event capture"],
  },
  {
    title: "Event filming",
    summary: "Multi-camera coverage of live events, turned into content that outlasts the day itself.",
    image: "/assets/photos/site/accelerateher.jpg",
    href: "/services/event-filming",
    bullets: ["Up to three cameras", "Edited event video included", "Overview videos and clips"],
  },
  {
    title: "Documentary",
    summary: "Long-form storytelling for the projects that deserve real depth. Our most ambitious work.",
    image: "/assets/photos/site/documentary-1.jpg",
    href: "/services/documentary",
    bullets: ["Research-led story", "Contributor care", "Full production"],
  },
  {
    title: "Coaching",
    summary: "Presentation and media coaching - feel calm and natural on a mic or camera, whether you're a host, a founder, or a whole team.",
    image: "/assets/photos/podcast-monitor.webp",
    href: "/services/coaching",
    bullets: ["Podcast & host coaching", "On-camera confidence", "Founder media training"],
  },
];

export const caseStudies = [
  {
    client: "Strathclyde Inspire",
    service: "Podcast production",
    description: "Production support for a show that reached #1 in its niche on Apple Podcasts.",
    image: "/assets/photos/site/inspire-1.jpg",
    href: "/work/strathclyde-inspire",
  },
  {
    client: "Tiny Changes",
    service: "End-to-end production",
    description:
      "End-to-end support for a youth mental health podcast about building a career in music without losing yourself inside it.",
    image: "/assets/photos/site/tiny-changes-2.jpg",
    href: "/work/tiny-changes",
  },
  {
    client: "Connect-Ed",
    service: "Event capture and editing",
    description:
      "Eight live events turned into an evergreen podcast series, social clips, and a reusable resource for Scotland's university entrepreneurship network.",
    image: "/assets/photos/site/connect-ed-1.jpg",
    href: "/work/connect-ed-network",
  },
  {
    client: "Unfiltered",
    service: "Feature documentary",
    description:
      "A UKRI ESRC-funded research documentary on neurodiverse entrepreneurship, produced with full accessibility coordination throughout.",
    image: "/assets/photos/site/documentary-2.jpg",
    href: "/work/unfiltered-neurodiverse-entrepreneur",
  },
];

export const resourceTopics = [
  "Launching a podcast",
  "Choosing a production partner",
  "Selling a business in Scotland",
  "Media strategy and audience growth",
];

export const experimentSections = [
  {
    title: "Hero",
    links: [
      { label: "A · Viewfinder Focus", href: "/sections/hero/experiments/viewfinder-focus.html" },
      { label: "B · Showreel Cinema", href: "/sections/hero/experiments/showreel-cinema.html" },
      { label: "C · Kinetic Marquee", href: "/sections/hero/experiments/kinetic-marquee.html" },
      { label: "D · Split Stage (Made in Scotland)", href: "/sections/hero/experiments/split-stage-scotland.html" },
    ],
  },
  {
    title: "Proof and Trust",
    links: [
      { label: "Evidence strip", href: "/sections/proof-trust/experiments/evidence-strip.html" },
      { label: "Logo runway", href: "/sections/proof-trust/experiments/logo-runway.html" },
    ],
  },
  {
    title: "Services",
    links: [
      { label: "Four discipline grid", href: "/sections/services/experiments/four-discipline-grid.html" },
      { label: "Media stack", href: "/sections/services/experiments/media-stack.html" },
    ],
  },
  {
    title: "Our Work",
    links: [
      { label: "Case-study ledger", href: "/sections/work/experiments/case-study-ledger.html" },
      { label: "Outcome gallery", href: "/sections/work/experiments/outcome-gallery.html" },
    ],
  },
  {
    title: "Pricing Calculator",
    links: [
      { label: "Pricing overview", href: "/sections/pricing/experiments/index.html" },
      { label: "A · Broadcast console", href: "/sections/pricing/experiments/broadcast-console.html" },
      { label: "B · Rate deck", href: "/sections/pricing/experiments/rate-deck.html" },
      { label: "C · Viewfinder stepper", href: "/sections/pricing/experiments/viewfinder-stepper.html" },
      { label: "D · Producer brief", href: "/sections/pricing/experiments/producer-brief.html" },
    ],
  },
  {
    title: "About and Scotland",
    links: [
      { label: "Glasgow field note", href: "/sections/about/experiments/glasgow-field-note.html" },
      { label: "Psychology craft", href: "/sections/about/experiments/psychology-craft.html" },
    ],
  },
  {
    title: "Conversion",
    links: [
      { label: "Pricing path", href: "/sections/conversion/experiments/pricing-path.html" },
      { label: "Referral split", href: "/sections/conversion/experiments/referral-split.html" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Editorial shelf", href: "/sections/resources/experiments/editorial-shelf.html" },
      { label: "Newsletter panel", href: "/sections/resources/experiments/newsletter-panel.html" },
    ],
  },
];
