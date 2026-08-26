'client';

import { Download, X, Smartphone } from 'lucide-react';
import { usePWA } from '@/lib/use-pwa';

export function PwaInstallPrompt() {
  const { showInstallPrompt, installApp, dismissInstall, isInstalled, isOnline } = usePWA();

  // Derive visibility from props/state — no extra setState needed
  const visible = showInstallPrompt && !isInstalled;

  if (!visible) {
    return (
      <>
        {/* Offline banner (always rendered so it appears immediately) */}
        {!isOnline && (
          <div className="fixed top-0 left-0 right-0 z-[100] bg-amber-500 text-white text-center text-xs font-medium py-2 px-4 animate-in slide-in-from-top">
            You're offline — some features may be limited
          </div>
        )}
      </>
    );
  }

  const handleInstall = async () => {
    const accepted = await installApp();
    if (!accepted) {
      dismissInstall();
    }
  };

  return (
    <>
      {/* Offline banner */}
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 z-[100] bg-amber-500 text-white text-center text-xs font-medium py-2 px-4 animate-in slide-in-from-top">
          You're offline — some features may be limited
        </div>
      )}

      {/* Install prompt */}
      <div className="fixed bottom-0 left-0 right-0 z-[100] animate-in slide-in-from-bottom duration-300">
        <div className="mx-3 mb-3 md:mx-auto md:max-w-md rounded-2xl bg-card border border-border shadow-2xl shadow-black/10 p-4 backdrop-blur-xl">
          {/* Close button */}
          <button
            onClick={dismissInstall}
            className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-muted transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Dismiss install prompt"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>

          <div className="flex items-center gap-4">
            {/* App icon */}
            <div className="shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <img
                src="/icons/icon-192.png"
                alt="PakVisa"
                width={56}
                height={56}
                className="w-12 h-12 rounded-xl"
              />
            </div>

            {/* Text content */}
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-foreground leading-tight">
                Install PakVisa Advisor
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                Add to home screen for instant access — no browser needed.
              </p>

              {/* Install button */}
              <button
                onClick={handleInstall}
                className="mt-2.5 inline-flex items-center gap-2 px-5 py-2 rounded-full text-xs font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-md shadow-emerald-500/25 hover:shadow-lg hover:shadow-emerald-500/30 transition-all duration-200 active:scale-[0.97]"
              >
                <Download className="w-3.5 h-3.5" />
                Install App
              </button>
            </div>
          </div>

          {/* Android hint */}
          <div className="mt-3 pt-3 border-t border-border/50 flex items-center gap-2 text-[10px] text-muted-foreground">
            <Smartphone className="w-3 h-3" />
            <span>Works on Android &amp; desktop. Free, no Play Store needed.</span>
          </div>
        </div>
      </div>
    </>
  );
}
