'use client';

import { useState } from 'react';
import { responsePlanFor } from '@/lib/analysis/response-plan';
import type { UserActionState } from '@/lib/analysis/types';

const CHOICES: Array<{ value: UserActionState; label: string; hint: string }> = [
  { value: 'not_acted', label: 'I have not acted', hint: 'I only received this' },
  { value: 'opened_link', label: 'I opened the link', hint: 'I visited the page' },
  { value: 'shared_credentials', label: 'I shared a code or detail', hint: 'OTP, PIN, password or card detail' },
  { value: 'approved_payment', label: 'I approved a payment', hint: 'UPI collect or payment authorisation' },
  { value: 'sent_money', label: 'I sent money', hint: 'A transfer has already happened' },
];

/**
 * The product's action layer. It adapts the next steps to what the person
 * reports actually happened; it never claims to reverse a transfer or recover
 * an account on their behalf.
 */
export function ResponsePlanPanel() {
  const [state, setState] = useState<UserActionState>('not_acted');
  const plan = responsePlanFor(state);

  return (
    <section className="response-panel" aria-labelledby="response-plan-title">
      <div className="response-panel-head">
        <span className="response-kicker">PERSONAL RESPONSE</span>
        <h2 id="response-plan-title">What have you done so far?</h2>
        <p>The safest next step depends on what happened. Choose the closest option — you can change it at any time.</p>
      </div>

      <div className="response-choices" role="group" aria-label="Your actions so far">
        {CHOICES.map((choice) => (
          <button
            type="button"
            key={choice.value}
            className="response-choice"
            aria-pressed={state === choice.value}
            onClick={() => setState(choice.value)}
          >
            <strong>{choice.label}</strong>
            <span>{choice.hint}</span>
          </button>
        ))}
      </div>

      {plan ? (
        <div className="response-plan" aria-live="polite">
          <div className={state === 'sent_money' || state === 'approved_payment' || state === 'shared_credentials' ? 'response-alert' : 'response-plan-label'}>
            {state === 'sent_money' || state === 'approved_payment' || state === 'shared_credentials'
              ? 'Time-sensitive: take these steps now'
              : 'Your next steps'}
          </div>
          <h3>{plan.title}</h3>
          <p className="response-summary">{plan.summary}</p>
          <ol className="response-step-list">
            {plan.steps.map((step, index) => (
              <li key={step.action}>
                <span className="response-step-number">{index + 1}</span>
                <div>
                  <strong>{step.action}</strong>
                  <p>{step.why}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      ) : (
        <div className="response-plan response-plan-calm" aria-live="polite">
          <h3>Pause before taking the next step</h3>
          <p className="response-summary">
            Do not click, reply, pay, share a code or install an app yet. Start with the checklist below and verify through a channel you choose yourself.
          </p>
        </div>
      )}
      <p className="response-disclaimer">
        TrustLens provides guidance only. It cannot freeze an account, reverse a transfer, contact a bank, or guarantee recovery. Use the official channel shown in your report.
      </p>
    </section>
  );
}
