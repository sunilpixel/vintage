export type Car = {
  id: string;
  index: string;
  name: string;
  sub: string;
  year: string;
  engine: string;
  power: string;
  country: string;
  img: string;
  /** detail plate shown in the lower frame of The Collection */
  detail: string;
  detailCap: string;
  /** one line read while the car is active */
  note: string;
  /** object-position of the plate */
  focus?: string;
};

export const CARS: Car[] = [
  {
    id: "etype",
    index: "01",
    name: "Jaguar E-Type",
    sub: "Series 1 roadster",
    year: "1961",
    engine: "3.8 L straight-six",
    power: "265 hp",
    country: "United Kingdom",
    img: "/img/car_etype.jpg",
    detail: "/img/machine_engine.jpg",
    detailCap: "Straight-six, triple SU carburettors",
    note: "Enzo Ferrari called it the most beautiful car ever made. Ours has never been apart.",
    focus: "50% 55%",
  },
  {
    id: "300sl",
    index: "02",
    name: "Mercedes-Benz 300 SL",
    sub: "Gullwing coupé",
    year: "1955",
    engine: "3.0 L straight-six",
    power: "215 hp",
    country: "Germany",
    img: "/img/car_300sl.jpg",
    detail: "/img/machine_chrome.jpg",
    detailCap: "Side vents — hand-polished brightwork",
    note: "The first car in the collection. It arrived at the coach house in the spring of 1958.",
    focus: "50% 42%",
  },
  {
    id: "356",
    index: "03",
    name: "Porsche 356 Speedster",
    sub: "Pre-A, 1500 Super",
    year: "1957",
    engine: "1.6 L flat-four",
    power: "75 hp",
    country: "Germany",
    img: "/img/car_356.jpg",
    detail: "/img/machine_wheel.jpg",
    detailCap: "Wire wheel, knock-off hub",
    note: "Seventy-five horsepower and nothing to carry. Still the lightest thing we own.",
    focus: "50% 55%",
  },
  {
    id: "db5",
    index: "04",
    name: "Aston Martin DB5",
    sub: "Silver Birch saloon",
    year: "1963",
    engine: "4.0 L straight-six",
    power: "282 hp",
    country: "United Kingdom",
    img: "/img/car_db5.jpg",
    detail: "/img/machine_steering.jpg",
    detailCap: "Wood-rim wheel, polished spokes",
    note: "Silver Birch over red Connolly hide. Driven to Goodwood every September.",
    focus: "50% 55%",
  },
  {
    id: "250",
    index: "05",
    name: "Ferrari 250 GT California",
    sub: "SWB Spyder",
    year: "1960",
    engine: "3.0 L Colombo V12",
    power: "240 hp",
    country: "Italy",
    img: "/img/car_250.jpg",
    detail: "/img/machine_seat.jpg",
    detailCap: "Cognac hide, hand-stitched",
    note: "Twelve cylinders, one open road. The car that made a mechanic out of a boy.",
    focus: "50% 55%",
  },
  {
    id: "3500gt",
    index: "06",
    name: "Maserati 3500 GT",
    sub: "Touring Superleggera",
    year: "1959",
    engine: "3.5 L straight-six",
    power: "220 hp",
    country: "Italy",
    img: "/img/car_maserati.jpg",
    detail: "/img/machine_chassis.jpg",
    detailCap: "Superleggera tube frame",
    note: "Found under a tarpaulin in Piedmont. Two winters in bay 2 brought it back.",
    focus: "50% 55%",
  },
];

export type Material = {
  id: string;
  index: string;
  label: string;
  caption: string;
  copy: string;
  img: string;
};

export const MATERIALS: Material[] = [
  {
    id: "metal",
    index: "01",
    label: "Metal",
    caption: "Hand-formed aluminium, English wheel",
    copy: "Every panel is rolled on the original bucks. No filler, no shortcuts — the shape comes from the hands, a hammer and four hundred hours of patience.",
    img: "/img/craft_metal.jpg",
  },
  {
    id: "leather",
    index: "02",
    label: "Leather",
    caption: "Hand-stitched hide, 4 mm pitch",
    copy: "Hides are cut in the house workshop and sewn on a 1962 Singer. The pitch of the stitch is the same as the factory used — we counted.",
    img: "/img/craft_leather.jpg",
  },
  {
    id: "wood",
    index: "03",
    label: "Wood",
    caption: "Walnut rim, twelve coats of lacquer",
    copy: "A steering wheel takes six weeks. The walnut is dried for a year, turned, and lacquered coat by coat until the grain sits under glass.",
    img: "/img/craft_wood.jpg",
  },
  {
    id: "chrome",
    index: "04",
    label: "Chrome",
    caption: "Triple-plated brightwork, mirror polish",
    copy: "Copper, nickel, chrome. Three baths, then polishing by hand until the reflection of the workshop lamp has no edge.",
    img: "/img/craft_chrome.jpg",
  },
  {
    id: "engine",
    index: "05",
    label: "Engine",
    caption: "Rebuilt to factory tolerance",
    copy: "Rebuilt, never replaced. Every gauge is restored, every casting kept. The engine number is the one it left the factory with.",
    img: "/img/craft_engine.jpg",
  },
];

