"use client";

import { useMemo, useState, type Dispatch, type FormEvent, type ReactNode, type SetStateAction } from "react";
import Link from "next/link";
import { CalendarDays, Check, ClipboardList, CreditCard, Film, Mic2, Sparkles } from "lucide-react";
import { bookingPagePath } from "@/data/site";
import { podcastAddOns } from "@/data/pricing";
import {
  estimateCoaching,
  estimateDocumentary,
  estimateEvent,
  estimateOther,
  estimatePodcast,
  type CoachingEstimateInput,
  type DocumentaryEstimateInput,
  type EstimateResult,
  type EventEstimateInput,
  type OtherEstimateInput,
  type PodcastEstimateInput,
  type ServiceChoice,
} from "@/lib/pricing";
import styles from "./PricingCalculator.module.css";

const currency = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  maximumFractionDigits: 0,
});

const serviceOptions: Array<{ id: ServiceChoice; label: string; detail: string }> = [
  { id: "podcast", label: "Podcast", detail: "Series scope" },
  { id: "event", label: "Event", detail: "Capture package" },
  { id: "musicVideo", label: "Music video", detail: "Creative scope" },
  { id: "documentary", label: "Doc", detail: "Story brief" },
  { id: "coaching", label: "Coaching", detail: "Prep session" },
  { id: "other", label: "Other", detail: "Open brief" },
];

const podcastDefaults: PodcastEstimateInput = {
  need: "full",
  episodes: "sixEight",
  episodeLength: "twentyForty",
  location: "glasgowOffice",
  cadence: "regular",
  productionDepth: "standard",
  addOns: [],
  socialClipCount: 5,
  coachingSessions: 1,
  budget: "unsure",
  timeline: "twoFour",
};

const eventDefaults: EventEstimateInput = {
  duration: "full",
  location: "glasgow",
  cameras: "oneCamera",
  addGimbal: false,
  complexEdit: false,
  overviewVideo: false,
  socialClipCount: 0,
  rawFootage: false,
  eventDate: "",
  extraNotes: "",
};

const documentaryDefaults: DocumentaryEstimateInput = {
  scale: "short",
  vision: "",
  location: "singleGlasgow",
  contributors: "threeFive",
  budget: "unsure",
  timeline: "fourSix",
};

const coachingDefaults: CoachingEstimateInput = {
  format: "singleRemote",
  context: "podcastHost",
  preparingFor: "podcast",
  location: "remote",
  timeline: "twoFour",
  extraNotes: "",
};

const otherDefaults: OtherEstimateInput = {
  category: "unsure",
  outputs: "",
  budget: "unsure",
  timeline: "flexible",
  extraNotes: "",
};

const musicVideoDefaults: OtherEstimateInput = {
  ...otherDefaults,
  category: "musicVideo",
};

const podcastNeedLabels: Record<PodcastEstimateInput["need"], string> = {
  full: "Full service",
  post: "Post-production only",
};

const podcastEpisodeLabels: Record<PodcastEstimateInput["episodes"], string> = {
  threeFive: "3-5 episodes",
  sixEight: "6-8 episodes",
  nineEleven: "9-11 episodes",
  twelvePlus: "12+ episodes",
  ongoing: "Ongoing",
  unsure: "To confirm",
};

const episodeLengthLabels: Record<PodcastEstimateInput["episodeLength"], string> = {
  under20: "Under 20 mins",
  twentyForty: "20-40 mins",
  fortySixty: "40-60 mins",
  sixtyPlus: "60+ mins",
  unsure: "To confirm",
};

const podcastLocationLabels: Record<PodcastEstimateInput["location"], string> = {
  glasgowOffice: "Glasgow offices",
  glasgowClient: "Client site in Glasgow",
  outsideGlasgow: "Outside Glasgow",
  remote: "Remote",
  unsure: "To confirm",
};

const podcastDepthLabels: Record<PodcastEstimateInput["productionDepth"], string> = {
  light: "Light edit",
  standard: "Standard edit",
  full: "Full production",
};

const podcastBudgetLabels: Record<PodcastEstimateInput["budget"], string> = {
  under3: "Under £3k",
  threeSix: "£3k-£6k",
  sixTwelve: "£6k-£12k",
  twelveTwenty: "£12k-£20k",
  twentyPlus: "£20k+",
  unsure: "Not sure yet",
};

const timelineLabels: Record<PodcastEstimateInput["timeline"], string> = {
  withinTwo: "Within 2 months",
  twoFour: "2-4 months",
  fourSix: "4-6 months",
  later: "Later this year",
  flexible: "Flexible",
};

const eventDurationLabels: Record<EventEstimateInput["duration"], string> = {
  half: "Half day",
  full: "Full day",
  multi: "Multi-day",
  unsure: "To confirm",
};

const eventLocationLabels: Record<EventEstimateInput["location"], string> = {
  glasgow: "Glasgow",
  outsideGlasgow: "Outside Glasgow",
  outsideScotland: "Outside Scotland",
};

const cameraLabels: Record<EventEstimateInput["cameras"], string> = {
  oneCamera: "1 camera",
  twoCameras: "2 cameras",
  threeCameras: "3 cameras",
  unsure: "To confirm",
};

const documentaryScaleLabels: Record<DocumentaryEstimateInput["scale"], string> = {
  short: "Short documentary",
  feature: "Feature documentary",
  complex: "Complex / multi-location",
  unsure: "To confirm",
};

const documentaryLocationLabels: Record<DocumentaryEstimateInput["location"], string> = {
  singleGlasgow: "Single Glasgow location",
  singleOutsideGlasgow: "Single location outside Glasgow",
  multiLocation: "Multiple locations",
  unsure: "To confirm",
};

