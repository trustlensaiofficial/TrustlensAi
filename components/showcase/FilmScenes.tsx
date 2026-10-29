'use client';

import { BrandMark } from '../BrandMark';
import {
  AlertIcon, BriefcaseIcon, CheckIcon, DocumentIcon, EvidenceIcon,
  GlobeIcon, MessageIcon, ReceiptIcon, ScalesIcon, ShieldIcon,
} from '../icons';

/**
 * One visual per film scene.
 *
 * Each reveals its parts on a stagger derived from time-in-scene, so the
 * motion tracks the narration instead of looping independently. Pure
 * presentation — nothing here calls the API.
 */
export function SceneVisual({ id, t }: { id: string; t: number }) {
  const at = (ms: number) => t >= ms;
  const delay = (i: number) => ({ animationDelay: `${i * 90}ms` });

  switch (id) {
    case 'what':
      return (
        <div className="sc-closing">
          <div className="sc-closing-ring"><BrandMark size={62} idSuffix="what" /></div>
          <div className="sc-chips">
            {[
              { i: MessageIcon, l: 'A message' },
              { i: GlobeIcon, l: 'A link' },
              { i: ReceiptIcon, l: 'A request for money' },
            ].map((c, n) => at(1200 + n * 900) && (
              <span className="sc-chip" key={c.l} data-on="true" style={delay(n)}>
                <c.i /> {c.l}
              </span>
            ))}
          </div>
          {at(4400) && (
            <p className="sc-in" style={{ color: 'var(--sc-muted)', fontSize: 14, maxWidth: '40ch' }}>
              Examined before you act on it.
            </p>
          )}
        </div>
      );

    case 'problem':
      return (
        <div className="sc-scene" style={{ display: 'grid', gap: 16, justifyItems: 'center' }}>
          <div className="sc-reportcard" style={{ maxWidth: 400 }}>
            <div className="sc-reportcard-top">
              <AlertIcon style={{ width: 20, height: 20, color: 'var(--sc-crit)' }} />
              <span className="sc-badge">Dangerous</span>
            </div>
            <h4 style={{ color: 'var(--sc-crit)' }}>This message looks suspicious.</h4>
            {at(3200) && (
              <p className="sc-in" style={{ color: 'var(--sc-faint)', fontSize: 12.5, marginTop: 6 }}>
                …and then nothing. No evidence, no next step.
              </p>
            )}
          </div>
          {at(5600) && (
            <p className="sc-in-up" style={{ color: 'var(--sc-ice)', fontSize: 'clamp(15px,2.2vw,19px)', fontWeight: 600 }}>
              So — what should I actually do?
            </p>
          )}
        </div>
      );

    case 'f1':
      return (
        <div className="sc-scene">
          <div className="sc-msg">
            <div className="sc-msg-top">
              <span className="sc-msg-avatar" />
              <div><div className="sc-msg-from">Accounts Receivable</div><div className="sc-msg-meta">to you</div></div>
            </div>
            <p className="sc-msg-body">
              Invoice INV-20418 is overdue. Please note{' '}
              {at(2400) ? <mark>our bank details have changed</mark> : 'our bank details have changed'}.{' '}
              {at(4200) ? <mark>There is no need to call to confirm.</mark> : 'There is no need to call to confirm.'}
            </p>
          </div>
          {at(5800) && (
            <div className="sc-scan-row sc-in" style={{ maxWidth: 460, margin: '14px auto 0' }}>
              <span className="sc-dot sc-dot-crit" />
              <b>Payment details changed on this invoice</b>
            </div>
          )}
        </div>
      );

    case 'f2':
      return (
        <div className="sc-scene">
          <div className="sc-chips">
            {[
              { i: MessageIcon, l: 'Message' },
              { i: GlobeIcon, l: 'Link' },
              { i: BriefcaseIcon, l: 'Job offer' },
              { i: ReceiptIcon, l: 'Invoice' },
              { i: DocumentIcon, l: 'Proposal' },
            ].map((c, n) => at(500 + n * 620) && (
              <span className="sc-chip" key={c.l} data-on={at(4600) && c.l === 'Invoice'} style={delay(n)}>
                <c.i /> {c.l}
              </span>
            ))}
          </div>
          {at(5400) && (
            <p className="sc-in" style={{ textAlign: 'center', marginTop: 20, color: 'var(--sc-muted)', fontSize: 13.5 }}>
              Pick <b style={{ color: 'var(--sc-ice-bright)' }}>Invoice</b>, and it starts looking for changed
              payment details, urgency, and reasons not to phone.
            </p>
          )}
        </div>
      );

    case 'f3':
      return (
        <div className="sc-scene">
          <div className="sc-scan">
            {[
              'Rules read the wording',
              'Links taken apart, offline',
              'Only what can be checked, is checked',
              'Then the model interprets what was found',
            ].map((s, n) => at(n * 1600) && (
              <div className="sc-scan-row" key={s} style={delay(n)}>
                <span className={at(n * 1600 + 900) ? 'sc-dot sc-dot-ok' : 'sc-dot'} />
                <b>{s}</b>
              </div>
            ))}
          </div>
          {at(7000) && (
            <p className="sc-in" style={{ textAlign: 'center', marginTop: 16, color: 'var(--sc-faint)', fontSize: 12.5 }}>
              The model never runs first — it only sees what was already established.
            </p>
          )}
        </div>
      );

    case 'f4':
      return (
        <div className="sc-scene">
          <div className="sc-prov">
            {at(400) && <div className="sc-prov-card sc-prov-known" style={delay(0)}><h4>Rule match</h4><p>A fixed rule fired. Reproducible, and it shows the words that triggered it.</p></div>}
            {at(2400) && <div className="sc-prov-card sc-prov-infer" style={delay(1)}><h4>Retrieved fact</h4><p>A check actually ran and returned this. An observation, not an opinion.</p></div>}
            {at(4600) && <div className="sc-prov-card sc-prov-unknown" style={delay(2)}><h4>Model inference</h4><p>An interpretation. It can be wrong, and it is labelled everywhere it appears.</p></div>}
          </div>
        </div>
      );

    case 'f5':
      return (
        <div className="sc-scene">
          <div className="sc-split">
            {at(400) && (
              <div className="sc-split-col sc-split-ok">
                <h4>Checked</h4>
                <ul style={{ margin: 0, paddingLeft: 16 }}>
                  <li>17 rules applied to the text</li>
                  <li>Link structure parsed offline</li>
                </ul>
              </div>
            )}
            {at(2600) && (
              <div className="sc-split-col sc-split-unknown" style={delay(1)}>
                <h4>Not established</h4>
                <ul style={{ margin: 0, paddingLeft: 16 }}>
                  <li>Whether the sender is really your supplier</li>
                  <li>Email authentication records</li>
                </ul>
              </div>
            )}
          </div>
          {at(5600) && (
            <p className="sc-in" style={{ textAlign: 'center', marginTop: 16, color: 'var(--sc-warn)', fontSize: 13 }}>
              No warning found is not the same as verified safe.
            </p>
          )}
        </div>
      );

    case 'f6':
      return (
        <div className="sc-scene">
          <div className="sc-steps">
            {[
              'Call the supplier on a number you already had — not one from this email.',
              'Hold the payment until that call is done.',
              'Check the account name matches their registered company name.',
            ].map((s, n) => at(n * 1900) && (
              <div className="sc-step" key={s} style={delay(n)}>
                <span className="sc-step-n">{n + 1}</span>
                <p>{s}</p>
              </div>
            ))}
          </div>
          {at(6600) && (
            <p className="sc-in" style={{ textAlign: 'center', marginTop: 16, color: 'var(--sc-ice)', fontSize: 13.5, fontWeight: 600 }}>
              One phone call defeats this entire fraud.
            </p>
          )}
        </div>
      );

    case 'f7':
      return (
        <div className="sc-scene">
          <div className="sc-reportcard">
            <div className="sc-reportcard-top">
              <ScalesIcon style={{ width: 18, height: 18, color: 'var(--sc-ice)' }} />
              <span className="sc-badge">Strong warning signs</span>
            </div>
            <h4>Invoice with changed bank details</h4>
            {[
              { i: AlertIcon, l: '3 warning signs, each with its wording' },
              { i: EvidenceIcon, l: 'Evidence record — checked and not checked' },
              { i: CheckIcon, l: '7 next steps, in priority order' },
            ].map((r, n) => at(1600 + n * 1300) && (
              <div className="sc-reportcard-row sc-in" key={r.l} style={delay(n)}>
                <r.i style={{ width: 15, height: 15, color: 'var(--sc-ice)' }} /> {r.l}
              </div>
            ))}
          </div>
          {at(6200) && (
            <p className="sc-in" style={{ textAlign: 'center', marginTop: 14, color: 'var(--sc-faint)', fontSize: 12.5 }}>
              Copy it, or download it — the summary carries its own caveats.
            </p>
          )}
        </div>
      );

    case 'f8':
      return (
        <div className="sc-scene">
          {[
            'Invoice with changed bank details',
            'Suspicious recruitment offer',
            'Misleading payment link',
          ].map((l, n) => at(n * 1200) && (
            <div className="sc-histrow" key={l} style={delay(n)}>
              <span className="sc-dot sc-dot-crit" />
              <b>{l}</b>
            </div>
          ))}
          {at(4400) && (
            <p className="sc-in" style={{ textAlign: 'center', marginTop: 14 }}>
              <span className="sc-lock" style={{ justifyContent: 'center' }}>
                <ShieldIcon /> Held in your browser — not listable by anyone else
              </span>
            </p>
          )}
        </div>
      );

    default:
      return (
        <div className="sc-closing">
          <div className="sc-closing-ring"><BrandMark size={62} idSuffix="invite" /></div>
          <h3 style={{ fontSize: 'clamp(19px, 3vw, 27px)' }}>
            See the signal. Understand the evidence. Know your next move.
          </h3>
          {at(2600) && (
            <p className="sc-in" style={{ color: 'var(--sc-muted)', fontSize: 14, maxWidth: '42ch' }}>
              Everything you just saw is live. Open the prototype and try it on a real example.
            </p>
          )}
        </div>
      );
  }
}
