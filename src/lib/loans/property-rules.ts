/**
 * State-wise stamp duty and registration fee rules for residential property
 * sale (conveyance) deeds — the single, versioned source for the Stamp Duty and
 * Registration Charges calculators.
 *
 * Support policy (never guess a rate):
 *  - A state/area/buyer combination is calculated only when its BASE rate was
 *    read on an official source (status "verified").
 *  - Add-ons known only from secondary sources (e.g. Mumbai metro cess) are
 *    included with status "secondary" and shown with a badge.
 *  - Anything else is "unsupported": the calculator asks the user for the rate
 *    instead of producing an estimate.
 *  - Commercial property and land: no official separate rates were read, so
 *    they are unsupported everywhere.
 *  - Rules apply from `from` (ISO date). A transaction dated before the earliest
 *    rule we hold is unsupported rather than priced at today's rate.
 */
import type { Source, Status } from "../india/rules";

export const PROPERTY_RULES_VERIFIED = "2026-11-15";

export type Buyer = "male" | "female" | "jointMF" | "femaleSpecial";
export const BUYERS: { value: Buyer; label: string }[] = [
  { value: "male", label: "Man (or company/other)" },
  { value: "female", label: "Woman (or women only)" },
  { value: "jointMF", label: "Joint — man and woman" },
  { value: "femaleSpecial", label: "Woman — SC/ST/BPL (Rajasthan)" },
];
export type PropertyType = "residential" | "commercial" | "land";

export interface Component {
  label: string;
  /** % of the basis value… */
  pct?: number;
  /** …or % of the stamp duty (surcharges levied on the duty). */
  pctOfDuty?: number;
  fixed?: number;
  status: Status;
}

export interface StampRule {
  from: string;
  /** Duty components by buyer; a missing buyer = unsupported for that buyer. */
  byBuyer: Partial<Record<Buyer, Component[]>>;
  /** Value cap for a buyer's concession: above it the `fallback` buyer's rate applies. */
  concessionCap?: { buyer: Buyer; upTo: number; fallback: Buyer };
  notes: string[];
  sources: Source[];
}

export interface FeeSlab {
  upTo: number | null;
  fee: number;
}
export interface RegRule {
  from: string;
  pct?: number;
  min?: number;
  max?: number;
  slabs?: FeeSlab[];
  /** Above the last slab: + `step` for every further `per` rupees, up to `max`. */
  extra: { label: string; amount: number; status: Status }[];
  status: Status;
  /** Concession: lower % for some buyers up to a value cap. */
  concession?: { buyers: Buyer[]; pct: number; upTo?: number; from: string; label: string; status: Status };
  notes: string[];
  sources: Source[];
}

export interface Area {
  id: string;
  label: string;
  stamp?: StampRule[]; // newest first
  registration?: RegRule[];
}

export interface StateRules {
  id: string;
  name: string;
  basis: string;
  areas: Area[];
  /** Why stamp duty or registration isn't supported, when it isn't. */
  stampUnsupported?: string;
  registrationUnsupported?: string;
}

const S = (label: string, url: string): Source => ({ label, url });

/* ------------------------------------------------------------------ */
/* Supported data                                                      */
/* ------------------------------------------------------------------ */

const DELHI_SRC = [
  S("Revenue Department, Govt of NCT of Delhi — important information regarding registration of property", "https://revenue.delhi.gov.in/revenue/important-information-regarding-registration-property"),
  S("Revenue Department, Delhi — property registration", "https://revenue.delhi.gov.in/revenue/property-registration"),
];
const MH_SRC = [
  S("IGR Maharashtra — Department of Registration and Stamps (Maharashtra Stamp Act, Article 25(b))", "https://igrmaharashtra.gov.in/"),
  S("IGR Maharashtra order on 1% concession for women buyers, 31 March 2021", "https://cdn.taxguru.in/wp-content/uploads/2021/04/Stamp-Duty-Concession-for-Womens-31-03-2021.pdf"),
];
const RJ_SRC = [
  S("Rajasthan IGRS — stamp duty and registration fee table (as on 1 May 2024)", "https://rajnivesh.rajasthan.gov.in/Uploads/3fc839e7-2e7f-44c0-8e19-9c539e5b7f7b.pdf"),
  S("Rajasthan Finance Dept notification F.4(2)FD/Tax/2024-68 (8 Feb 2024) — registration fee", "https://finance.rajasthan.gov.in/PDFDOCS/TAX/IGRS/13680.pdf"),
];
const TS_SRC = [
  S("Telangana G.O. Ms. No. 59 — stamp duty on sale (22 July 2021)", "https://registration.telangana.gov.in/GO_MSNo_59.htm"),
  S("Telangana Registration & Stamps — registration fees", "https://registration.telangana.gov.in/RegistrationFees.htm"),
];
const TN_SRC = [
  S("Tamil Nadu G.O. Ms. No. 34 (30 March 2023) — registration fee 2%", "https://www.stationeryprinting.tn.gov.in/extraordinary/2023/109_Ex_II_2_2023.pdf"),
  S("Tamil Nadu G.O. Ms. No. 77 (29 March 2025) — 1% concession for women", "https://www.stationeryprinting.tn.gov.in/extraordinary/2025/147_Ex_II_2_2025.pdf"),
];
const HR_SRC = [S("Haryana Revenue Dept — stamp duty and registration fee schedule", "https://jamabandi.nic.in/Docs/Updatedstampdutyandregistrationfees.pdf")];

