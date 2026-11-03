import { describe, expect, it } from 'vitest';
import {
  extractIndicators, normalisePhone, phoneToken, redactPhone,
  registrableDomain, templateKey, extractUpiHandles,
} from '../lib/threat-intel/indicators';
import {
  CORROBORATION_THRESHOLD, groupIntoCampaigns, matchCampaigns, type ThreatReport,
} from '../lib/threat-intel/campaigns';
import { DEMO_KEY, demoCampaigns } from '../lib/threat-intel/demo-network';

const KEY = 'test-key-not-a-real-secret';

describe('indicator normalisation', () => {
  it('collapses subdomains to the registrable domain so variants cluster', () => {
    expect(registrableDomain('https://kyc.secure-hdfc.xyz/login')).toBe('secure-hdfc.xyz');
    expect(registrableDomain('http://login.kyc.secure-hdfc.xyz')).toBe('secure-hdfc.xyz');
    expect(registrableDomain('https://sbi.co.in/x')).toBe('sbi.co.in');
  });

  it('treats one number written three ways as the same subscriber', () => {
    const forms = ['+91 98765 43210', '098765-43210', '9876543210'];
    const tokens = new Set(forms.map((f) => phoneToken(f, KEY)));
    expect(tokens.size).toBe(1);
    expect(normalisePhone('+91 98765 43210')).toBe('9876543210');
  });

  it('never emits the raw number as the shareable value', () => {
    const token = phoneToken('9876543210', KEY)!;
    expect(token).not.toContain('9876543210');
    expect(redactPhone('9876543210')).toBe('98••••••10');
  });

  it('changes the token when the key changes, so a leak is not universal', () => {
    expect(phoneToken('9876543210', 'key-a')).not.toBe(phoneToken('9876543210', 'key-b'));
  });

  it('does not mistake an email for a UPI handle', () => {
    expect(extractUpiHandles('write to me at ravi@gmail.com')).toEqual([]);
    expect(extractUpiHandles('pay to refunds@okaxis now')).toEqual(['refunds@okaxis']);
  });

  it('fingerprints wording so reworded variants still match', () => {
    const a = templateKey('Your HDFC account will be blocked today. Complete KYC immediately using this link.');
    const b = templateKey('Dear customer, your HDFC account will be blocked. Complete the KYC immediately through this link!');
    expect(a).not.toBeNull();
    expect(a).toBe(b);
  });

  it('gives different wording a different fingerprint', () => {
    const scam = templateKey('Your account will be blocked today complete KYC immediately using this link');
    const normal = templateKey('Hi amma, I reached the hostel safely. Will call you after dinner tonight.');
    expect(scam).not.toBe(normal);
  });

  it('extracts every shareable indicator and no message text', () => {
    const inds = extractIndicators(
      'URGENT: account blocked. Verify at https://kyc.secure-hdfc.xyz/go or call 9876543210. Pay to refunds@okaxis',
      KEY,
    );
    const kinds = inds.map((i) => i.kind).sort();
    expect(kinds).toContain('domain');
    expect(kinds).toContain('phone');
    expect(kinds).toContain('upi');
    // The shareable values must carry no raw message, URL or number. The
    // template key legitimately contains normalised single words — that is
    // the fingerprint working, not leakage — so the check is for the raw
    // artefacts an attacker or a leak could actually use.
    for (const i of inds) {
      expect(i.value).not.toContain('9876543210');
      expect(i.value).not.toContain('https://');
      expect(i.value).not.toMatch(/Verify at|URGENT:/);
    }
  });
});

/** A report that shares `domain` with the others unless overridden. */
function report(id: string, reporterId: string, over: Partial<ThreatReport> = {}): ThreatReport {
  return {
    id,
    reporterId,
    category: 'Bank KYC phishing',
    observedAt: '2026-11-01T10:00:00.000Z',
    synthetic: true,
    indicators: [{ kind: 'domain', value: 'secure-hdfc.xyz', label: 'secure-hdfc.xyz' }],
    ...over,
  };
}

describe('campaign grouping', () => {
  it('groups reports that share a concrete indicator', () => {
    const camps = groupIntoCampaigns([report('a', 'u1'), report('b', 'u2'), report('c', 'u3')]);
    expect(camps).toHaveLength(1);
    expect(camps[0]!.reportCount).toBe(3);
  });

  it('links A to C through B even when they share nothing directly', () => {
    const a = report('a', 'u1', { indicators: [{ kind: 'phone', value: 'tok1', label: '98••••••10' }] });
    const b = report('b', 'u2', {
      indicators: [
        { kind: 'phone', value: 'tok1', label: '98••••••10' },
        { kind: 'domain', value: 'secure-hdfc.xyz', label: 'secure-hdfc.xyz' },
      ],
    });
    const c = report('c', 'u3', { indicators: [{ kind: 'domain', value: 'secure-hdfc.xyz', label: 'secure-hdfc.xyz' }] });
    expect(groupIntoCampaigns([a, b, c])).toHaveLength(1);
  });

  it('keeps unrelated reports apart', () => {
    const other = report('x', 'u9', { indicators: [{ kind: 'domain', value: 'other-scam.top', label: 'other-scam.top' }] });
    expect(groupIntoCampaigns([report('a', 'u1'), other])).toHaveLength(2);
  });

  it('never groups on wording alone', () => {
    const a = report('a', 'u1', { indicators: [{ kind: 'template', value: 'account-blocked-kyc-verify', label: 'Wording pattern' }] });
    const b = report('b', 'u2', { indicators: [{ kind: 'template', value: 'account-blocked-kyc-verify', label: 'Wording pattern' }] });
    expect(groupIntoCampaigns([a, b])).toHaveLength(2);
  });
});

