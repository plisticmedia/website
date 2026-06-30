export type MoneyRange = {
  low: number;
  high: number;
  qualifier?: string;
};

export type RateItem = {
  id: string;
  label: string;
  low: number;
  high: number;
  note: string;
};

export type RateCardItem = RateItem & {
  range: string;
  qualifier?: string;
};

export const podcastPackages = {
  starterBatch: {
    label: "Starter - batch, short episodes",
    low: 6000,
    high: 8000,
    note: "6 episodes, about 20 minutes each, recorded over 2 batch days.",
  },
  standardCadence: {
    label: "Standard - regular cadence, mid-length",
    low: 8500,
    high: 11000,
    note: "6 episodes, 30-45 minutes each, recorded over 3-4 days.",
  },
  extended: {
    label: "Extended - longer or more complex",
    low: 10000,
    high: 13000,
    note: "6 episodes, 45-60 minutes each, 4+ recording days.",
  },
  outsideGlasgow: {
    label: "Outside Glasgow package",
    low: 12500,
    high: 18000,
    note: "6 episodes, client site or travel-led recording.",
  },
  pilot: {
    label: "Pilot - proof of concept",
    low: 3500,
    high: 5000,
    note: "3 episodes, about 30 minutes each, 1-2 recording days.",
  },
  ongoing: {
    label: "Ongoing / per episode",
    low: 1200,
    high: 2000,
    note: "Per episode starting rate for ongoing production.",
    qualifier: "per episode",
  },
} satisfies Record<string, MoneyRange & { label: string; note: string }>;

export const podcastPostProduction = {
  light: {
    label: "Light edit",
    low: 1200,
    high: 1800,
    note: "6 episodes. Multi-cam sync, clean edit, colour balance, export.",
  },
  standard: {
    label: "Standard edit",
    low: 1800,
    high: 2200,
    note: "6 episodes. Adds audio mastering, chapter markers, and thumbnail.",
  },
  full: {
    label: "Full production",
    low: 2200,
    high: 2500,
    note: "6 episodes. Adds graphics, intro/outro, colour grade, and music.",
  },
} satisfies Record<string, MoneyRange & { label: string; note: string }>;

export const podcastPerEpisodePostProduction = {
  label: "Per episode post-production",
  low: 200,
  high: 420,
  note: "Per episode rate for any quantity or production depth.",
  qualifier: "per episode",
} satisfies MoneyRange & { label: string; note: string };

export const podcastAddOns: RateItem[] = [
  {
    id: "storyboarding",
    label: "Storyboarding / series planning",
    low: 500,
    high: 800,
    note: "Per series flat rate.",
  },
  {
    id: "audienceResearch",
    label: "Audience and strategy research",
    low: 150,
    high: 300,
    note: "Per series. Audience profiling, adjacent-show analysis, release cadence, and format recommendation.",
  },
  {
    id: "projectManagement",
    label: "Project management",
    low: 200,
    high: 200,
    note: "Per episode. Guest booking, call sheets, scheduling, and comms.",
  },
  {
    id: "guestResearch",
    label: "Guest research + show notes",
    low: 100,
    high: 150,
    note: "Per episode.",
  },
  {
    id: "socialClips",
    label: "Social media clips + BTS",
    low: 50,
    high: 50,
    note: "Per clip.",
  },
  {
    id: "coachingRemote",
    label: "Host coaching - remote",
    low: 75,
    high: 75,
    note: "Per 60-minute session.",
  },
  {
    id: "coachingInPerson",
    label: "Host coaching - in person on recording day",
    low: 200,
    high: 200,
    note: "Per day. Travel from St Andrews may apply.",
  },
  {
    id: "podcastSeo",
    label: "Podcast SEO",
    low: 500,
    high: 500,
    note: "Per podcast / year.",
  },
  {
    id: "distribution",
    label: "Distribution setup + management",
    low: 200,
    high: 200,
    note: "Per podcast / year.",
  },
  {
    id: "analytics",
    label: "Analytics and reporting",
    low: 200,
    high: 200,
    note: "Per podcast / year.",
  },
  {
    id: "introOutro",
    label: "Intro / outro creation",
    low: 200,
    high: 200,
    note: "Per series flat rate.",
  },
];

export const podcastInterestOnlyAddOns = [
  "Cover art",
  "Marketing and launch",
];

