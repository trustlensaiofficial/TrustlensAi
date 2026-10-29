import type { Metadata } from 'next';
import { LiquidStage } from '@/components/liquid/LiquidStage';
import { LiquidDock } from '@/components/liquid/LiquidDock';
import { LiquidLink } from '@/components/liquid/LiquidButton';
import { TOUR } from '@/lib/showcase/tour';
import {
  ArrowIcon,
  ChecklistIcon,
  ClockIcon,
  DocumentIcon,
  EvidenceIcon,
  HelpIcon,
  LensIcon,
  ScalesIcon,
  ShieldIcon,
  SparkIcon,
} from '@/components/icons';
import '../liquid.css';
import './features.css';

export const metadata: Metadata = {
  title: 'Features',
  description:
    'Every TrustLens AI feature: inspectable evidence, context-aware rules, a transparent investigation, labelled provenance, stated unknowns, next safe actions, a keepable report and private history.',
};

/** One icon per feature, keyed to the tour so the two cannot drift apart. */
const ICONS: Record<string, React.ReactNode> = {
  overview: <SparkIcon />,
  choose: <ShieldIcon />,
  investigate: <LensIcon />,
  evidence: <EvidenceIcon />,
  unknowns: <HelpIcon />,
  actions: <ChecklistIcon />,
  report: <DocumentIcon />,
  history: <ClockIcon />,
};

/** Where each feature can actually be exercised, rather than only read about. */
const LINKS: Record<string, { href: string; label: string }> = {
  overview: { href: '/analyze', label: 'Open the workspace' },
  choose: { href: '/analyze', label: 'Pick a scenario' },
  investigate: { href: '/analyze', label: 'Run an investigation' },
  evidence: { href: '/analyze', label: 'Inspect the findings' },
  unknowns: { href: '/analyze', label: 'See what is unchecked' },
  actions: { href: '/analyze', label: 'Get the next steps' },
  report: { href: '/analyze', label: 'Produce a report' },
  history: { href: '/history', label: 'Open your history' },
};

export default function FeaturesPage() {
  return (
    <div className="lq">
      <LiquidStage />

      <main className="lq-main ft-main">
        <header className="ft-head">
          <span className="lq-eyebrow lq-step" style={{ '--d': '0ms' } as React.CSSProperties}>
            <ScalesIcon />
            The prototype
          </span>
          <h1 className="lq-h1 lq-step" style={{ '--d': '110ms' } as React.CSSProperties}>
            Everything <span className="lq-gradient-text">TrustLens AI</span> does
          </h1>
          <p className="lq-lede lq-step" style={{ '--d': '220ms' } as React.CSSProperties}>
            Eight features, each one working in the prototype you can open right now. Nothing
            here is a mock-up — every card links to the real screen that does it.
          </p>
        </header>

        <ul className="ft-grid">
          {TOUR.map((feature, i) => {
            const link = LINKS[feature.id];
            return (
              <li
                key={feature.id}
                className="lq-glass ft-card lq-step"
                style={{ '--d': `${320 + i * 70}ms` } as React.CSSProperties}
              >
                <span className="ft-num">{feature.number}</span>
                <span className="ft-icon" aria-hidden="true">{ICONS[feature.id]}</span>
                <h2 className="ft-title">{feature.title}</h2>
                <p className="ft-blurb">{feature.blurb}</p>
                {link && (
                  <LiquidLink href={link.href} variant="ghost" size="sm" className="ft-go">
                    {link.label}
                    <ArrowIcon />
                  </LiquidLink>
                )}
              </li>
            );
          })}
        </ul>

        <section className="lq-glass ft-cta lq-step" style={{ '--d': '900ms' } as React.CSSProperties}>
          <h2 className="lq-h2">Try it on something real</h2>
          <p className="lq-lede">
            Paste a message, a link or a request. You will get the findings, the exact text
            that triggered each one, what could not be checked, and what to do next.
          </p>
          <div className="ft-cta-actions">
            <LiquidLink href="/analyze" size="lg">
              Open the analyser
              <ArrowIcon />
            </LiquidLink>
            <LiquidLink href="/story" variant="ghost">
              Replay the story
            </LiquidLink>
          </div>
        </section>
      </main>

      <LiquidDock />
    </div>
  );
}
