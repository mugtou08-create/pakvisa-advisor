'use client';

import Script from 'next/script';

/**
 * Google Analytics component.
 * Set NEXT_PUBLIC_GA_MEASUREMENT_ID env var to enable.
 * When empty/not set, no scripts are rendered.
 *
 * Uses strategy="lazyOnload" to defer loading until after the page
 * is fully interactive. This prevents GA from blocking FCP/LCP
 * and reduces Total Blocking Time (TBT) on PageSpeed.
 */
export function GoogleAnalytics() {
  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

  if (!measurementId) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="lazyOnload"
      />
      <Script id="google-analytics" strategy="lazyOnload">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${measurementId}', {
            page_title: document.title,
            page_location: window.location.href,
          });
        `}
      </Script>
    </>
  );
}

/**
 * Google AdSense component (for future use).
 * Set NEXT_PUBLIC_ADSENSE_CLIENT_ID env var to enable.
 *
 * Uses strategy="lazyOnload" to defer loading until after the page
 * is fully interactive — prevents blocking FCP/LCP.
 */
export function GoogleAdSense() {
  const clientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;

  if (!clientId) return null;

  return (
    <Script
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`}
      crossOrigin="anonymous"
      strategy="lazyOnload"
    />
  );
}
