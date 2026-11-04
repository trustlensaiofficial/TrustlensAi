'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { UserActionState } from '@/lib/analysis/types';
import { responsePlanFor } from '@/lib/analysis/response-plan';
import { Alert, Arrow, Check, Globe, Lens, Lock, Phone, Shield } from './icons';

/**
 * What the person has already done, ordered by how far the incident has gone.
 *
 * The order matters: someone who has already sent money should not have to
 * scroll past advice meant for someone who only received a message. The most
 * advanced state they pick drives the plan.
 */
const STATES: Array<{ id: UserActionState; label: string; detail: string; icon: React.ReactNode; urgent?: boolean }> = [
  { id: 'not_acted', label: 'I only received it', detail: 'I have not clicked, replied or paid.', icon: <Shield /> },
  { id: 'opened_link', label: 'I opened the link', detail: 'I tapped it, but I am not sure what happened next.', icon: <Globe /> },
  { id: 'shared_credentials', label: 'I shared an OTP, PIN or password', detail: 'I typed or read out a code or account detail.', icon: <Lock />, urgent: true },
  { id: 'installed_app', label: 'I installed an app they asked for', detail: 'They told me to download something.', icon: <Alert />, urgent: true },
  { id: 'remote_access', label: 'I shared my screen or gave remote access', detail: 'They could see my screen or control my device.', icon: <Alert />, urgent: true },
  { id: 'approved_payment', label: 'I approved a payment request', detail: 'I entered my UPI PIN or approved a prompt.', icon: <Phone />, urgent: true },
  { id: 'sent_money', label: 'I transferred money', detail: 'Money has already left my account.', icon: <Phone />, urgent: true },
];

export function RespondFlow() {
  const [state, setState] = useState<UserActionState | null>(null);
  const plan = responsePlanFor(state);
  const urgent = state === 'sent_money' || state === 'approved_payment';

  return (
    <div className="respond">
      <fieldset className="check-block">
        <legend className="label">What has already happened?</legend>
        <ul className="state-list">
          {STATES.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                className={`state${state === s.id ? ' state-on' : ''}${s.urgent ? ' state-urgent' : ''}`}
                aria-pressed={state === s.id}
                onClick={() => setState(s.id)}
              >
                <span className="state-icon" aria-hidden="true">{s.icon}</span>
                <span className="state-text">
                  <span className="state-label">{s.label}</span>
                  <span className="state-detail">{s.detail}</span>
                </span>
                {state === s.id && <Check className="state-tick" />}
              </button>
            </li>
          ))}
        </ul>
      </fieldset>

      {/* Money gone is the one case where the helpline outranks everything. */}
      {urgent && (
        <section className="emergency" role="alert">
          <h2><Phone /> Call 1930 now</h2>
          <p>
            India&rsquo;s cyber-financial fraud helpline. The first hours decide whether a transfer
            can still be frozen, so call before you do anything else — including reading the rest
            of this page.
          </p>
          <div className="emergency-actions">
            <a className="btn btn-lg emergency-call" href="tel:1930">
              <Phone /> Call 1930
            </a>
            <a className="btn btn-secondary btn-lg" href="https://cybercrime.gov.in" target="_blank" rel="noopener noreferrer">
              File at cybercrime.gov.in <Arrow />
            </a>
          </div>
          <p className="emergency-note">
            Then call your bank on the number printed on your card. Keep the message, the
            transaction reference and any screenshots — you will be asked for them. No one can
            promise the money comes back, but reporting quickly is what makes a freeze possible.
          </p>
        </section>
      )}

      {plan && (
        <section className="section">
          <div className="card card-pad plan">
            <h2>{plan.title}</h2>
            <p className="lede plan-summary">{plan.summary}</p>
            <ol className="steps">
              {plan.steps.map((step, i) => (
                <li key={i} className="step rise" style={{ '--d': `${i * 55}ms` } as React.CSSProperties}>
                  <span className="step-num">{i + 1}</span>
                  <div>
                    <p className="step-action">{step.action}</p>
                    <p className="step-why">{step.why}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <p className="notice" style={{ marginTop: 'var(--s4)' }}>
            <Lens />
            <span>
              Not sure what the message actually was?{' '}
              <Link href="/check" className="link">Check it first</Link> — the report tells you which
              details were exposed, which changes what you need to do here.
            </span>
          </p>
        </section>
      )}

      {!state && (
        <p className="notice" style={{ marginTop: 'var(--s5)' }}>
          <Shield />
          <span>
            Pick whichever is closest. Nothing you choose here is sent anywhere — the guidance is
            produced on your own device.
          </span>
        </p>
      )}
    </div>
  );
}
