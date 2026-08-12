import {
  coachingRateCards,
  eventAddOns,
  eventDayRates,
  eventGimbalRate,
  eventThreeCameraGimbalPackage,
  podcastAddOns,
  podcastPerEpisodePostProduction,
  podcastPostProduction,
  type MoneyRange,
} from "@/data/pricing";

export type ServiceChoice = "podcast" | "event" | "musicVideo" | "coaching" | "documentary" | "other";

export type PodcastEstimateInput = {
  need: "full" | "post";
  episodes: "threeFive" | "sixEight" | "nineEleven" | "twelvePlus" | "ongoing" | "unsure";
  episodeLength: "under20" | "twentyForty" | "fortySixty" | "sixtyPlus" | "unsure";
  location: "glasgowOffice" | "glasgowClient" | "outsideGlasgow" | "remote" | "unsure";
  cadence: "batch" | "regular" | "mixed" | "unsure";
  productionDepth: "light" | "standard" | "full";
  addOns: string[];
  socialClipCount: number;
  coachingSessions: number;
  budget: "under3" | "threeSix" | "sixTwelve" | "twelveTwenty" | "twentyPlus" | "unsure";
  timeline: "withinTwo" | "twoFour" | "fourSix" | "later" | "flexible";
};

export type EventEstimateInput = {
  duration: "half" | "full" | "multi" | "unsure";
  location: "glasgow" | "outsideGlasgow" | "outsideScotland";
  cameras: "oneCamera" | "twoCameras" | "threeCameras" | "unsure";
  addGimbal: boolean;
  complexEdit: boolean;
  overviewVideo: boolean;
  socialClipCount: number;
  rawFootage: boolean;
  budget: "under1500" | "fifteenThree" | "threeSix" | "sixPlus" | "unsure";
  eventDate: string;
  extraNotes: string;
};

export type DocumentaryEstimateInput = {
  length: "under30" | "fortyFiveNinety" | "complex" | "unsure";
  vision: string;
  location: "singleGlasgow" | "singleOutsideGlasgow" | "multiLocation" | "unsure";
  contributors: "oneTwo" | "threeFive" | "sixPlus" | "unsure";
  budget: "under12" | "twelveTwenty" | "twentyForty" | "fortyPlus" | "unsure";
  timeline: PodcastEstimateInput["timeline"];
};

export type CoachingEstimateInput = {
  format: "singleRemote" | "remoteBlock" | "inPersonRecordingDay" | "inPersonStandalone" | "teamWorkshop" | "unsure";
  context: "podcastHost" | "onCamera" | "founder" | "team" | "other";
  preparingFor: "podcast" | "video" | "event" | "interview" | "unsure";
  location: "remote" | "glasgow" | "outsideGlasgow" | "unsure";
  timeline: PodcastEstimateInput["timeline"];
  extraNotes: string;
};

export type OtherEstimateInput = {
  category: "video" | "ads" | "musicVideo" | "strategy" | "mixed" | "unsure";
  outputs: string;
  budget: PodcastEstimateInput["budget"];
  timeline: PodcastEstimateInput["timeline"];
  extraNotes: string;
};

export type EstimateResult = {
  range: MoneyRange | null;
  baseLabel: string;
  includes: string[];
  notIncluded: string[];
  flags: string[];
  notes: string[];
  depositEligible: boolean;
  primaryCta: string;
};

const episodeCounts: Record<PodcastEstimateInput["episodes"], number> = {
  threeFive: 4,
  sixEight: 7,
  nineEleven: 10,
  twelvePlus: 12,
  ongoing: 1,
  unsure: 7,
};

type Band = { min: number; max: number | null } | null;

const budgetBands: Record<PodcastEstimateInput["budget"], Band> = {
  under3: { min: 0, max: 3000 },
  threeSix: { min: 3000, max: 6000 },
  sixTwelve: { min: 6000, max: 12000 },
  twelveTwenty: { min: 12000, max: 20000 },
  twentyPlus: { min: 20000, max: null },
  unsure: null,
};

const documentaryBudgetBands: Record<DocumentaryEstimateInput["budget"], Band> = {
  under12: { min: 0, max: 12000 },
  twelveTwenty: { min: 12000, max: 20000 },
  twentyForty: { min: 20000, max: 40000 },
  fortyPlus: { min: 40000, max: null },
  unsure: null,
};

