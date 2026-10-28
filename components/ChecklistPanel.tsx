'use client';

import { useSyncExternalStore } from 'react';
import {
  clearProgress,
  getDoneSteps,
  getServerDoneSteps,
  subscribeProgress,
  toggleStep,
} from '@/lib/checklist-progress';
import type { ChecklistStep } from '@/lib/analysis/types';
import { CheckIcon } from './icons';

/**
 * The "what should I do next" checklist, with progress the user owns.
 *
 * Progress lives in this browser only — see lib/checklist-progress.ts for why.
 * Nothing here reports completion to the server, and ticking every box is
 * explicitly not framed as "you are now safe".
 */
export function ChecklistPanel({ reportId, steps }: { reportId: string; steps: ChecklistStep[] }) {
  const done = useSyncExternalStore(
    subscribeProgress,
    () => getDoneSteps(reportId),
    getServerDoneSteps,
  );

  const completed = steps.filter((s) => done.includes(s.id)).length;
  const pct = steps.length === 0 ? 0 : Math.round((completed / steps.length) * 100);
  const allDone = steps.length > 0 && completed === steps.length;

  return (
    <div>
      <div className="ck-head">
        <div className="ck-progress">
          <div className="meter-track" role="presentation">
            <div className="meter-fill" style={{ width: `${pct}%` }} />
          </div>
          <span>
            {completed} of {steps.length} done
          </span>
        </div>
        {completed > 0 && (
          <button type="button" className="btn btn-ghost" onClick={() => clearProgress(reportId)}>
            Reset progress
          </button>
        )}
      </div>

      <ul className="ck-list">
        {steps.map((step) => {
          const isDone = done.includes(step.id);
          return (
            <li className="ck-item" key={step.id} data-done={isDone}>
              <button
                type="button"
                role="checkbox"
                aria-checked={isDone}
                aria-label={isDone ? `Mark "${step.action}" as not done` : `Mark "${step.action}" as done`}
                className="ck-box"
                onClick={() => toggleStep(reportId, step.id)}
              >
                <CheckIcon />
              </button>
              <div className="ck-body">
                <p className="ck-action">{step.action}</p>
                <p className="ck-why">{step.why}</p>
              </div>
            </li>
          );
        })}
      </ul>

      {allDone && (
        <div className="ck-done-banner">
          <CheckIcon />
          <span>
            Every step recorded. That means you have carried out the checks this report could
            suggest — it does not by itself make the request genuine. If anything you found
            contradicts the sender, treat that as your answer.
          </span>
        </div>
      )}

      <p style={{ marginTop: 12, color: 'var(--text-faint)', fontSize: 12, lineHeight: 1.55 }}>
        Your progress is stored in this browser only. It is never sent to the server, so no one
        else can see which steps you have taken.
      </p>
    </div>
  );
}