const mhStamp = (base: number, metroCess: boolean): StampRule[] => {
  const dutyFor = (rate: number): Component[] => [{ label: "Stamp duty (Article 25(b))", pct: rate, status: "verified" }, ...(metroCess ? [{ label: "Metro cess", pct: 1, status: "secondary" as Status }] : [])];
  return [
    {
      from: "2021-04-01",
      byBuyer: { male: dutyFor(base), jointMF: dutyFor(base), female: dutyFor(base - 1) },
      notes: ["Women buying a residential unit alone or with other women pay 1% less stamp duty (from 1 April 2021). A woman buying jointly with a man pays the normal rate.", ...(metroCess ? ["The 1% metro cess is from secondary sources — confirm with the registration office."] : [])],
      sources: MH_SRC,
    },
  ];
};

export const STATES: StateRules[] = [
  {
    id: "delhi",
    name: "Delhi",
    basis: "Higher of the transaction value and the circle-rate value",
    areas: [
      {
        id: "delhi",
        label: "Delhi (excluding NDMC and Cantonment areas)",
        stamp: [
          {
            from: "2026-11-13",
            byBuyer: {
              male: [{ label: "Stamp duty", pct: 6, status: "verified" }],
              female: [{ label: "Stamp duty", pct: 4, status: "verified" }],
              jointMF: [{ label: "Stamp duty (joint)", pct: 5, status: "secondary" }],
            },
            notes: ["Delhi's official page gives 6% for men and 4% for women. The 5% joint rate is from secondary sources.", "Rates were confirmed as current on 13 November 2026; earlier transactions aren't priced here.", "NDMC and Cantonment areas can differ and aren't covered."],
            sources: DELHI_SRC,
          },
        ],
        registration: [{ from: "2026-11-13", pct: 1, extra: [{ label: "Pasting fee", amount: 100, status: "verified" }], status: "verified", notes: ["1% of the same value plus a ₹100 pasting fee; no cap is stated."], sources: DELHI_SRC }],
      },
    ],
  },
  {
    id: "maharashtra",
    name: "Maharashtra",
    basis: "Market value (ready reckoner) or the agreement value, whichever is higher",
    registrationUnsupported: "Maharashtra's registration fee (commonly 1% capped at ₹30,000) couldn't be confirmed on an official source, so it isn't calculated.",
    areas: [
      { id: "mumbai", label: "Mumbai (Municipal Corporation of Greater Mumbai)", stamp: mhStamp(5, true) },
      {
        id: "mh-urban",
        label: "Other municipal corporations and urban areas",
        stamp: mhStamp(5, false).map((r) => ({ ...r, notes: [...r.notes, "Some cities (e.g. Pune, Thane, Nagpur) add 1% LBT/transport surcharge and/or 1% metro cess; which apply couldn't be confirmed. Add them under 'Extra local levy' if your registrar charges them."] })),
      },
      { id: "mh-council", label: "Municipal councils, nagar panchayats and rural MMRDA areas", stamp: mhStamp(5, false) },
      { id: "mh-gp", label: "Gram panchayat areas", stamp: mhStamp(4, false).map((r) => ({ ...r, notes: [...r.notes, "A 1% zilla parishad levy is reported in some rural areas but couldn't be confirmed — add it under 'Extra local levy' if charged."] })) },
    ],
  },
  {
    id: "rajasthan",
    name: "Rajasthan",
    basis: "Market value or consideration, whichever is higher",
    areas: [
      {
        id: "rajasthan",
        label: "Rajasthan",
        stamp: [
          {
            from: "2020-02-20",
            byBuyer: {
              male: [{ label: "Stamp duty", pct: 6, status: "verified" }, { label: "Surcharge (30% of duty)", pctOfDuty: 30, status: "verified" }],
              female: [{ label: "Stamp duty", pct: 5, status: "verified" }, { label: "Surcharge (30% of duty)", pctOfDuty: 30, status: "verified" }],
              femaleSpecial: [{ label: "Stamp duty", pct: 4, status: "verified" }, { label: "Surcharge (30% of duty)", pctOfDuty: 30, status: "verified" }],
            },
            notes: ["Rates from notifications of 20 February 2020; surcharge of 30% of the duty per the IGRS table (1 May 2024).", "Joint purchases aren't covered — a 2025-26 Budget announcement of a 0.5% discount for joint purchase with a wife has no implementing notification we could find.", "Persons with 40–80% disability pay 4%; above 80% and transgender persons are exempt — not modelled."],
            sources: RJ_SRC,
          },
        ],
        registration: [{ from: "2024-02-08", pct: 1, extra: [], status: "verified", notes: ["1% with no maximum since 8 February 2024 (the earlier ₹1 lakh cap was removed)."], sources: RJ_SRC }],
      },
    ],
  },
  {
    id: "telangana",
    name: "Telangana",
    basis: "Market value or consideration, whichever is higher",
    areas: [
      {
        id: "ts-ulb",
        label: "Urban local body areas (municipalities, corporations)",
        stamp: [{ from: "2021-07-22", byBuyer: Object.fromEntries((["male", "female", "jointMF"] as Buyer[]).map((b) => [b, [{ label: "Stamp duty", pct: 5.5, status: "verified" as Status }, { label: "Transfer duty", pct: 1.5, status: "secondary" as Status }]])), notes: ["Stamp duty 5.5% from 22 July 2021 (G.O. Ms. No. 59). The 1.5% transfer duty in urban local bodies is from secondary sources.", "No concession by buyer gender."], sources: TS_SRC }],
        registration: [{ from: "2021-09-02", pct: 0.5, extra: [], status: "verified", notes: ["0.5% from 2 September 2021."], sources: TS_SRC }],
      },
      {
        id: "ts-gp",
        label: "Gram panchayat areas",
        stamp: [{ from: "2021-07-22", byBuyer: Object.fromEntries((["male", "female", "jointMF"] as Buyer[]).map((b) => [b, [{ label: "Stamp duty", pct: 5.5, status: "verified" as Status }]])), notes: ["Stamp duty 5.5%; no transfer duty in gram panchayat areas (secondary sources)."], sources: TS_SRC }],
        registration: [{ from: "2021-09-02", pct: 2, extra: [], status: "verified", notes: ["2% in gram panchayat areas from 2 September 2021."], sources: TS_SRC }],
      },
    ],
  },
  {
    id: "tamil-nadu",
    name: "Tamil Nadu",
    basis: "Guideline value or consideration, whichever is higher",
    stampUnsupported: "Tamil Nadu's 7% stamp duty is widely reported but we couldn't read it on an official source, so it isn't calculated.",
    areas: [
      {
        id: "tn",
        label: "Tamil Nadu",
        registration: [
          {
            from: "2023-04-01",
            pct: 2,
            extra: [],
            status: "verified",
            concession: { buyers: ["female"], pct: 1, upTo: 1000000, from: "2025-04-01", label: "Women buyers, value up to ₹10 lakh: 1% (from 1 April 2025)", status: "verified" },
            notes: ["Registration fee on a sale deed is 2% from 1 April 2023 (G.O. Ms. No. 34).", "From 1 April 2025, all-women buyers of property valued up to ₹10 lakh pay 1% (G.O. Ms. No. 77); if the value is later found to exceed ₹10 lakh, the balance is payable."],
            sources: TN_SRC,
          },
        ],
      },
    ],
  },
  {
    id: "haryana",
    name: "Haryana",
    basis: "Collector rate or consideration, whichever is higher",
    stampUnsupported: "Haryana's stamp duty rates (7%/5%/6% within municipal limits, 5%/3%/4% outside) are from secondary sources only, so they aren't calculated.",
    areas: [
      {
        id: "haryana",
        label: "Haryana",
        registration: [
          {
            from: "2020-11-01",
            slabs: [
              { upTo: 50000, fee: 100 },
              { upTo: 100000, fee: 500 },
              { upTo: 500000, fee: 1000 },
              { upTo: 1000000, fee: 5000 },
              { upTo: 2000000, fee: 10000 },
              { upTo: 2500000, fee: 12500 },
              { upTo: 3000000, fee: 15000 },
              { upTo: 4000000, fee: 20000 },
              { upTo: 5000000, fee: 25000 },
              { upTo: 6000000, fee: 30000 },
              { upTo: 7000000, fee: 35000 },
              { upTo: 8000000, fee: 40000 },
              { upTo: 9000000, fee: 45000 },
              { upTo: null, fee: 50000 },
            ],
            extra: [{ label: "HARIS service charge", amount: 200, status: "verified" }],
            status: "verified",
            notes: ["Fixed fees by value slab, up to a maximum of ₹50,000 (schedule dated November 2020; the ₹50,000 maximum was repeated in July 2026).", "The ₹25–30 lakh slab boundary is inferred from the schedule's layout."],
            sources: HR_SRC,
          },
        ],
      },
    ],
  },
];