const contributorLabels: Record<DocumentaryEstimateInput["contributors"], string> = {
  oneTwo: "1-2 contributors",
  threeFive: "3-5 contributors",
  sixPlus: "6+ contributors",
  unsure: "To confirm",
};

const documentaryBudgetLabels: Record<DocumentaryEstimateInput["budget"], string> = {
  under12: "Under £12k",
  twelveTwenty: "£12k-£20k",
  twentyForty: "£20k-£40k",
  fortyPlus: "£40k+",
  unsure: "Not sure yet",
};

const coachingFormatLabels: Record<CoachingEstimateInput["format"], string> = {
  singleRemote: "Single remote session",
  remoteBlock: "Block of 3 remote sessions",
  inPersonRecordingDay: "In-person on recording day",
  inPersonStandalone: "In-person standalone",
  teamWorkshop: "Team workshop",
  unsure: "To confirm",
};

const coachingContextLabels: Record<CoachingEstimateInput["context"], string> = {
  podcastHost: "Podcast host",
  onCamera: "On-camera talent",
  founder: "Founder / spokesperson",
  team: "Team",
  other: "Other",
};

const preparingForLabels: Record<CoachingEstimateInput["preparingFor"], string> = {
  podcast: "Podcast recording",
  video: "Video shoot",
  event: "Live event",
  interview: "Interview",
  unsure: "To confirm",
};

const coachingLocationLabels: Record<CoachingEstimateInput["location"], string> = {
  remote: "Remote",
  glasgow: "Glasgow",
  outsideGlasgow: "Outside Glasgow",
  unsure: "To confirm",
};

const otherCategoryLabels: Record<OtherEstimateInput["category"], string> = {
  video: "Video production",
  ads: "Ads / campaign",
  musicVideo: "Music video",
  strategy: "Strategy",
  mixed: "Mixed media",
  unsure: "Not sure yet",
};

type DetailRow = {
  label: string;
  value: string;
};

function Field({
  label,
  children,
  hint,
  wide = false,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
  wide?: boolean;
}) {
  return (
    <label className={`${styles.field} ${wide ? styles.fullField : ""}`}>
      <span>{label}</span>
      {children}
      {hint ? <small>{hint}</small> : null}
    </label>
  );
}

function Checkbox({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className={styles.checkbox}>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <span className={styles.checkboxMark} aria-hidden="true">
        <Check size={14} />
      </span>
      <span>{label}</span>
    </label>
  );
}

function PriceRange({ result }: { result: EstimateResult }) {
  if (!result.range) {
    return <div className={styles.slateCallout}>Scoped on call</div>;
  }

  const { low, high, qualifier } = result.range;

  if (low === high) {
    return (
      <div className={styles.slateRange}>
        <span className={styles.priceLine}>{currency.format(low)}</span>
        {qualifier ? <small>{qualifier}</small> : null}
      </div>
    );
  }

  return (
    <div className={styles.slateRange}>
      <span className={styles.priceLine}>
        <span>{currency.format(low)}</span>
        <span className={styles.rangeDash}>-</span>
        <span>{currency.format(high)}</span>
      </span>
      {qualifier ? <small>{qualifier}</small> : null}
    </div>
  );
}

