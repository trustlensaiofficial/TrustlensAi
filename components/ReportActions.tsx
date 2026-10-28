'use client';

import { useCallback, useRef, useState } from 'react';
import type { Report } from '@/lib/analysis/types';
import { buildPlainSummary, reportFileName } from '@/lib/report-summary';
import { CheckIcon, CopyIcon, DownloadIcon } from './icons';

/**
 * Copy and export. Both build their text from the report object, so neither
 * can describe a check that did not run.
 */
export function ReportActions({ report }: { report: Report }) {
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const copy = useCallback(async () => {
    const text = buildPlainSummary(report);
    if (timer.current) clearTimeout(timer.current);
    try {
      // The async clipboard API needs a secure context; fall back for http.
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const area = document.createElement('textarea');
        area.value = text;
        area.setAttribute('readonly', '');
        area.style.position = 'fixed';
        area.style.opacity = '0';
        document.body.appendChild(area);
        area.select();
        const ok = document.execCommand('copy');
        document.body.removeChild(area);
        if (!ok) throw new Error('copy rejected');
      }
      setFailed(false);
      setCopied(true);
    } catch {
      setCopied(false);
      setFailed(true);
    }
    timer.current = setTimeout(() => {
      setCopied(false);
      setFailed(false);
    }, 2600);
  }, [report]);

  const download = useCallback(() => {
    const blob = new Blob([buildPlainSummary(report)], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = reportFileName(report);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    // Revoke on the next tick so the download has started.
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, [report]);

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9, alignItems: 'center' }}>
      <button type="button" className="btn btn-secondary" onClick={() => void copy()}>
        {copied ? <CheckIcon /> : <CopyIcon />}
        {copied ? 'Copied' : failed ? 'Press Ctrl+C' : 'Copy summary'}
      </button>
      <button type="button" className="btn btn-secondary" onClick={download}>
        <DownloadIcon />
        Download report
      </button>
      <span aria-live="polite" className="sr-only">
        {copied ? 'Report summary copied to the clipboard.' : failed ? 'Copying was blocked by the browser.' : ''}
      </span>
    </div>
  );
}