/** States we hold no verified rules for (shown as unsupported). */
export const UNSUPPORTED_STATES: { name: string; reason: string }[] = [
  { name: "Karnataka", reason: "Rates (including the August 2025 registration-fee increase) are from secondary sources only." },
  { name: "Gujarat", reason: "Stamp duty and registration rates are from secondary sources only." },
  { name: "Uttar Pradesh", reason: "Rates and the 2025 women's concession lack an official notification we could read." },
  { name: "West Bengal", reason: "Rates are from secondary sources; the official site couldn't be read." },
  { name: "Kerala", reason: "Rates are from secondary sources; the official sites couldn't be read." },
];

/* ------------------------------------------------------------------ */
/* Engine                                                              */
/* ------------------------------------------------------------------ */

export type RuleLookup<T> = { ok: true; rule: T } | { ok: false; reason: string };

const pick = <T extends { from: string }>(rules: T[] | undefined, date: string): RuleLookup<T> => {
  if (!rules?.length) return { ok: false, reason: "no-rule" };
  const r = rules.find((x) => x.from <= date);
  if (!r) {
    const earliest = rules[rules.length - 1].from;
    return { ok: false, reason: `We only hold rules in force from ${fmtDate(earliest)}; for an earlier transaction, check the rate that applied on that date.` };
  }
  return { ok: true, rule: r };
};