const eventBudgetBands: Record<EventEstimateInput["budget"], Band> = {
  under1500: { min: 0, max: 1500 },
  fifteenThree: { min: 1500, max: 3000 },
  threeSix: { min: 3000, max: 6000 },
  sixPlus: { min: 6000, max: null },
  unsure: null,
};

/** True when the customer's rough budget ceiling sits below the estimate — i.e.
 *  they can't afford the selected scope, so we scope it on a call instead. */
function budgetBelowEstimate(band: Band, range: MoneyRange | null): boolean {
  return !!band && band.max !== null && !!range && range.low > band.max;
}

/** A "Scoped on call" result (no price shown), used whenever a note forces the
 *  whole estimate onto a conversation regardless of the other selections. */
function scopedOnCall(baseLabel: string, reason: string, extraNotes: string[] = []): EstimateResult {
  return {
    range: null,
    baseLabel,
    includes: [baseLabel],
    notIncluded: [],
    flags: [reason],
    notes: [reason, ...extraNotes],
    depositEligible: false,
    primaryCta: "Your project needs a conversation first",
  };
}

function addRanges(...ranges: MoneyRange[]): MoneyRange {
  return ranges.reduce(
    (total, range) => ({
      low: total.low + range.low,
      high: total.high + range.high,
      qualifier: total.qualifier ?? range.qualifier,
    }),
    { low: 0, high: 0 } as MoneyRange,
  );
}

function multiplyRange(range: MoneyRange, multiplier: number): MoneyRange {
  return {
    low: Math.round((range.low * multiplier) / 50) * 50,
    high: Math.round((range.high * multiplier) / 50) * 50,
    qualifier: range.qualifier,
  };
}

// Full-production podcast pricing as an exact grid: episode band × length band.
// (Post-production only, add-ons, budget/launch and 60+ min are layered on
// separately.) 60+ min and 9-11/12+ episodes are scoped on a call.
const PODCAST_FULL_GRID = {
  single: { under20: { low: 1200, high: 2000 }, twentyForty: { low: 1700, high: 2750 }, fortySixty: { low: 2000, high: 3250 } },
  threeFive: { under20: { low: 3500, high: 5000 }, twentyForty: { low: 5500, high: 7000 }, fortySixty: { low: 6500, high: 8000 } },
  sixEight: { under20: { low: 6000, high: 8000 }, twentyForty: { low: 8500, high: 11000 }, fortySixty: { low: 10000, high: 13000 } },
} as const;

function podcastEpisodeBand(episodes: PodcastEstimateInput["episodes"]): "single" | "threeFive" | "sixEight" | "scale" {
  if (episodes === "ongoing") return "single";
  if (episodes === "threeFive") return "threeFive";
  if (episodes === "sixEight" || episodes === "unsure") return "sixEight";
  return "scale"; // nineEleven, twelvePlus → scaled up from the 6-8 band
}

function estimatePodcastBase(input: PodcastEstimateInput): {
  range: MoneyRange;
  label: string;
  note: string;
  complexFlags: string[];
} {
  const count = episodeCounts[input.episodes];
  const flags: string[] = [];

  if (input.episodes === "nineEleven") {
    flags.push("9-11 episodes should be checked on a call.");
  }

  if (input.episodes === "twelvePlus") {
    flags.push("12+ episodes should be scoped on a call.");
  }

  if (input.episodes === "ongoing") {
    flags.push("Ongoing production should be scoped on a call.");
  }

  if (input.episodeLength === "sixtyPlus") {
    flags.push("60+ minute episodes are complex and need a call.");
  }

  if (input.location === "outsideGlasgow") {
    flags.push("Travel is not included in the website estimate.");
  }

  if (input.location === "unsure" || input.episodes === "unsure" || input.episodeLength === "unsure") {
    flags.push("A few details are still unknown, so this is a starting estimate.");
  }

  if (input.need === "post") {
    if (input.episodes === "ongoing") {
      return {
        range: podcastPerEpisodePostProduction,
        label: podcastPerEpisodePostProduction.label,
        note: podcastPerEpisodePostProduction.note,
        complexFlags: flags,
      };
    }

    const packageRate = podcastPostProduction[input.productionDepth];
    const multiplier = count / 6;
    return {
      range: count === 6 ? packageRate : multiplyRange(packageRate, multiplier),
      label: packageRate.label,
      note: count === 6 ? packageRate.note : `${packageRate.note} Scaled from the 6-episode workbook rate.`,
      complexFlags: flags,
    };
  }

  // Full production: exact bracket ranges by episode band × length band.
  // (60+ min is mapped here only for completeness — estimatePodcast forces it
  // onto a call before this range is ever shown.)
  const lengthKey: "under20" | "twentyForty" | "fortySixty" =
    input.episodeLength === "under20"
      ? "under20"
      : input.episodeLength === "fortySixty" || input.episodeLength === "sixtyPlus"
        ? "fortySixty"
        : "twentyForty";
  const epBand = podcastEpisodeBand(input.episodes);
  const gridRange =
    epBand === "scale"
      ? multiplyRange({ ...PODCAST_FULL_GRID.sixEight[lengthKey] }, count / 7)
      : { ...PODCAST_FULL_GRID[epBand][lengthKey] };

  return {
    range: gridRange,
    label: "Full production",
    note: "Full production (recording and edit) for the selected number and length of episodes.",
    complexFlags: flags,
  };
}