export type Story = {
  id: string;
  title: [string, string];
  date: string;
  location: string;
  model: string;
  story: string;
  img: string;
};

export const STORIES: Story[] = [
  {
    id: "restoration",
    title: ["The art of", "restoration"],
    date: "03 · 2026",
    location: "Geneva",
    model: "Aston Martin DB4",
    story: "014",
    img: "/img/journal_restoration.jpg",
  },
  {
    id: "alps",
    title: ["A drive through", "the Alps"],
    date: "07 · 2026",
    location: "Stelvio Pass",
    model: "Porsche 356",
    story: "015",
    img: "/img/journal_alps.jpg",
  },
  {
    id: "golden",
    title: ["The golden", "age"],
    date: "1961",
    location: "Goodwood",
    model: "Ferrari 250 GT SWB",
    story: "016",
    img: "/img/journal_golden.jpg",
  },
];

/** A pill in the "In motion" rows. */
export type Pill = { img: string; label: string; hero?: boolean };

/** Three rows; the hero pill is the one the section lands on. */
export const MOTION: Pill[][] = [
  [
    { img: "/img/car_300sl.jpg", label: "300 SL · 1955" },
    { img: "/img/craft_leather.jpg", label: "Connolly hide" },
    { img: "/img/journey_far.jpg", label: "Coast road" },
    { img: "/img/machine_wheel.jpg", label: "Borrani wire" },
    { img: "/img/car_356.jpg", label: "356 Speedster · 1957" },
    { img: "/img/heritage_archive.jpg", label: "Family archive" },
  ],
  [
    { img: "/img/car_db5.jpg", label: "DB5 · 1963" },
    { img: "/img/craft_wood.jpg", label: "Walnut rim" },
    { img: "/img/car_etype.jpg", label: "E-Type · 1961", hero: true },
    { img: "/img/journal_alps.jpg", label: "Stelvio Pass" },
    { img: "/img/machine_steering.jpg", label: "Nardi wheel" },
  ],
  [
    { img: "/img/car_250.jpg", label: "250 GT · 1960" },
    { img: "/img/craft_chrome.jpg", label: "Brightwork" },
    { img: "/img/journal_golden.jpg", label: "Goodwood · 1961" },
    { img: "/img/car_maserati.jpg", label: "3500 GT · 1959" },
    { img: "/img/machine_seat.jpg", label: "Cognac hide" },
    { img: "/img/final_rear.jpg", label: "DB4 GT Zagato" },
  ],
];

/** Manifesto: words, with an inline plate opening after the marked words. */
export const MANIFESTO = {
  lines: [
    { text: "We do not collect cars.", img: "/img/heritage_archive3.jpg", alt: "Archive print, 1958" },
    { text: "We keep them alive —", img: "/img/craft_main.jpg", alt: "The workshop, bay 2" },
    { text: "restored by hand, driven on real roads,", img: "/img/journey.jpg", alt: "Tuscany, golden hour" },
    { text: "and passed on.", img: null, alt: "" },
  ],
  figures: [
    { n: 6, label: "Machines" },
    { n: 68, label: "Years" },
    { n: 4, label: "Craftsmen" },
    { n: 1, label: "Family" },
  ],
};

export const SECTIONS = [
  { id: "hero", label: "Overture" },
  { id: "manifesto", label: "Manifesto" },
  { id: "motion", label: "In motion" },
  { id: "collection", label: "The collection" },
  { id: "machine", label: "The machine" },
  { id: "craft", label: "Craft" },
  { id: "journey", label: "The journey" },
  { id: "journal", label: "The journal" },
  { id: "final", label: "Legacy" },
];