export const fmtDate = (iso: string) => new Date(iso + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

export interface ChargeInput {
  stateId: string;
  areaId: string;
  type: PropertyType;
  buyer: Buyer;
  value: number;
  guidance: number;
  date: string; // ISO
  extraLevyPct?: number; // user-entered local levy (stamp duty)
}

export function basisValue(i: Pick<ChargeInput, "value" | "guidance">) {
  return Math.max(i.value, i.guidance);
}

/** Amount of each component: % of value, % of the first (stamp duty) component, or fixed. */
function componentLines(comps: Component[], basis: number) {
  const dutyAmt = comps[0]?.pct !== undefined ? (basis * comps[0].pct) / 100 : 0;
  return comps.map((c) => {
    const amount = c.pct !== undefined ? (basis * c.pct) / 100 : c.pctOfDuty !== undefined ? (dutyAmt * c.pctOfDuty) / 100 : (c.fixed ?? 0);
    return { label: c.label, ratePct: basis > 0 ? (amount / basis) * 100 : 0, amount, status: c.status };
  });
}

export type StampResult =
  | { ok: true; basis: number; lines: { label: string; ratePct: number; amount: number; status: Status }[]; total: number; effectivePct: number; concession: number; rule: StampRule; area: Area; state: StateRules }
  | { ok: false; reason: string };

export function stampDuty(i: ChargeInput): StampResult {
  const state = STATES.find((s) => s.id === i.stateId);
  if (!state) return { ok: false, reason: "We don't have verified stamp-duty rules for this state yet. Enter the rate yourself below." };
  if (state.stampUnsupported) return { ok: false, reason: state.stampUnsupported };
  if (i.type !== "residential") return { ok: false, reason: "Only residential property is covered — no official separate rates for commercial property or land were verified." };
  const area = state.areas.find((a) => a.id === i.areaId) ?? state.areas[0];
  const look = pick(area.stamp, i.date);
  if (!look.ok) return { ok: false, reason: look.reason === "no-rule" ? "No verified stamp-duty rule for this area." : look.reason };
  const rule = look.rule;
  const basis = basisValue(i);
  let buyer = i.buyer;
  if (rule.concessionCap && buyer === rule.concessionCap.buyer && basis > rule.concessionCap.upTo) buyer = rule.concessionCap.fallback;
  const comps = rule.byBuyer[buyer];
  if (!comps) return { ok: false, reason: `This buyer category isn't covered by the rules we've verified for ${state.name}. Enter the rate yourself below.` };
  const lines = componentLines(comps, basis);
  if (i.extraLevyPct) lines.push({ label: "Extra local levy (entered by you)", ratePct: i.extraLevyPct, amount: (basis * i.extraLevyPct) / 100, status: "secondary" });
  const total = Math.round(lines.reduce((a, l) => a + l.amount, 0));
  // Concession = the man's rate minus this buyer's, when both are known.
  const male = rule.byBuyer.male;
  const maleTotal = male && buyer !== "male" ? Math.round(componentLines(male, basis).reduce((a, l) => a + l.amount, 0) + (i.extraLevyPct ? (basis * i.extraLevyPct) / 100 : 0)) : null;
  return { ok: true, basis, lines, total, effectivePct: basis > 0 ? (total / basis) * 100 : 0, concession: maleTotal !== null ? Math.max(0, maleTotal - total) : 0, rule, area, state };
}

export type RegResult =
  | { ok: true; basis: number; fee: number; ratePct: number | null; capped: boolean; minApplied: boolean; extras: { label: string; amount: number; status: Status }[]; total: number; concessionApplied: string | null; concessionSaving: number; rule: RegRule; area: Area; state: StateRules; slab: FeeSlab | null }
  | { ok: false; reason: string };

export function registrationFee(i: ChargeInput): RegResult {
  const state = STATES.find((s) => s.id === i.stateId);
  if (!state) return { ok: false, reason: "We don't have verified registration-fee rules for this state yet. Enter the fee yourself below." };
  if (state.registrationUnsupported) return { ok: false, reason: state.registrationUnsupported };
  if (i.type !== "residential") return { ok: false, reason: "Only residential property is covered — no official separate fees for commercial property or land were verified." };
  const area = state.areas.find((a) => a.id === i.areaId) ?? state.areas[0];
  const look = pick(area.registration, i.date);
  if (!look.ok) return { ok: false, reason: look.reason === "no-rule" ? "No verified registration rule for this area." : look.reason };
  const rule = look.rule;
  const basis = basisValue(i);
  let fee: number;
  let ratePct: number | null = null;
  let slab: FeeSlab | null = null;
  let capped = false;
  let minApplied = false;
  let concessionApplied: string | null = null;
  let concessionSaving = 0;
  if (rule.slabs) {
    slab = rule.slabs.find((s) => s.upTo === null || basis <= s.upTo)!;
    fee = slab.fee;
  } else {
    ratePct = rule.pct!;
    const c = rule.concession;
    if (c && c.buyers.includes(i.buyer) && i.date >= c.from && (c.upTo === undefined || basis <= c.upTo)) {
      concessionSaving = (basis * (ratePct - c.pct)) / 100;
      ratePct = c.pct;
      concessionApplied = c.label;
    }
    fee = (basis * ratePct) / 100;
    if (rule.min !== undefined && fee < rule.min) {
      fee = rule.min;
      minApplied = true;
    }
    if (rule.max !== undefined && fee > rule.max) {
      fee = rule.max;
      capped = true;
    }
  }
  fee = Math.round(fee);
  const extras = rule.extra;
  return { ok: true, basis, fee, ratePct, capped, minApplied, extras, total: fee + extras.reduce((a, e) => a + e.amount, 0), concessionApplied, concessionSaving: Math.round(concessionSaving), rule, area, state, slab };
}

/** Every state name we list (supported first), for the selector. */
export const STATE_OPTIONS = [...STATES.map((s) => ({ value: s.id, label: s.name })), ...UNSUPPORTED_STATES.map((s) => ({ value: `x-${s.name}`, label: `${s.name} (not yet supported)` })), { value: "x-other", label: "Other state / UT (not yet supported)" }];
export const unsupportedReason = (id: string) => UNSUPPORTED_STATES.find((s) => `x-${s.name}` === id)?.reason ?? "We don't hold verified rules for this state or union territory yet.";
