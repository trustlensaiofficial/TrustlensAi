'use client';

import { useEffect, useState } from 'react';
import './InstallApp.css';

type InstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }> };

export function InstallApp() {
  const [promptEvent, setPromptEvent] = useState<InstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [ios, setIos] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
    // Read the browser's standalone display mode once after hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setInstalled(standalone);
    setIos(/iphone|ipad|ipod/i.test(navigator.userAgent));
    setVisible(true);
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as InstallPromptEvent);
    };
    const onInstalled = () => { setInstalled(true); setPromptEvent(null); };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  async function install() {
    if (!promptEvent) return;
    await promptEvent.prompt();
    const choice = await promptEvent.userChoice;
    if (choice.outcome === 'accepted') setInstalled(true);
    setPromptEvent(null);
  }

  if (!visible) return null;
  return (
    <section className="install-card" aria-labelledby="install-title">
      <div className="install-mark" aria-hidden="true">↗</div>
      <div className="install-copy">
        <h2 id="install-title">Keep TrustLens one tap away</h2>
        <p>{installed ? 'TrustLens is installed on this device.' : 'Add TrustLens to your home screen for a clean, app-like experience. Your checks and privacy choices remain under your control.'}</p>
        {!installed && ios && <p className="install-help">On iPhone or iPad: tap Share in Safari, then choose “Add to Home Screen”.</p>}
        {!installed && !ios && !promptEvent && <p className="install-help">If your browser supports installation, open its menu and choose “Install app” or “Add to Home screen”.</p>}
      </div>
      {!installed && promptEvent && <button className="install-action" type="button" onClick={install}>Add to home screen</button>}
      {installed && <span className="install-status">Installed</span>}
    </section>
  );
}