function estimatePodcastAddOns(input: PodcastEstimateInput): {
  range: MoneyRange;
  included: string[];
  notIncluded: string[];
} {
  const ranges: MoneyRange[] = [];
  const included: string[] = [];
  const notIncluded: string[] = [];
  const count = episodeCounts[input.episodes];

  for (const addOnId of input.addOns) {
    const addOn = podcastAddOns.find((item) => item.id === addOnId);
    if (!addOn) {
      if (addOnId === "coverArt") notIncluded.push("Cover art - partner service interest only.");
      if (addOnId === "marketing") notIncluded.push("Marketing and launch - partner service interest only.");
      continue;
    }

    let multiplier = 1;
    if (addOn.id === "projectManagement" || addOn.id === "guestResearch") {
      multiplier = count;
    }
    if (addOn.id === "socialClips") {
      multiplier = Math.max(0, input.socialClipCount);
    }
    if (addOn.id === "coachingRemote") {
      multiplier = Math.max(1, input.coachingSessions);
    }

    ranges.push(multiplyRange(addOn, multiplier));
    included.push(multiplier > 1 ? `${addOn.label} x ${multiplier}` : addOn.label);
  }

  return {
    range: addRanges(...ranges),
    included,
    notIncluded,
  };
}

export function estimatePodcast(input: PodcastEstimateInput): EstimateResult {
  const base = estimatePodcastBase(input);
  const addOns = estimatePodcastAddOns(input);
  const range = addRanges(base.range, addOns.range);

  // Note 3: cover art + marketing/launch are scoped separately, not in the price.
  const extrasSelected = input.addOns.some((id) => id === "coverArt" || id === "marketing");
  const extrasNote = extrasSelected
    ? "Cover art and marketing/launch are add-on extras, scoped separately on a call — the price shown doesn't include them."
    : null;
  const extra = extrasNote ? [extrasNote] : [];

  // Notes 5, 2, 1 — force "Scoped on call" regardless of everything else.
  if (input.episodeLength === "sixtyPlus") {
    return scopedOnCall(base.label, "60+ minute episodes are complex, so this is scoped on a call.", extra);
  }
  if (input.timeline === "withinTwo") {
    return scopedOnCall(base.label, "A launch within 2 months is a fast window, so this is scoped on a call.", extra);
  }
  if (budgetBelowEstimate(budgetBands[input.budget], range)) {
    return scopedOnCall(base.label, "Your rough budget sits below this scope, so it's best scoped on a call.", extra);
  }

  const notes = [base.note, ...extra];

  if (input.location === "outsideGlasgow") {
    notes.push("Outside Glasgow travel is charged at 60p/mile plus £30-£40/hr travel time.");
  }

  const unknowns = [input.episodes, input.episodeLength, input.location, input.cadence].filter(
    (value) => value === "unsure",
  ).length;
  const count = episodeCounts[input.episodes];
  const requiresCall = base.complexFlags.length > 0 || unknowns >= 2;
  const depositEligible =
    !requiresCall &&
    count < 10 &&
    (input.need === "post" || input.location === "glasgowOffice" || input.location === "glasgowClient");

  return {
    range,
    baseLabel: base.label,
    includes: [base.label, ...addOns.included],
    notIncluded: addOns.notIncluded,
    flags: base.complexFlags,
    notes,
    depositEligible,
    primaryCta: requiresCall ? "Your project needs a conversation first" : "Book your free 30-min kick-off call",
  };
}

