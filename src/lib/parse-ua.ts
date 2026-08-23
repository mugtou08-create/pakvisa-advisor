export function parseUserAgent(ua: string): { device: string; browser: string; os: string } {
  if (!ua) return { device: 'Unknown', browser: 'Unknown', os: 'Unknown' };

  let device = 'Desktop';
  let browser = 'Other';
  let os = 'Other';

  // Device detection
  if (/Mobile|Android.*Mobile|iPhone|iPod|BlackBerry|Opera Mini|IEMobile|WPDesktop/i.test(ua)) {
    device = 'Mobile';
  } else if (/iPad|Android(?!.*Mobile)|Tablet|Kindle|Silk|PlayBook|Nexus 7|Nexus 9|Nexus 10/i.test(ua)) {
    device = 'Tablet';
  }

  // Browser detection (order matters - check more specific first)
  if (/Edg\//i.test(ua)) browser = 'Edge';
  else if (/OPR|Opera/i.test(ua)) browser = 'Opera';
  else if (/SamsungBrowser/i.test(ua)) browser = 'Samsung';
  else if (/UCBrowser/i.test(ua)) browser = 'UC Browser';
  else if (/Firefox/i.test(ua)) browser = 'Firefox';
  else if (/CriOS/i.test(ua)) browser = 'Chrome (iOS)';
  else if (/Chrome/i.test(ua)) browser = 'Chrome';
  else if (/Safari/i.test(ua)) browser = 'Safari';
  else if (/MSIE|Trident/i.test(ua)) browser = 'IE';

  // OS detection
  if (/Windows NT 10/i.test(ua)) os = 'Windows';
  else if (/Windows NT 6.3/i.test(ua)) os = 'Windows 8.1';
  else if (/Windows NT 6.1/i.test(ua)) os = 'Windows 7';
  else if (/Windows/i.test(ua)) os = 'Windows';
  else if (/Mac OS X/i.test(ua)) {
    if (/iPhone|iPad/i.test(ua)) os = device === 'Tablet' ? 'iPadOS' : 'iOS';
    else os = 'macOS';
  }
  else if (/Android/i.test(ua)) os = 'Android';
  else if (/Linux/i.test(ua)) os = 'Linux';
  else if (/CrOS/i.test(ua)) os = 'ChromeOS';

  return { device, browser, os };
}

export function categorizeReferrer(referrer: string): string {
  if (!referrer || referrer === '') return 'direct';

  const r = referrer.toLowerCase();

  // Organic search engines
  if (/google\.|bing\.|yahoo\.|duckduckgo\.|baidu\.|yandex\.|ecosia\./i.test(r)) {
    return 'organic';
  }

  // Social media
  if (/facebook\.|instagram\.|twitter\.|x\.com|linkedin\.|whatsapp\.|tiktok\.|pinterest\.|reddit\.|t\.me|telegram/i.test(r)) {
    return 'social';
  }

  // Own site (internal navigation)
  if (/pakvisaadvisor\.com|pakvisa-advisor\.vercel\.app|localhost/i.test(r)) {
    return 'direct';
  }

  return 'referral';
}