function QuoteSlate({
  title,
  result,
  rows,
  ctaLabel,
  intro,
  briefOnly = false,
}: {
  title: string;
  rows: DetailRow[];
  status: string;
  ctaLabel: string;
  intro: string;
  result?: EstimateResult;
  briefOnly?: boolean;
}) {
  return (
    <aside className={styles.quoteSlate} aria-live="polite">
      <h3>{title}</h3>

      {result ? <PriceRange result={result} /> : <div className={styles.slateCallout}>Scoped on call</div>}

      <p className={styles.slateIntro}>{intro}</p>

      {!briefOnly ? (
        <div className={styles.slateRows}>
          {rows.map((row) => (
            <div key={row.label}>
              <span>{row.label}</span>
              <strong>{row.value}</strong>
            </div>
          ))}
        </div>
      ) : null}

      {!briefOnly && result && result.includes.length > 0 ? (
        <div className={styles.slateBlock}>
          <strong>In scope</strong>
          <ul className={styles.slateList}>
            {result.includes.map((item) => (
              <li key={item}>
                <Check aria-hidden="true" size={15} />
                {item}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {!briefOnly && result && result.flags.length > 0 ? (
        <div className={`${styles.slateBlock} ${styles.warningBlock}`}>
          <strong>Call notes</strong>
          <ul className={styles.noteList}>
            {result.flags.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {!briefOnly && result && result.notIncluded.length > 0 ? (
        <div className={styles.slateBlock}>
          <strong>Not included yet</strong>
          <ul className={styles.noteList}>
            {result.notIncluded.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {!briefOnly && result && result.notes.length > 0 ? (
        <div className={styles.slateNotes}>
          {result.notes.map((note) => (
            <p key={note}>{note}</p>
          ))}
        </div>
      ) : null}

      <EstimateLeadForm title={title} result={result} rows={rows} variant={briefOnly ? "brief" : "estimate"} />

      <div className={styles.slateActions}>
        <Link className="p-btn" href={bookingPagePath}>
          <CalendarDays aria-hidden="true" size={18} />
          {ctaLabel}
        </Link>
        {result?.depositEligible ? (
          <Link className="p-btn p-btn--ghost" href={bookingPagePath}>
            <CreditCard aria-hidden="true" size={18} />
            Pay deposit
          </Link>
        ) : null}
      </div>
    </aside>
  );
}

function EstimateLeadForm({
  title,
  result,
  rows,
  variant = "estimate",
}: {
  title: string;
  result?: EstimateResult;
  rows: DetailRow[];
  variant?: "estimate" | "brief";
}) {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const isBrief = variant === "brief";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    setStatus("submitting");
    setMessage("Sending estimate...");

    const payload = {
      serviceTitle: title,
      rangeText: getRangeText(result),
      rows,
      includes: result?.includes ?? [],
      flags: result?.flags ?? [],
      notes: result?.notes ?? [],
      notIncluded: result?.notIncluded ?? [],
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      organisation: String(formData.get("organisation") ?? ""),
      projectNote: String(formData.get("projectNote") ?? ""),
    };

    try {
      const response = await fetch("/api/pricing-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const responseBody = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        throw new Error(responseBody?.error ?? "We could not send this estimate. Please try again.");
      }

      form.reset();
      setStatus("success");
      setMessage(isBrief ? "Brief sent. Next step: book your call." : "Estimate sent. Our team now has your calculator details.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "We could not send this estimate. Please try again.");
    }
  }

  return (
    <form className={styles.leadForm} onSubmit={handleSubmit}>
      <div className={styles.leadHeader}>
        <strong>{isBrief ? "Send this brief to Plistic" : "Send this estimate to Plistic"}</strong>
        <p>
          {isBrief
            ? "Share your details and we will receive your answers before the call."
            : "Share your details and we will receive the service, range, calculator selections, and your note."}
        </p>
      </div>
      <div className={styles.leadFields}>
        <label>
          <span>Name</span>
          <input name="name" type="text" autoComplete="name" required />
        </label>
        <label>
          <span>Email</span>
          <input name="email" type="email" autoComplete="email" required />
        </label>
        <label className={styles.fullLeadField}>
          <span>Organisation</span>
          <input name="organisation" type="text" autoComplete="organization" />
        </label>
        <label className={styles.fullLeadField}>
          <span>Project note</span>
          <textarea name="projectNote" rows={3} placeholder="Anything useful before the call?" />
        </label>
      </div>
      {status === "success" || status === "error" ? (
        <p
          className={`${styles.leadStatus} ${status === "success" ? styles.leadSuccess : styles.leadError}`}
          aria-live="polite"
        >
          {message}
        </p>
      ) : null}
      <button className="p-btn" type="submit" disabled={status === "submitting"}>
        {status === "submitting" ? "Sending..." : "Send estimate"}
      </button>
    </form>
  );
}

function getRangeText(result?: EstimateResult) {
  if (!result?.range) {
    return "Scoped on call";
  }

  const { low, high, qualifier } = result.range;
  const base = low === high ? currency.format(low) : `${currency.format(low)} - ${currency.format(high)}`;

  return qualifier ? `${base} ${qualifier}` : base;
}

export function PricingCalculator() {
  const [service, setService] = useState<ServiceChoice>("podcast");
  const [podcast, setPodcast] = useState<PodcastEstimateInput>(podcastDefaults);
  const [event, setEvent] = useState<EventEstimateInput>(eventDefaults);
  const [musicVideo, setMusicVideo] = useState<OtherEstimateInput>(musicVideoDefaults);
  const [documentary, setDocumentary] = useState<DocumentaryEstimateInput>(documentaryDefaults);
  const [coaching, setCoaching] = useState<CoachingEstimateInput>(coachingDefaults);
  const [other, setOther] = useState<OtherEstimateInput>(otherDefaults);

  const podcastResult = useMemo(() => estimatePodcast(podcast), [podcast]);
  const eventResult = useMemo(() => estimateEvent(event), [event]);
  const musicVideoResult = useMemo(() => estimateOther(musicVideo), [musicVideo]);
  const documentaryResult = useMemo(() => estimateDocumentary(documentary), [documentary]);
  const coachingResult = useMemo(() => estimateCoaching(coaching), [coaching]);
  const otherResult = useMemo(() => estimateOther(other), [other]);

  function togglePodcastAddOn(id: string, checked: boolean) {
    setPodcast((current) => ({
      ...current,
      addOns: checked ? [...current.addOns, id] : current.addOns.filter((item) => item !== id),
    }));
  }

  const activeSlate = getActiveSlate(
    service,
    { podcast, event, musicVideo, documentary, coaching, other },
    { podcastResult, eventResult, musicVideoResult, documentaryResult, coachingResult, otherResult },
  );

  return (
    <div className={styles.calculator}>
      <div className={`p-vf ${styles.briefShell}`}>
        <span className="p-vfc" aria-hidden="true" />

        <div className={styles.producerGrid}>
          <div className={styles.briefDesk}>
            <div className={styles.servicePicker} role="list" aria-label="Service selector">
              {serviceOptions.map((option, index) => (
                <button
                  className={styles.serviceOption}
                  type="button"
                  key={option.id}
                  aria-pressed={service === option.id}
                  onClick={() => setService(option.id)}
                >
                  <span className={styles.serviceNumber}>{String(index + 1).padStart(2, "0")}</span>
                  <span>{option.label}</span>
                </button>
              ))}
            </div>

            {service === "podcast" ? (
              <PodcastIntake
                podcast={podcast}
                setPodcast={setPodcast}
                togglePodcastAddOn={togglePodcastAddOn}
              />
            ) : null}

            {service === "event" ? <EventIntake event={event} setEvent={setEvent} /> : null}

            {service === "musicVideo" ? (
              <MusicVideoIntake musicVideo={musicVideo} setMusicVideo={setMusicVideo} />
            ) : null}

            {service === "documentary" ? (
              <DocumentaryIntake documentary={documentary} setDocumentary={setDocumentary} />
            ) : null}

            {service === "coaching" ? (
              <CoachingIntake coaching={coaching} setCoaching={setCoaching} />
            ) : null}

            {service === "other" ? (
              <OtherIntake other={other} setOther={setOther} />
            ) : null}
          </div>

          <QuoteSlate {...activeSlate} />
        </div>
      </div>
    </div>
  );
}

function getActiveSlate(
  service: ServiceChoice,
  inputs: {
    podcast: PodcastEstimateInput;
    event: EventEstimateInput;
    musicVideo: OtherEstimateInput;
    documentary: DocumentaryEstimateInput;
    coaching: CoachingEstimateInput;
    other: OtherEstimateInput;
  },
  results: {
    podcastResult: EstimateResult;
    eventResult: EstimateResult;
    musicVideoResult: EstimateResult;
    documentaryResult: EstimateResult;
    coachingResult: EstimateResult;
    otherResult: EstimateResult;
  },
): Parameters<typeof QuoteSlate>[0] {
  const { podcast, event, musicVideo, documentary, coaching, other } = inputs;
  const { podcastResult, eventResult, musicVideoResult, documentaryResult, coachingResult, otherResult } = results;

  if (service === "podcast") {
    return {
      title: podcast.need === "post" ? "Post-production" : "Podcast series",
      result: podcastResult,
      status: podcastResult.depositEligible ? "Deposit path" : "Call first",
      ctaLabel: podcastResult.primaryCta,
      intro: "Final pricing is confirmed after Plistic reviews the brief.",
      rows: [
        { label: "Need", value: podcastNeedLabels[podcast.need] },
        { label: "Episodes", value: podcastEpisodeLabels[podcast.episodes] },
        {
          label: podcast.need === "full" ? "Recording" : "Depth",
          value: podcast.need === "full" ? podcastLocationLabels[podcast.location] : podcastDepthLabels[podcast.productionDepth],
        },
        { label: "Timing", value: timelineLabels[podcast.timeline] },
      ],
    };
  }

  if (service === "event") {
    return {
      title: "Event filming",
      result: eventResult,
      status: eventResult.depositEligible ? "Deposit path" : "Call first",
      ctaLabel: eventResult.primaryCta,
      intro: "The slate updates as duration, camera setup, location and outputs change.",
      rows: [
        { label: "Duration", value: eventDurationLabels[event.duration] },
        { label: "Camera", value: cameraLabels[event.cameras] },
        { label: "Location", value: eventLocationLabels[event.location] },
        { label: "Social clips", value: String(event.socialClipCount) },
      ],
    };
  }

  if (service === "musicVideo") {
    return {
      title: "Music video",
      result: musicVideoResult,
      status: "Call first",
      ctaLabel: musicVideoResult.primaryCta,
      intro: "Music videos are shaped around the creative idea, location, crew, edit, and delivery needs.",
      rows: [
        { label: "Category", value: "Music video" },
        { label: "Outputs", value: musicVideo.outputs.trim() ? "Added" : "To define" },
        { label: "Budget", value: podcastBudgetLabels[musicVideo.budget] },
        { label: "Timing", value: timelineLabels[musicVideo.timeline] },
      ],
    };
  }

  if (service === "documentary") {
    return {
      title: "Documentary",
      result: documentaryResult,
      status: "Call first",
      ctaLabel: "Book a call",
      intro: "Documentary pricing is always confirmed through a production call after the vision and production shape are clearer.",
      briefOnly: true,
      rows: [
        { label: "Length", value: documentaryScaleLabels[documentary.scale] },
        { label: "Location", value: documentaryLocationLabels[documentary.location] },
        { label: "Contributors", value: contributorLabels[documentary.contributors] },
        { label: "Budget", value: documentaryBudgetLabels[documentary.budget] },
      ],
    };
  }

  if (service === "coaching") {
    return {
      title: "Coaching",
      result: coachingResult,
      status: "Call first",
      ctaLabel: "Book a call",
      intro: "Coaching is confirmed on a call once we understand who is preparing, what they are preparing for, and the format needed.",
      briefOnly: true,
      rows: [
        { label: "Format", value: coachingFormatLabels[coaching.format] },
        { label: "Context", value: coachingContextLabels[coaching.context] },
        { label: "Preparing for", value: preparingForLabels[coaching.preparingFor] },
        { label: "Timing", value: timelineLabels[coaching.timeline] },
      ],
    };
  }

  return {
    title: "Open brief",
    result: otherResult,
    status: "Call first",
    ctaLabel: "Book a call",
    intro: "Plistic will shape the right route once the production goal is clearer.",
    briefOnly: true,
    rows: [
      { label: "Category", value: otherCategoryLabels[other.category] },
      { label: "Outputs", value: other.outputs.trim() ? "Added" : "To define" },
      { label: "Budget", value: podcastBudgetLabels[other.budget] },
      { label: "Timing", value: timelineLabels[other.timeline] },
    ],
  };
}

function PodcastIntake({
  podcast,
  setPodcast,
  togglePodcastAddOn,
}: {
  podcast: PodcastEstimateInput;
  setPodcast: Dispatch<SetStateAction<PodcastEstimateInput>>;
  togglePodcastAddOn: (id: string, checked: boolean) => void;
}) {
  return (
    <div className={styles.intakePanel}>
      <div className={styles.panelHeading}>
        <span className={styles.iconFrame}>
          <Mic2 aria-hidden="true" size={22} />
        </span>
        <div>
          <h3>Podcast scope</h3>
          <p>Choose the production shape, episode volume and launch context.</p>
        </div>
      </div>

      <div className={styles.fields}>
        <Field label="Need">
          <select
            value={podcast.need}
            onChange={(eventChange) =>
              setPodcast((current) => ({
                ...current,
                need: eventChange.target.value as PodcastEstimateInput["need"],
              }))
            }
          >
            <option value="full">Full service - recording + production</option>
            <option value="post">Post-production only</option>
          </select>
        </Field>

        <Field label="Episodes">
          <select
            value={podcast.episodes}
            onChange={(eventChange) =>
              setPodcast((current) => ({
                ...current,
                episodes: eventChange.target.value as PodcastEstimateInput["episodes"],
              }))
            }
          >
            <option value="threeFive">3-5</option>
            <option value="sixEight">6-8</option>
            <option value="nineEleven">9-11</option>
            <option value="twelvePlus">12+</option>
            <option value="ongoing">Ongoing / per episode</option>
            <option value="unsure">Not sure yet</option>
          </select>
        </Field>

        <Field label="Length">
          <select
            value={podcast.episodeLength}
            onChange={(eventChange) =>
              setPodcast((current) => ({
                ...current,
                episodeLength: eventChange.target.value as PodcastEstimateInput["episodeLength"],
              }))
            }
          >
            <option value="under20">Under 20 mins</option>
            <option value="twentyForty">20-40 mins</option>
            <option value="fortySixty">40-60 mins</option>
            <option value="sixtyPlus">60+ mins</option>
            <option value="unsure">Not sure yet</option>
          </select>
        </Field>

        {podcast.need === "full" ? (
          <>
            <Field label="Recording">
              <select
                value={podcast.location}
                onChange={(eventChange) =>
                  setPodcast((current) => ({
                    ...current,
                    location: eventChange.target.value as PodcastEstimateInput["location"],
                  }))
                }
              >
                <option value="glasgowOffice">Glasgow offices</option>
                <option value="glasgowClient">Your office or site in Glasgow</option>
                <option value="outsideGlasgow">Outside Glasgow</option>
                <option value="remote">Remotely / online</option>
                <option value="unsure">Not sure yet</option>
              </select>
            </Field>

            <Field label="Pattern">
              <select
                value={podcast.cadence}
                onChange={(eventChange) =>
                  setPodcast((current) => ({
                    ...current,
                    cadence: eventChange.target.value as PodcastEstimateInput["cadence"],
                  }))
                }
              >
                <option value="batch">Batch - multiple episodes in one day</option>
                <option value="regular">Regular cadence</option>
                <option value="mixed">Mix of both</option>
                <option value="unsure">Not sure - advise me</option>
              </select>
            </Field>
          </>
        ) : (
          <Field label="Depth">
            <select
              value={podcast.productionDepth}
              onChange={(eventChange) =>
                setPodcast((current) => ({
                  ...current,
                  productionDepth: eventChange.target.value as PodcastEstimateInput["productionDepth"],
                }))
              }
            >
              <option value="light">Light edit</option>
              <option value="standard">Standard edit</option>
              <option value="full">Full production</option>
            </select>
          </Field>
        )}

        <Field label="Budget">
          <select
            value={podcast.budget}
            onChange={(eventChange) =>
              setPodcast((current) => ({
                ...current,
                budget: eventChange.target.value as PodcastEstimateInput["budget"],
              }))
            }
          >
            <option value="under3">Under £3k</option>
            <option value="threeSix">£3k-£6k</option>
            <option value="sixTwelve">£6k-£12k</option>
            <option value="twelveTwenty">£12k-£20k</option>
            <option value="twentyPlus">£20k+</option>
            <option value="unsure">Not sure yet</option>
          </select>
        </Field>

        <Field label="Launch">
          <select
            value={podcast.timeline}
            onChange={(eventChange) =>
              setPodcast((current) => ({
                ...current,
                timeline: eventChange.target.value as PodcastEstimateInput["timeline"],
              }))
            }
          >
            <option value="withinTwo">Within 2 months</option>
            <option value="twoFour">2-4 months</option>
            <option value="fourSix">4-6 months</option>
            <option value="later">Later this year</option>
            <option value="flexible">Flexible</option>
          </select>
        </Field>
      </div>

      <div className={styles.addonSection}>
        <h4>Add-ons</h4>
        <div className={styles.addonGrid}>
          {podcastAddOns.map((addOn) => (
            <Checkbox
              key={addOn.id}
              checked={podcast.addOns.includes(addOn.id)}
              label={addOn.label}
              onChange={(checked) => togglePodcastAddOn(addOn.id, checked)}
            />
          ))}
          <Checkbox
            checked={podcast.addOns.includes("coverArt")}
            label="Cover art - express interest"
            onChange={(checked) => togglePodcastAddOn("coverArt", checked)}
          />
          <Checkbox
            checked={podcast.addOns.includes("marketing")}
            label="Marketing and launch - express interest"
            onChange={(checked) => togglePodcastAddOn("marketing", checked)}
          />
        </div>

        <div className={styles.inlineFields}>
          {podcast.addOns.includes("socialClips") ? (
            <Field label="Social clips">
              <input
                type="number"
                min="0"
                max="60"
                value={podcast.socialClipCount}
                onChange={(eventChange) =>
                  setPodcast((current) => ({
                    ...current,
                    socialClipCount: Number(eventChange.target.value),
                  }))
                }
              />
            </Field>
          ) : null}

          {podcast.addOns.includes("coachingRemote") ? (
            <Field label="Coaching sessions">
              <input
                type="number"
                min="1"
                max="12"
                value={podcast.coachingSessions}
                onChange={(eventChange) =>
                  setPodcast((current) => ({
                    ...current,
                    coachingSessions: Number(eventChange.target.value),
                  }))
                }
              />
            </Field>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function EventIntake({
  event,
  setEvent,
}: {
  event: EventEstimateInput;
  setEvent: Dispatch<SetStateAction<EventEstimateInput>>;
}) {
  return (
    <div className={styles.intakePanel}>
      <div className={styles.panelHeading}>
        <span className={styles.iconFrame}>
          <Film aria-hidden="true" size={22} />
        </span>
        <div>
          <h3>Event filming</h3>
          <p>Capture duration, camera package, location and delivery extras.</p>
        </div>
      </div>

      <div className={styles.fields}>
        <Field label="Event length">
          <select
            value={event.duration}
            onChange={(eventChange) =>
              setEvent((current) => ({
                ...current,
                duration: eventChange.target.value as EventEstimateInput["duration"],
              }))
            }
          >
            <option value="half">Half day - under 4 hours</option>
            <option value="full">Full day</option>
            <option value="multi">Multi-day</option>
            <option value="unsure">Not sure yet</option>
          </select>
        </Field>

        <Field label="Location">
          <select
            value={event.location}
            onChange={(eventChange) =>
              setEvent((current) => ({
                ...current,
                location: eventChange.target.value as EventEstimateInput["location"],
              }))
            }
          >
            <option value="glasgow">Glasgow</option>
            <option value="outsideGlasgow">Outside Glasgow</option>
            <option value="outsideScotland">Outside Scotland</option>
          </select>
        </Field>

        <Field label="Cameras">
          <select
            value={event.cameras}
            onChange={(eventChange) =>
              setEvent((current) => ({
                ...current,
                cameras: eventChange.target.value as EventEstimateInput["cameras"],
              }))
            }
          >
            <option value="oneCamera">1 camera</option>
            <option value="twoCameras">2 cameras</option>
            <option value="threeCameras">3 cameras</option>
            <option value="unsure">Not sure - advise me</option>
          </select>
        </Field>

        <Field label="Event date" hint="Leave blank if it is not confirmed yet.">
          <input
            type="date"
            value={event.eventDate}
            onChange={(eventChange) =>
              setEvent((current) => ({
                ...current,
                eventDate: eventChange.target.value,
              }))
            }
          />
        </Field>
      </div>

      <div className={styles.addonSection}>
        <h4>Outputs and add-ons</h4>
        <div className={styles.addonGrid}>
          <Checkbox
            checked={event.addGimbal}
            label="Add a gimbal"
            onChange={(checked) => setEvent((current) => ({ ...current, addGimbal: checked }))}
          />
          <Checkbox
            checked={event.complexEdit}
            label="Complex edit uplift"
            onChange={(checked) => setEvent((current) => ({ ...current, complexEdit: checked }))}
          />
          <Checkbox
            checked={event.overviewVideo}
            label="Overview / ad video"
            onChange={(checked) => setEvent((current) => ({ ...current, overviewVideo: checked }))}
          />
          <Checkbox
            checked={event.rawFootage}
            label="Raw footage delivery"
            onChange={(checked) => setEvent((current) => ({ ...current, rawFootage: checked }))}
          />
        </div>
        <p className={styles.helperNote}>
          A camera gimbal allows for motion shots that will create a dynamic tone for any of your event content.
        </p>

        <div className={styles.inlineFields}>
          <Field label="Social clips">
            <input
              type="number"
              min="0"
              max="60"
              value={event.socialClipCount}
              onChange={(eventChange) =>
                setEvent((current) => ({
                  ...current,
                  socialClipCount: Number(eventChange.target.value),
                }))
              }
            />
          </Field>
        </div>

        <Field label="Anything else?" hint="Passed to the team with the brief. Not used in the estimate." wide>
          <textarea
            value={event.extraNotes}
            onChange={(eventChange) =>
              setEvent((current) => ({
                ...current,
                extraNotes: eventChange.target.value,
              }))
            }
            placeholder="Timings, venue notes, must-capture moments, delivery needs..."
          />
        </Field>
      </div>
    </div>
  );
}

function MusicVideoIntake({
  musicVideo,
  setMusicVideo,
}: {
  musicVideo: OtherEstimateInput;
  setMusicVideo: Dispatch<SetStateAction<OtherEstimateInput>>;
}) {
  return (
    <div className={styles.intakePanel}>
      <div className={styles.panelHeading}>
        <span className={styles.iconFrame}>
          <Film aria-hidden="true" size={22} />
        </span>
        <div>
          <h3>Music video brief</h3>
          <p>Start with the creative idea, delivery needs, budget band, and timeline.</p>
        </div>
      </div>

      <div className={styles.fields}>
        <Field label="Budget">
          <select
            value={musicVideo.budget}
            onChange={(eventChange) =>
              setMusicVideo((current) => ({
                ...current,
                category: "musicVideo",
                budget: eventChange.target.value as OtherEstimateInput["budget"],
              }))
            }
          >
            <option value="under3">Under &pound;3k</option>
            <option value="threeSix">&pound;3k-&pound;6k</option>
            <option value="sixTwelve">&pound;6k-&pound;12k</option>
            <option value="twelveTwenty">&pound;12k-&pound;20k</option>
            <option value="twentyPlus">&pound;20k+</option>
            <option value="unsure">Not sure yet</option>
          </select>
        </Field>

        <Field label="Timeline">
          <select
            value={musicVideo.timeline}
            onChange={(eventChange) =>
              setMusicVideo((current) => ({
                ...current,
                category: "musicVideo",
                timeline: eventChange.target.value as OtherEstimateInput["timeline"],
              }))
            }
          >
            <option value="withinTwo">Within 2 months</option>
            <option value="twoFour">2-4 months</option>
            <option value="fourSix">4-6 months</option>
            <option value="later">Later this year</option>
            <option value="flexible">Flexible</option>
          </select>
        </Field>

        <Field label="Outputs" hint="What do you need delivered?" wide>
          <textarea
            value={musicVideo.outputs}
            onChange={(eventChange) =>
              setMusicVideo((current) => ({
                ...current,
                category: "musicVideo",
                outputs: eventChange.target.value,
              }))
            }
            placeholder="For example: a main music video, teasers, vertical clips, behind-the-scenes edits..."
          />
        </Field>

        <Field label="Anything else?" hint="Passed to the team with the brief." wide>
          <textarea
            value={musicVideo.extraNotes}
            onChange={(eventChange) =>
              setMusicVideo((current) => ({
                ...current,
                category: "musicVideo",
                extraNotes: eventChange.target.value,
              }))
            }
            placeholder="Concept, references, locations, cast, choreography, special effects, deadlines..."
          />
        </Field>
      </div>
    </div>
  );
}

function DocumentaryIntake({
  documentary,
  setDocumentary,
}: {
  documentary: DocumentaryEstimateInput;
  setDocumentary: Dispatch<SetStateAction<DocumentaryEstimateInput>>;
}) {
  return (
    <div className={styles.intakePanel}>
      <div className={styles.panelHeading}>
        <span className={styles.iconFrame}>
          <Film aria-hidden="true" size={22} />
        </span>
        <div>
          <h3>Documentary brief</h3>
          <p>
            Tell us a bit about your vision for your documentary using the form below to give us an idea about your
            project before your kick off call. If you aren&apos;t sure yet, that&apos;s fine - we can work these out together
            on call.
          </p>
        </div>
      </div>

      <div className={styles.fields}>
        <Field label="Finished length">
          <select
            value={documentary.scale}
            onChange={(eventChange) =>
              setDocumentary((current) => ({
                ...current,
                scale: eventChange.target.value as DocumentaryEstimateInput["scale"],
              }))
            }
          >
            <option value="short">Under 30 mins</option>
            <option value="feature">45-90 mins</option>
            <option value="complex">Complex / multi-location</option>
            <option value="unsure">Not sure yet</option>
          </select>
        </Field>

        <Field label="Location">
          <select
            value={documentary.location}
            onChange={(eventChange) =>
              setDocumentary((current) => ({
                ...current,
                location: eventChange.target.value as DocumentaryEstimateInput["location"],
              }))
            }
          >
            <option value="singleGlasgow">Single Glasgow location</option>
            <option value="singleOutsideGlasgow">Single location outside Glasgow</option>
            <option value="multiLocation">Multiple locations</option>
            <option value="unsure">Not sure yet</option>
          </select>
        </Field>

        <Field label="Contributors">
          <select
            value={documentary.contributors}
            onChange={(eventChange) =>
              setDocumentary((current) => ({
                ...current,
                contributors: eventChange.target.value as DocumentaryEstimateInput["contributors"],
              }))
            }
          >
            <option value="oneTwo">1-2</option>
            <option value="threeFive">3-5</option>
            <option value="sixPlus">6+</option>
            <option value="unsure">Not sure yet</option>
          </select>
        </Field>

        <Field label="Budget">
          <select
            value={documentary.budget}
            onChange={(eventChange) =>
              setDocumentary((current) => ({
                ...current,
                budget: eventChange.target.value as DocumentaryEstimateInput["budget"],
              }))
            }
          >
            <option value="under12">Under £12k</option>
            <option value="twelveTwenty">£12k-£20k</option>
            <option value="twentyForty">£20k-£40k</option>
            <option value="fortyPlus">£40k+</option>
            <option value="unsure">Not sure yet</option>
          </select>
        </Field>

        <Field label="Timeline">
          <select
            value={documentary.timeline}
            onChange={(eventChange) =>
              setDocumentary((current) => ({
                ...current,
                timeline: eventChange.target.value as DocumentaryEstimateInput["timeline"],
              }))
            }
          >
            <option value="withinTwo">Within 2 months</option>
            <option value="twoFour">2-4 months</option>
            <option value="fourSix">4-6 months</option>
            <option value="later">Later this year</option>
            <option value="flexible">Flexible</option>
          </select>
        </Field>

        <Field label="Vision" hint="A short note is enough for now." wide>
          <textarea
            value={documentary.vision}
            onChange={(eventChange) =>
              setDocumentary((current) => ({
                ...current,
                vision: eventChange.target.value,
              }))
            }
            placeholder="What is the story, who is it for, and what should the finished film do?"
          />
        </Field>
      </div>
    </div>
  );
}

function CoachingIntake({
  coaching,
  setCoaching,
}: {
  coaching: CoachingEstimateInput;
  setCoaching: Dispatch<SetStateAction<CoachingEstimateInput>>;
}) {
  return (
    <div className={styles.intakePanel}>
      <div className={styles.panelHeading}>
        <span className={styles.iconFrame}>
          <Sparkles aria-hidden="true" size={22} />
        </span>
        <div>
          <h3>Coaching brief</h3>
          <p>Useful for presenters, founders, podcast hosts and teams preparing to record.</p>
        </div>
      </div>

      <div className={styles.fields}>
        <Field label="Format">
          <select
            value={coaching.format}
            onChange={(eventChange) =>
              setCoaching((current) => ({
                ...current,
                format: eventChange.target.value as CoachingEstimateInput["format"],
              }))
            }
          >
            <option value="singleRemote">Single remote session</option>
            <option value="remoteBlock">Block of 3 remote sessions</option>
            <option value="inPersonRecordingDay">In person on recording day</option>
            <option value="inPersonStandalone">In-person standalone</option>
            <option value="teamWorkshop">Team workshop</option>
            <option value="unsure">Not sure yet</option>
          </select>
        </Field>

        <Field label="Context">
          <select
            value={coaching.context}
            onChange={(eventChange) =>
              setCoaching((current) => ({
                ...current,
                context: eventChange.target.value as CoachingEstimateInput["context"],
              }))
            }
          >
            <option value="podcastHost">Podcast host</option>
            <option value="onCamera">On-camera talent</option>
            <option value="founder">Founder / spokesperson</option>
            <option value="team">Team</option>
            <option value="other">Other</option>
          </select>
        </Field>

        <Field label="Preparing for">
          <select
            value={coaching.preparingFor}
            onChange={(eventChange) =>
              setCoaching((current) => ({
                ...current,
                preparingFor: eventChange.target.value as CoachingEstimateInput["preparingFor"],
              }))
            }
          >
            <option value="podcast">Podcast recording</option>
            <option value="video">Video shoot</option>
            <option value="event">Live event</option>
            <option value="interview">Interview</option>
            <option value="unsure">Not sure yet</option>
          </select>
        </Field>

        <Field label="Location">
          <select
            value={coaching.location}
            onChange={(eventChange) =>
              setCoaching((current) => ({
                ...current,
                location: eventChange.target.value as CoachingEstimateInput["location"],
              }))
            }
          >
            <option value="remote">Remote</option>
            <option value="glasgow">Glasgow</option>
            <option value="outsideGlasgow">Outside Glasgow</option>
            <option value="unsure">Not sure yet</option>
          </select>
        </Field>

        <Field label="Timeline">
          <select
            value={coaching.timeline}
            onChange={(eventChange) =>
              setCoaching((current) => ({
                ...current,
                timeline: eventChange.target.value as CoachingEstimateInput["timeline"],
              }))
            }
          >
            <option value="withinTwo">Within 2 months</option>
            <option value="twoFour">2-4 months</option>
            <option value="fourSix">4-6 months</option>
            <option value="later">Later this year</option>
            <option value="flexible">Flexible</option>
          </select>
        </Field>

        <Field label="Context note" hint="Passed to Kayla before the call." wide>
          <textarea
            value={coaching.extraNotes}
            onChange={(eventChange) =>
              setCoaching((current) => ({
                ...current,
                extraNotes: eventChange.target.value,
              }))
            }
            placeholder="What are you preparing for, and what would you like to feel more confident doing?"
          />
        </Field>
      </div>
    </div>
  );
}

function OtherIntake({
  other,
  setOther,
}: {
  other: OtherEstimateInput;
  setOther: Dispatch<SetStateAction<OtherEstimateInput>>;
}) {
  return (
    <div className={styles.intakePanel}>
      <div className={styles.panelHeading}>
        <span className={styles.iconFrame}>
          <ClipboardList aria-hidden="true" size={22} />
        </span>
        <div>
          <h3>Open brief</h3>
          <p>Use this route when the project does not fit a neat production category yet.</p>
        </div>
      </div>

      <div className={styles.fields}>
        <Field label="Category">
          <select
            value={other.category}
            onChange={(eventChange) =>
              setOther((current) => ({
                ...current,
                category: eventChange.target.value as OtherEstimateInput["category"],
              }))
            }
          >
            <option value="video">Video production</option>
            <option value="ads">Ads / campaign</option>
            <option value="strategy">Strategy</option>
            <option value="mixed">Mixed media</option>
            <option value="unsure">Not sure yet</option>
          </select>
        </Field>

        <Field label="Budget">
          <select
            value={other.budget}
            onChange={(eventChange) =>
              setOther((current) => ({
                ...current,
                budget: eventChange.target.value as OtherEstimateInput["budget"],
              }))
            }
          >
            <option value="under3">Under £3k</option>
            <option value="threeSix">£3k-£6k</option>
            <option value="sixTwelve">£6k-£12k</option>
            <option value="twelveTwenty">£12k-£20k</option>
            <option value="twentyPlus">£20k+</option>
            <option value="unsure">Not sure yet</option>
          </select>
        </Field>

        <Field label="Timeline">
          <select
            value={other.timeline}
            onChange={(eventChange) =>
              setOther((current) => ({
                ...current,
                timeline: eventChange.target.value as OtherEstimateInput["timeline"],
              }))
            }
          >
            <option value="withinTwo">Within 2 months</option>
            <option value="twoFour">2-4 months</option>
            <option value="fourSix">4-6 months</option>
            <option value="later">Later this year</option>
            <option value="flexible">Flexible</option>
          </select>
        </Field>

        <Field label="Outputs" hint="What do you think you need at the end?" wide>
          <textarea
            value={other.outputs}
            onChange={(eventChange) =>
              setOther((current) => ({
                ...current,
                outputs: eventChange.target.value,
              }))
            }
            placeholder="For example: a campaign film, podcast clips, a launch video, a strategy sprint..."
          />
        </Field>

        <Field label="Anything else?" hint="Passed to the team with the brief." wide>
          <textarea
            value={other.extraNotes}
            onChange={(eventChange) =>
              setOther((current) => ({
                ...current,
                extraNotes: eventChange.target.value,
              }))
            }
            placeholder="Audience, deadline, references, platforms, constraints..."
          />
        </Field>
      </div>
    </div>
  );
}