function isEventWithinTwoWeeks(eventDate: string): boolean {
  if (!eventDate) return false;
  const selected = new Date(`${eventDate}T12:00:00`);
  if (Number.isNaN(selected.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = selected.getTime() - today.getTime();
  return diff >= 0 && diff <= 14 * 24 * 60 * 60 * 1000;
}

export function estimateEvent(input: EventEstimateInput): EstimateResult {
  const flags: string[] = [];
  const notes: string[] = [
    "Standard edited event video is included in the filming day rate.",
    "Promotional offers are not baked into this estimate; if an active promo applies, Plistic will apply it separately once the scope is confirmed.",
  ];
  const ranges: MoneyRange[] = [];
  const includes: string[] = [];

  if (input.duration === "multi") {
    flags.push("Multi-day events need an individual quote.");
  }

  if (input.duration === "unsure") {
    flags.push("Event duration is still unknown.");
  }

  if (input.cameras === "unsure") {
    flags.push("Camera setup needs Plistic advice.");
  }

  if (input.location !== "glasgow") {
    flags.push("Travel is not included in the website estimate.");
    notes.push("Outside Glasgow travel is charged at 60p/mile plus £30-£40/hr travel time.");
  }

  if (isEventWithinTwoWeeks(input.eventDate)) {
    flags.push("The event is within 2 weeks, so availability needs to be checked.");
  }

  const durationKey = input.duration === "half" ? "half" : "full";

  if (input.cameras !== "unsure" && input.duration !== "multi" && input.duration !== "unsure") {
    if (input.cameras === "threeCameras" && input.addGimbal) {
      const packageRate = eventThreeCameraGimbalPackage[durationKey];
      ranges.push(packageRate);
      includes.push(eventThreeCameraGimbalPackage.label);
    } else {
      const cameraRate = eventDayRates[input.cameras][durationKey];
      ranges.push(cameraRate);
      includes.push(eventDayRates[input.cameras].label);

      if (input.addGimbal) {
        ranges.push(eventGimbalRate);
        includes.push(eventGimbalRate.label);
      }
    }
  }

  if (input.complexEdit) {
    ranges.push(eventAddOns.complexEdit);
    includes.push(eventAddOns.complexEdit.label);
  }

  if (input.overviewVideo) {
    ranges.push(eventAddOns.overviewVideo);
    includes.push(eventAddOns.overviewVideo.label);
  }

  if (input.socialClipCount > 0) {
    ranges.push(multiplyRange(eventAddOns.socialClips, input.socialClipCount));
    includes.push(`${eventAddOns.socialClips.label} x ${input.socialClipCount}`);
  }

  if (input.rawFootage) {
    ranges.push(eventAddOns.rawFootage);
    includes.push(eventAddOns.rawFootage.label);
  }

  if (input.extraNotes.trim()) {
    notes.push("Your extra brief notes will be passed to the production team.");
  }

  const range = ranges.length > 0 ? addRanges(...ranges) : null;
  const requiresCall = flags.length > 0;
  const eventLabel = input.cameras === "unsure" ? "Event filming" : eventDayRates[input.cameras]?.label ?? "Event filming";

  // Note 1: budget below the estimate → scope on call, regardless of the rest.
  if (budgetBelowEstimate(eventBudgetBands[input.budget], range)) {
    return scopedOnCall(eventLabel, "Your rough budget sits below this scope, so it's best scoped on a call.");
  }

  return {
    range,
    baseLabel: eventLabel,
    includes,
    notIncluded: input.location === "glasgow" ? [] : ["Travel costs confirmed before the kick-off call."],
    flags,
    notes,
    depositEligible: Boolean(range) && !requiresCall,
    primaryCta: "Book your free 30-min kick-off call",
  };
}

// Documentary base range as a grid: length × location. Complex / multi-location
// (either box) is always £40,000+.
const DOCUMENTARY_GRID = {
  singleGlasgow: { under30: { low: 12000, high: 20000 }, fortyFiveNinety: { low: 20000, high: 30000 } },
  singleOutsideGlasgow: { under30: { low: 20000, high: 30000 }, fortyFiveNinety: { low: 30000, high: 40000 } },
} as const;

export function estimateDocumentary(input: DocumentaryEstimateInput): EstimateResult {
  const baseLabel = "Documentary production";
  const flags = ["Documentary production is always quoted individually after a production conversation."];
  const notes: string[] = [];
  const includes = [baseLabel];
  const notIncluded: string[] = [];

  if (input.location === "singleOutsideGlasgow") {
    notIncluded.push("Travel and location costs are confirmed on the call.");
  }
  if (input.contributors === "sixPlus") {
    flags.push("Six or more contributors usually needs extra research, scheduling, and release planning.");
  }
  if (input.vision.trim()) {
    notes.push("Your vision note will go into the documentary brief.");
  }

  // £40,000+ whenever the length box is "complex / multi-location", or the
  // production spans multiple locations — regardless of everything else.
  let range: MoneyRange;
  if (input.length === "complex" || input.location === "multiLocation") {
    range = { low: 40000, high: 40000, plus: true };
  } else if (input.length === "unsure" || input.location === "unsure") {
    range = { low: 12000, high: 20000, qualifier: "starting point" };
    notes.push("A couple of details are still open, so this is a starting range.");
  } else {
    // input.length is now narrowed to "under30" | "fortyFiveNinety".
    const loc = input.location === "singleOutsideGlasgow" ? "singleOutsideGlasgow" : "singleGlasgow";
    range = { ...DOCUMENTARY_GRID[loc][input.length] };
  }

  // Note 6: within 2 months → scope on call, regardless of everything else.
  if (input.timeline === "withinTwo") {
    return scopedOnCall(baseLabel, "A documentary within 2 months is a fast window, so this is scoped on a call.");
  }
  // Note 1: budget below the estimate → scope on call.
  if (budgetBelowEstimate(documentaryBudgetBands[input.budget], range)) {
    return scopedOnCall(baseLabel, "Your rough budget sits below this scope, so it's best scoped on a call.");
  }

  return {
    range,
    baseLabel,
    includes,
    notIncluded,
    flags,
    notes,
    depositEligible: false,
    primaryCta: "Your project needs a conversation first",
  };
}

export function estimateCoaching(input: CoachingEstimateInput): EstimateResult {
  const selectedRate = coachingRateCards.find((rate) => rate.id === input.format);
  const flags = ["Coaching pricing is confirmed on call after the context and format are reviewed."];
  const notes = selectedRate ? [selectedRate.note] : ["Use the short brief to tell us what you are preparing for."];
  const includes = [selectedRate?.label ?? "Format to confirm"];
  const notIncluded: string[] = [];

  if (input.format === "inPersonRecordingDay") {
    notIncluded.push("Travel from St Andrews may apply if not already part of a filming day.");
  }

  if (input.format === "teamWorkshop" && input.location === "outsideGlasgow") {
    notIncluded.push("Outside Glasgow travel is confirmed on the call.");
  }

  if (input.location === "outsideGlasgow") {
    flags.push("Travel is not included in the website estimate.");
  }

  if (input.timeline === "withinTwo") {
    notes.push("Within 2 months is a fast preparation window and should be checked on the call.");
  }

  if (input.extraNotes.trim()) {
    notes.push("Your extra context will be passed to Kayla before the call.");
  }

  return {
    range: null,
    baseLabel: selectedRate?.label ?? "Coaching",
    includes,
    notIncluded,
    flags,
    notes,
    depositEligible: false,
    primaryCta: "Book your free 30-min kick-off call",
  };
}

export function estimateOther(input: OtherEstimateInput): EstimateResult {
  const isMusicVideo = input.category === "musicVideo";
  const notes = [
    isMusicVideo
      ? "Music videos are scoped around creative concept, locations, crew, edit complexity, and delivery needs."
      : "This route is for briefs that do not fit a neat production category yet.",
  ];
  const includes = [input.category === "unsure" ? "Category to define" : isMusicVideo ? "Music video brief" : "Open brief"];

  if (input.outputs.trim()) {
    includes.push("Output note added");
  }

  if (input.extraNotes.trim()) {
    notes.push("Your extra notes will be passed to the team with the brief.");
  }

  if (input.timeline === "withinTwo") {
    notes.push("Within 2 months is a fast delivery window and should be checked on the call.");
  }

  return {
    range: null,
    baseLabel: isMusicVideo ? "Music video" : "Open brief",
    includes,
    notIncluded: [],
    flags: [
      isMusicVideo
        ? "A music video needs a production call to confirm creative scope, schedule, and crew."
        : "Plistic will shape the right route once the production goal is clearer.",
    ],
    notes,
    depositEligible: false,
    primaryCta: "Book your free 30-min kick-off call",
  };
}
