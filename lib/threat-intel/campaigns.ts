import type { Indicator, IndicatorKind } from './indicators';

/**
 * Grouping reports into campaigns, and deciding when a campaign is worth
 * warning someone about.
 *
 * The hard part is not finding matches — it is refusing to raise an alarm on
 * evidence that does not justify one. One person reporting one number proves
 * nothing; the same indicator reported independently by several people over
 * days is a campaign. These rules are explicit so the UI can show its working
 * instead of asking anyone to trust a number.
 */

export interface ThreatReport {
  id: string;
  /** Opaque, stable per device. Never a user identity. */
  reporterId: string;
  category: string;
  indicators: Indicator[];
  observedAt: string;
  /** True when it came from the bundled demo set rather than a real user. */
  synthetic: boolean;
}

export interface Campaign {
  id: string;
  title: string;
  category: string;
  /** Indicators shared across the grouped reports. */
  indicators: Indicator[];
  /** Distinct reporters, after de-duplication. */
  corroboration: number;
  reportCount: number;
  firstSeen: string;
  lastSeen: string;
  status: CampaignStatus;
  synthetic: boolean;
}

/**
 * How much weight a campaign carries.
 * - `preliminary` one reporter. Shown, never pushed. Could be a mistake.
 * - `corroborated` several independent reporters agree.
 * - `stale` nothing new for a while; the number may have been reassigned.
 */
export type CampaignStatus = 'preliminary' | 'corroborated' | 'stale';

/** Independent reporters needed before a campaign is treated as corroborated. */
export const CORROBORATION_THRESHOLD = 3;
/** A campaign with nothing new for this long goes stale rather than standing. */
export const STALE_AFTER_DAYS = 30;

/**
 * Indicators strong enough to group two reports on their own.
 *
 * A shared wording pattern alone is not: two people can write similar things,
 * and clustering on it would merge unrelated reports. It strengthens a group
 * that already matched on something concrete.
 */
const LINKING: ReadonlySet<IndicatorKind> = new Set<IndicatorKind>(['domain', 'phone', 'upi']);

function key(i: Indicator): string {
  return `${i.kind}:${i.value}`;
}

/**
 * Groups reports that share at least one concrete indicator.
 *
 * Union-find over the linking indicators, so A↔B and B↔C put all three in one
 * campaign even when A and C share nothing directly — which is exactly how a
 * campaign looks when the attacker rotates numbers between sends.
 */
export function groupIntoCampaigns(reports: ThreatReport[], now = new Date()): Campaign[] {
  const parent = new Map<string, string>();

  const find = (x: string): string => {
    let root = x;
    while (parent.get(root) !== root) root = parent.get(root) ?? root;
    let cur = x;
    while (parent.get(cur) !== root) {
      const next = parent.get(cur) ?? root;
      parent.set(cur, root);
      cur = next;
    }
    return root;
  };

  const union = (a: string, b: string) => {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent.set(ra, rb);
  };

  for (const r of reports) {
    if (!parent.has(r.id)) parent.set(r.id, r.id);
    for (const ind of r.indicators) {
      if (!LINKING.has(ind.kind)) continue;
      const k = key(ind);
      if (!parent.has(k)) parent.set(k, k);
      union(r.id, k);
    }
  }

  const buckets = new Map<string, ThreatReport[]>();
  for (const r of reports) {
    const root = find(r.id);
    const list = buckets.get(root) ?? [];
    list.push(r);
    buckets.set(root, list);
  }

  const out: Campaign[] = [];
  for (const group of buckets.values()) {
    const sorted = [...group].sort((a, b) => a.observedAt.localeCompare(b.observedAt));
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    if (!first || !last) continue;

    // De-duplicated: one person reporting the same campaign five times is one
    // voice, not five. This is what stops a single actor manufacturing
    // consensus by resubmitting.
    const reporters = new Set(group.map((r) => r.reporterId));

    const indicators: Indicator[] = [];
    const seen = new Set<string>();
    for (const r of group) {
      for (const ind of r.indicators) {
        if (seen.has(key(ind))) continue;
        seen.add(key(ind));
        indicators.push(ind);
      }
    }

    const ageDays = (now.getTime() - new Date(last.observedAt).getTime()) / 86_400_000;
    const status: CampaignStatus =
      ageDays > STALE_AFTER_DAYS
        ? 'stale'
        : reporters.size >= CORROBORATION_THRESHOLD
          ? 'corroborated'
          : 'preliminary';

    out.push({
      id: `camp_${first.id}`,
      title: campaignTitle(first.category, indicators),
      category: first.category,
      indicators,
      corroboration: reporters.size,
      reportCount: group.length,
      firstSeen: first.observedAt,
      lastSeen: last.observedAt,
      status,
      synthetic: group.every((r) => r.synthetic),
    });
  }

  return out.sort((a, b) => b.corroboration - a.corroboration || b.lastSeen.localeCompare(a.lastSeen));
}

function campaignTitle(category: string, indicators: Indicator[]): string {
  const domain = indicators.find((i) => i.kind === 'domain');
  if (domain) return `${category} using ${domain.label}`;
  const upi = indicators.find((i) => i.kind === 'upi');
  if (upi) return `${category} collecting to ${upi.label}`;
  const phone = indicators.find((i) => i.kind === 'phone');
  if (phone) return `${category} from ${phone.label}`;
  return category;
}

export interface CampaignMatch {
  campaign: Campaign;
  /** The indicators this message and the campaign have in common. */
  matched: Indicator[];
  /** Plain-language reason, so the alert explains itself. */
  reason: string;
}

/**
 * Finds campaigns that a new message matches.
 *
 * A template-only overlap is reported but never alone promotes an alert — the
 * `matched` list makes clear which kind of evidence produced the hit, so the
 * interface can say "the wording matches" rather than implying the sender is
 * known.
 */
export function matchCampaigns(indicators: Indicator[], campaigns: Campaign[]): CampaignMatch[] {
  const mine = new Set(indicators.map(key));
  const out: CampaignMatch[] = [];

  for (const campaign of campaigns) {
    const matched = campaign.indicators.filter((i) => mine.has(key(i)));
    if (matched.length === 0) continue;
    const concrete = matched.filter((i) => LINKING.has(i.kind));
    out.push({ campaign, matched, reason: explain(matched, concrete.length > 0) });
  }

  return out.sort((a, b) => b.matched.length - a.matched.length);
}

function explain(matched: Indicator[], concrete: boolean): string {
  const kinds = new Set(matched.map((m) => m.kind));
  const parts: string[] = [];
  if (kinds.has('domain')) parts.push('the same link');
  if (kinds.has('phone')) parts.push('the same number');
  if (kinds.has('upi')) parts.push('the same payment handle');
  if (kinds.has('template')) parts.push('near-identical wording');

  const list =
    parts.length <= 1
      ? (parts[0] ?? 'a shared indicator')
      : `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`;

  return concrete
    ? `This message shares ${list} with reports already in this campaign.`
    : `Only ${list} matches. That is weaker evidence — treat it as a hint, not an identification.`;
}
