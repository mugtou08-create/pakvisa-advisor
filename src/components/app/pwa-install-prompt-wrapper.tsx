'use client';

import dynamic from 'next/dynamic';

const PwaInstallPrompt = dynamic(
  () => import('./pwa-install-prompt').then(m => ({ default: m.PwaInstallPrompt })),
  { ssr: false }
);

export function PwaInstallPromptWrapper() {
  return <PwaInstallPrompt />;
}