export const eventDayRates = {
  oneCamera: {
    label: "1 camera, standard kit",
    full: { low: 1200, high: 2000 },
    half: { low: 720, high: 1200 },
    note: "Single operator, standard kit.",
  },
  twoCameras: {
    label: "2 cameras",
    full: { low: 1600, high: 2500 },
    half: { low: 960, high: 1600 },
    note: "Two operators or one operator plus static second camera.",
  },
  threeCameras: {
    label: "3 cameras",
    full: { low: 2000, high: 3000 },
    half: { low: 1200, high: 2000 },
    note: "Full crew. Confirm availability first.",
  },
} satisfies Record<string, { label: string; full: MoneyRange; half: MoneyRange; note: string }>;

export const eventGimbalRate = {
  label: "Gimbal add-on",
  low: 300,
  high: 500,
  note: "Added to any camera setup.",
} satisfies MoneyRange & { label: string; note: string };

export const eventThreeCameraGimbalPackage = {
  label: "3 cameras + gimbal",
  full: { low: 2500, high: 3500 },
  half: { low: 1500, high: 2500 },
  note: "Maximum complexity. Quote individually for large events.",
};

export const eventAddOns = {
  complexEdit: {
    id: "complexEdit",
    label: "Complex edit uplift",
    low: 400,
    high: 600,
    note: "Fixed add-on for long events, heavy graphics, multiple inserts, or extra source types.",
  },
  overviewVideo: {
    id: "overviewVideo",
    label: "Overview / ad video - 5 mins",
    low: 300,
    high: 500,
    note: "Punchy standalone overview for social, web, or promotion.",
  },
  socialClips: {
    id: "socialClips",
    label: "Social clips",
    low: 30,
    high: 30,
    note: "Per clip.",
  },
  rawFootage: {
    id: "rawFootage",
    label: "Raw footage delivery",
    low: 100,
    high: 100,
    note: "Flat rate.",
  },
} satisfies Record<string, RateItem>;

export const coachingRateCards: RateCardItem[] = [
  {
    id: "singleRemote",
    label: "Single remote session",
    low: 75,
    high: 75,
    range: "£75",
    note: "Kayla delivers remotely. No travel cost.",
  },
  {
    id: "remoteBlock",
    label: "Block of 3 remote sessions",
    low: 200,
    high: 200,
    range: "£200",
    note: "10% discount on 3 sessions, rounded to £200.",
  },
  {
    id: "inPersonRecordingDay",
    label: "In-person on recording day",
    low: 200,
    high: 200,
    range: "£200",
    note: "Kayla on site for the full filming day. Add travel from St Andrews if applicable.",
  },
  {
    id: "inPersonStandalone",
    label: "In-person standalone",
    low: 450,
    high: 500,
    range: "£450-£500",
    note: "Per half day. Includes travel from St Andrews up to the Glasgow assumptions in the workbook.",
  },
  {
    id: "teamWorkshop",
    label: "Team workshop",
    low: 800,
    high: 1200,
    range: "£800-£1,200",
    note: "Half day, up to 6 people. Add travel if outside Glasgow.",
  },
  {
    id: "kaylaTravel",
    label: "Kayla travel Glasgow from St Andrews",
    low: 60,
    high: 90,
    range: "£60-£90",
    note: "Per trip. Only offered combined with a filming day or half-day session minimum.",
  },
];

export const documentaryRateCards: RateCardItem[] = [
  {
    id: "short",
    label: "Short documentary",
    low: 12000,
    high: 20000,
    range: "£12,000-£20,000",
    note: "Under 30 mins. Minimum starting point. Always quote individually.",
  },
  {
    id: "feature",
    label: "Feature documentary",
    low: 20000,
    high: 40000,
    range: "£20,000-£40,000",
    note: "45-90 mins. Depends on locations, contributors, and archive material.",
  },
  {
    id: "complex",
    label: "Complex / multi-location",
    low: 40000,
    high: 40000,
    range: "From £40,000",
    qualifier: "starting point",
    note: "Any length. Quote on call only. No ceiling.",
  },
];

export const coachingRates = coachingRateCards
  .filter((rate) => rate.id !== "kaylaTravel")
  .map(({ label, range }) => ({ label, range }));

export const documentaryRates = documentaryRateCards.map(({ label, range }) => ({ label, range }));