describe('corroboration — resisting a single loud voice', () => {
  it('stays preliminary on one reporter however many times they submit', () => {
    const spam = Array.from({ length: 12 }, (_, i) => report(`r${i}`, 'same-user'));
    const camp = groupIntoCampaigns(spam)[0]!;
    expect(camp.reportCount).toBe(12);
    expect(camp.corroboration).toBe(1);
    expect(camp.status).toBe('preliminary');
  });

  it('corroborates only once enough independent reporters agree', () => {
    const below = groupIntoCampaigns(
      Array.from({ length: CORROBORATION_THRESHOLD - 1 }, (_, i) => report(`r${i}`, `u${i}`)),
    )[0]!;
    expect(below.status).toBe('preliminary');

    const at = groupIntoCampaigns(
      Array.from({ length: CORROBORATION_THRESHOLD }, (_, i) => report(`r${i}`, `u${i}`)),
    )[0]!;
    expect(at.status).toBe('corroborated');
  });

  it('goes stale when nothing new arrives, so numbers are not accused forever', () => {
    const old = report('a', 'u1', { observedAt: '2026-01-01T00:00:00.000Z' });
    const camp = groupIntoCampaigns([old], new Date('2026-11-01T00:00:00.000Z'))[0]!;
    expect(camp.status).toBe('stale');
  });
});

describe('matching a new message', () => {
  const campaigns = groupIntoCampaigns([report('a', 'u1'), report('b', 'u2'), report('c', 'u3')]);

  it('matches on a shared domain and says why', () => {
    const [hit] = matchCampaigns([{ kind: 'domain', value: 'secure-hdfc.xyz', label: 'secure-hdfc.xyz' }], campaigns);
    expect(hit).toBeDefined();
    expect(hit!.reason).toMatch(/same link/i);
  });

  it('returns nothing when there is no overlap', () => {
    expect(matchCampaigns([{ kind: 'domain', value: 'unrelated.com', label: 'unrelated.com' }], campaigns)).toEqual([]);
  });

  it('marks a wording-only match as weaker evidence', () => {
    const tplCamp = groupIntoCampaigns([
      report('a', 'u1', {
        indicators: [
          { kind: 'domain', value: 'secure-hdfc.xyz', label: 'secure-hdfc.xyz' },
          { kind: 'template', value: 'kyc-blocked-verify-account', label: 'Wording pattern' },
        ],
      }),
    ]);
    const [hit] = matchCampaigns([{ kind: 'template', value: 'kyc-blocked-verify-account', label: 'Wording pattern' }], tplCamp);
    expect(hit!.reason).toMatch(/weaker evidence|hint, not an identification/i);
  });
});

describe('the simulated network clusters the way a real campaign would', () => {
  const now = new Date('2026-11-03T12:00:00.000Z');
  const camps = demoCampaigns(now);

  it('groups four differently-worded HDFC messages into one campaign', () => {
    const hdfc = camps.find((c) => c.indicators.some((i) => i.value === 'secure-hdfc.xyz'));
    expect(hdfc).toBeDefined();
    expect(hdfc!.reportCount).toBe(4);
    expect(hdfc!.corroboration).toBe(4);
    expect(hdfc!.status).toBe('corroborated');
  });

  it('groups the UPI refund pair on the shared handle', () => {
    const upi = camps.find((c) => c.indicators.some((i) => i.value === 'refunds@okaxis'));
    expect(upi).toBeDefined();
    expect(upi!.reportCount).toBe(2);
    expect(upi!.status).toBe('preliminary');
  });

  it('leaves a single report preliminary rather than raising an alarm', () => {
    const arrest = camps.find((c) => c.category === 'Digital arrest');
    expect(arrest!.corroboration).toBe(1);
    expect(arrest!.status).toBe('preliminary');
  });

  it('marks the two-month-old campaign stale', () => {
    const old = camps.find((c) => c.category === 'Electricity disconnection');
    expect(old!.status).toBe('stale');
  });

  it('flags every simulated campaign as synthetic so the UI can label it', () => {
    expect(camps.every((c) => c.synthetic)).toBe(true);
  });

  it('matches a brand-new variant to the existing HDFC campaign', () => {
    const fresh = extractIndicators(
      'Final reminder: KYC expired, account will be blocked. Update at https://login.secure-hdfc.xyz/now',
      DEMO_KEY,
    );
    const [hit] = matchCampaigns(fresh, camps);
    expect(hit).toBeDefined();
    expect(hit!.campaign.indicators.some((i) => i.value === 'secure-hdfc.xyz')).toBe(true);
    expect(hit!.reason).toMatch(/same link/i);
  });

  it('does not match an ordinary message to any campaign', () => {
    const benign = extractIndicators(
      'Hi pa, I reached the hostel. Please send 500 rupees when you can, no hurry.',
      DEMO_KEY,
    );
    expect(matchCampaigns(benign, camps)).toEqual([]);
  });
});
