import {
  coachingRateCards,
  documentaryRateCards,
  eventAddOns,
  eventDayRates,
  eventGimbalRate,
  eventThreeCameraGimbalPackage,
  podcastAddOns,
  podcastPackages,
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
  eventDate: string;
  extraNotes: string;
};

export type DocumentaryEstimateInput = {
  scale: "short" | "feature" | "complex" | "unsure";
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

const budgetBands: Record<PodcastEstimateInput["budget"], { min: number; max: number | null } | null> = {
  under3: { min: 0, max: 3000 },
  threeSix: { min: 3000, max: 6000 },
  sixTwelve: { min: 6000, max: 12000 },
  twelveTwenty: { min: 12000, max: 20000 },
  twentyPlus: { min: 20000, max: null },
  unsure: null,
};

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

  if (input.episodes === "ongoing") {
    return {
      range: podcastPackages.ongoing,
      label: podcastPackages.ongoing.label,
      note: podcastPackages.ongoing.note,
      complexFlags: flags,
    };
  }

  if (input.episodes === "threeFive") {
    const multiplier = count / 3;
    return {
      range: multiplyRange(podcastPackages.pilot, multiplier),
      label: podcastPackages.pilot.label,
      note: `${podcastPackages.pilot.note} Scaled from the 3-episode workbook rate for the 3-5 episode band.`,
      complexFlags: flags,
    };
  }

  const canUseOutsidePackage =
    input.location === "outsideGlasgow" &&
    count <= 10 &&
    input.episodeLength !== "under20" &&
    input.episodeLength !== "twentyForty";

  if (canUseOutsidePackage) {
    const multiplier = count / 6;
    return {
      range: multiplyRange(podcastPackages.outsideGlasgow, multiplier),
      label: podcastPackages.outsideGlasgow.label,
      note: count === 6 ? podcastPackages.outsideGlasgow.note : `${podcastPackages.outsideGlasgow.note} Scaled from the 6-episode workbook rate.`,
      complexFlags: flags,
    };
  }

  let packageRate = podcastPackages.standardCadence;
  if (input.cadence === "batch" && (input.episodeLength === "under20" || input.episodeLength === "twentyForty")) {
    packageRate = podcastPackages.starterBatch;
  }

  if (input.episodeLength === "fortySixty" || input.episodeLength === "sixtyPlus") {
    packageRate = podcastPackages.extended;
  }

  const multiplier = count / 6;
  return {
    range: count === 6 ? packageRate : multiplyRange(packageRate, multiplier),
    label: packageRate.label,
    note: count === 6 ? packageRate.note : `${packageRate.note} Scaled from the 6-episode workbook rate.`,
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

function budgetNote(input: PodcastEstimateInput, range: MoneyRange): string | null {
  const band = budgetBands[input.budget];
  if (!band) return null;

  if (band.max !== null && range.low > band.max) {
    return "Your rough budget sits below this estimate, so the call should cover scope options.";
  }

  if (range.high < band.min) {
    return "Your rough budget appears to have headroom for the selected scope.";
  }

  return "Your rough budget overlaps this estimate.";
}

export function estimatePodcast(input: PodcastEstimateInput): EstimateResult {
  const base = estimatePodcastBase(input);
  const addOns = estimatePodcastAddOns(input);
  const range = addRanges(base.range, addOns.range);
  const notes = [base.note];
  const budget = budgetNote(input, range);
  if (budget) notes.push(budget);

  if (input.timeline === "withinTwo") {
    notes.push("Within 2 months is a fast launch window and should be checked on the call.");
  }

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
    input.episodeLength !== "sixtyPlus" &&
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

  return {
    range,
    baseLabel: input.cameras === "unsure" ? "Event filming" : eventDayRates[input.cameras]?.label ?? "Event filming",
    includes,
    notIncluded: input.location === "glasgow" ? [] : ["Travel costs confirmed before the kick-off call."],
    flags,
    notes,
    depositEligible: Boolean(range) && !requiresCall,
    primaryCta: "Book your free 30-min kick-off call",
  };
}

export function estimateDocumentary(input: DocumentaryEstimateInput): EstimateResult {
  const selectedRate =
    input.scale === "unsure"
      ? documentaryRateCards[0]
      : documentaryRateCards.find((rate) => rate.id === input.scale) ?? documentaryRateCards[0];
  const flags = ["Documentary production is always quoted individually after a production conversation."];
  const notes = [selectedRate.note];
  const includes = [selectedRate.label];
  const notIncluded: string[] = [];

  if (input.location === "multiLocation") {
    flags.push("Multi-location production can move this beyond the starting range.");
  }

  if (input.location === "singleOutsideGlasgow") {
    notIncluded.push("Travel and location costs are confirmed on the call.");
  }

  if (input.contributors === "sixPlus") {
    flags.push("Six or more contributors usually needs extra research, scheduling, and release planning.");
  }

  if (input.budget === "under12") {
    flags.push("The workbook minimum for documentary work starts at £12,000.");
  }

  if (input.timeline === "withinTwo") {
    notes.push("Within 2 months is a fast documentary window and should be checked on the call.");
  }

  if (input.vision.trim()) {
    notes.push("Your vision note will go into the documentary brief.");
  }

  const range =
    input.scale === "unsure"
      ? { low: 12000, high: 12000, qualifier: "minimum starting point" }
      : {
          low: selectedRate.low,
          high: selectedRate.high,
          qualifier: selectedRate.qualifier,
        };

  return {
    range,
    baseLabel: selectedRate.label,
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
