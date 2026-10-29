import Image from 'next/image';

/**
 * The visual for one story scene.
 *
 * Each scene gets a distinct 3D stage rather than a stock illustration, so
 * what is on screen actually depicts what the narration is describing. All
 * of it is composed from the product's own vocabulary — findings, evidence
 * rows, provenance labels, checklist ticks — so the slides and the working
 * product cannot drift into looking like different things.
 */
export function SlideVisual({ id }: { id: string }) {
  return (
    <div className="slide" aria-hidden="true">
      <div className="slide-deck">{render(id)}</div>
    </div>
  );
}

function Card({
  children,
  className,
  depth = 0,
}: {
  children?: React.ReactNode;
  className?: string;
  depth?: number;
}) {
  return (
    <div
      className={['slide-card', className].filter(Boolean).join(' ')}
      style={{ '--z': `${depth}px` } as React.CSSProperties}
    >
      {children}
    </div>
  );
}

/** A finding row: severity bar, a line of "text", and its provenance tag. */
function Row({ tone, w = 70, tag }: { tone: string; w?: number; tag?: string }) {
  return (
    <span className="slide-row">
      <i className={`slide-dot t-${tone}`} />
      <i className="slide-line" style={{ width: `${w}%` }} />
      {tag && <i className={`slide-tag g-${tag}`} />}
    </span>
  );
}

function render(id: string) {
  switch (id) {
    /* What it is — the mark, with trust signals orbiting it. */
    case 'what':
      return (
        <>
          <div className="slide-orb">
            <Image src="/logo-mark.png" alt="" width={564} height={472} className="slide-mark" />
          </div>
          <Card className="s-float s-tl" depth={60}><Row tone="ok" w={64} /></Card>
          <Card className="s-float s-br" depth={90}><Row tone="warn" w={72} /></Card>
        </>
      );

    /* A warning is not an answer — a red alert with nothing behind it. */
    case 'problem':
      return (
        <>
          <Card className="s-wide s-alert" depth={40}>
            <span className="slide-bang">!</span>
            <i className="slide-line" style={{ width: '58%' }} />
          </Card>
          <Card className="s-wide s-empty" depth={0}>
            <span className="slide-qmark">?</span>
          </Card>
        </>
      );

    /* Evidence you can inspect — a finding opened to show its matched span. */
    case 'f1':
      return (
        <Card className="s-wide s-open" depth={70}>
          <Row tone="bad" w={76} tag="det" />
          <span className="slide-quote">
            <i className="slide-mark-text" style={{ width: '42%' }} />
          </span>
          <Row tone="mute" w={88} />
          <Row tone="mute" w={64} />
        </Card>
      );

    /* Context rules — the stack changes with what you are holding. */
    case 'f2':
      return (
        <>
          <Card className="s-stack s-s3" depth={0}><Row tone="mute" w={60} /></Card>
          <Card className="s-stack s-s2" depth={40}><Row tone="warn" w={70} /></Card>
          <Card className="s-stack s-s1" depth={80}>
            <Row tone="bad" w={74} />
            <Row tone="warn" w={56} />
          </Card>
        </>
      );

    /* The investigation — four stages running in order. */
    case 'f3':
      return (
        <Card className="s-wide s-pipe" depth={60}>
          {['rules', 'links', 'evidence', 'model'].map((s, i) => (
            <span key={s} className="slide-stage" style={{ '--i': i } as React.CSSProperties}>
              <i className="slide-pip" />
              <i className="slide-line" style={{ width: '100%' }} />
            </span>
          ))}
        </Card>
      );

    /* Provenance — three kinds of claim, never blended. */
    case 'f4':
      return (
        <>
          <Card className="s-third s-p1" depth={80}><i className="slide-tag g-det big" /></Card>
          <Card className="s-third s-p2" depth={50}><i className="slide-tag g-ret big" /></Card>
          <Card className="s-third s-p3" depth={20}><i className="slide-tag g-inf big" /></Card>
        </>
      );

    /* Unknowns — checked on one side, not checked on the other. */
    case 'f5':
      return (
        <>
          <Card className="s-half s-left" depth={70}>
            <Row tone="ok" w={78} /><Row tone="ok" w={62} /><Row tone="ok" w={70} />
          </Card>
          <Card className="s-half s-right s-dashed" depth={30}>
            <Row tone="mute" w={66} /><Row tone="mute" w={80} />
          </Card>
        </>
      );

    /* The next safe move — a checklist being worked through. */
    case 'f6':
      return (
        <Card className="s-wide s-check" depth={70}>
          {[0, 1, 2].map((i) => (
            <span key={i} className="slide-step" style={{ '--i': i } as React.CSSProperties}>
              <i className="slide-tick" />
              <i className="slide-line" style={{ width: `${82 - i * 12}%` }} />
            </span>
          ))}
        </Card>
      );

    /* The report — one document you can keep. */
    case 'f7':
      return (
        <>
          <Card className="s-doc s-back" depth={0} />
          <Card className="s-doc s-front" depth={80}>
            <i className="slide-line head" style={{ width: '52%' }} />
            <Row tone="bad" w={74} tag="det" />
            <Row tone="warn" w={66} tag="ret" />
            <Row tone="mute" w={80} />
          </Card>
        </>
      );

    /* History — kept in your own browser. */
    case 'f8':
      return (
        <>
          {[0, 1, 2].map((i) => (
            <Card key={i} className={`s-hist s-h${i + 1}`} depth={80 - i * 30}>
              <Row tone={i === 0 ? 'bad' : i === 1 ? 'warn' : 'ok'} w={70 - i * 8} />
            </Card>
          ))}
        </>
      );

    /* Your turn. */
    default:
      return (
        <div className="slide-orb">
          <Image src="/logo-mark.png" alt="" width={564} height={472} className="slide-mark" />
        </div>
      );
  }
}
