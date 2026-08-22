export interface DeviceInfo {
  deviceType: 'mobile' | 'desktop' | 'tablet' | 'bot';
  os: string;
  osVersion: string;
  browser: string;
  browserVersion: string;
  isMobile: boolean;
  isDesktop: boolean;
  isTablet: boolean;
  isBot: boolean;
  screenWidth: number;
  screenHeight: number;
  screenResolution: string;
  userAgent: string;
  language: string;
  platform: string;
  isTouchDevice: boolean;
}

export function detectDevice(customUserAgent?: string): DeviceInfo {
  const ua = customUserAgent || (typeof navigator !== 'undefined' ? navigator.userAgent : '') || '';
  const lang = typeof navigator !== 'undefined' ? navigator.language || 'tr-TR' : 'tr-TR';
  const platform = typeof navigator !== 'undefined' ? (navigator.platform || '') : '';
  const screenWidth = typeof window !== 'undefined' ? window.screen.width : 1920;
  const screenHeight = typeof window !== 'undefined' ? window.screen.height : 1080;
  const isTouchDevice =
    typeof window !== 'undefined'
      ? 'ontouchstart' in window || navigator.maxTouchPoints > 0
      : false;

  // Bot detection
  const isBot = /bot|googlebot|crawler|spider|robot|crawling|lighthouse|headless/i.test(ua);

  // Tablet detection (iPad, Android Tablet, etc.)
  const isTablet =
    /(ipad|tablet|(android(?!.*mobile))|(windows(?!.*phone)(.*touch))|kindle|playbook|silk)/i.test(ua) ||
    (platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  // Mobile detection (iPhone, Android Mobile, Windows Phone, etc.)
  const isMobile =
    !isTablet &&
    /(iphone|ipod|android.*mobile|windows phone|blackberry|bb10|mobile|opera mini|iemobile)/i.test(ua);

  // Desktop
  const isDesktop = !isMobile && !isTablet && !isBot;

  let deviceType: 'mobile' | 'desktop' | 'tablet' | 'bot' = 'desktop';
  if (isBot) deviceType = 'bot';
  else if (isTablet) deviceType = 'tablet';
  else if (isMobile) deviceType = 'mobile';
  else deviceType = 'desktop';

  // OS Detection
  let os = 'Bilinmiyor';
  let osVersion = '';
  if (/windows nt 10.0/i.test(ua)) { os = 'Windows'; osVersion = '10/11'; }
  else if (/windows nt 6.3/i.test(ua)) { os = 'Windows'; osVersion = '8.1'; }
  else if (/windows nt 6.2/i.test(ua)) { os = 'Windows'; osVersion = '8'; }
  else if (/windows nt 6.1/i.test(ua)) { os = 'Windows'; osVersion = '7'; }
  else if (/windows/i.test(ua)) { os = 'Windows'; osVersion = ''; }
  else if (/iphone|ipad|ipod/i.test(ua)) {
    os = /ipad/i.test(ua) ? 'iPadOS' : 'iOS';
    const match = ua.match(/os (\d+[._]\d+)/i);
    if (match) osVersion = match[1].replace('_', '.');
  }
  else if (/android/i.test(ua)) {
    os = 'Android';
    const match = ua.match(/android (\d+(\.\d+)?)/i);
    if (match) osVersion = match[1];
  }
  else if (/macintosh|mac os x/i.test(ua)) {
    os = 'macOS';
    const match = ua.match(/mac os x (\d+[._]\d+)/i);
    if (match) osVersion = match[1].replace(/_/g, '.');
  }
  else if (/linux/i.test(ua)) { os = 'Linux'; osVersion = ''; }
  else if (/cros/i.test(ua)) { os = 'Chrome OS'; osVersion = ''; }

  // Browser Detection
  let browser = 'Bilinmiyor';
  let browserVersion = '';

  if (/edg\//i.test(ua)) {
    browser = 'Edge';
    const match = ua.match(/edg\/(\d+(\.\d+)?)/i);
    if (match) browserVersion = match[1];
  } else if (/opr\/|opera/i.test(ua)) {
    browser = 'Opera';
    const match = ua.match(/(opr|opera)\/(\d+(\.\d+)?)/i);
    if (match) browserVersion = match[2];
  } else if (/samsungbrowser/i.test(ua)) {
    browser = 'Samsung Internet';
    const match = ua.match(/samsungbrowser\/(\d+(\.\d+)?)/i);
    if (match) browserVersion = match[1];
  } else if (/chrome|crios/i.test(ua)) {
    browser = 'Chrome';
    const match = ua.match(/(chrome|crios)\/(\d+(\.\d+)?)/i);
    if (match) browserVersion = match[2];
  } else if (/firefox|fxios/i.test(ua)) {
    browser = 'Firefox';
    const match = ua.match(/(firefox|fxios)\/(\d+(\.\d+)?)/i);
    if (match) browserVersion = match[2];
  } else if (/safari/i.test(ua) && !/chrome|crios|android/i.test(ua)) {
    browser = 'Safari';
    const match = ua.match(/version\/(\d+(\.\d+)?)/i);
    if (match) browserVersion = match[1];
  } else if (/telegram/i.test(ua)) {
    browser = 'Telegram In-App';
  }

  return {
    deviceType,
    os,
    osVersion,
    browser,
    browserVersion,
    isMobile,
    isDesktop,
    isTablet,
    isBot,
    screenWidth,
    screenHeight,
    screenResolution: `${screenWidth}x${screenHeight}`,
    userAgent: ua,
    language: lang,
    platform,
    isTouchDevice,
  };
}

export function getSessionId(): string {
  if (typeof window === 'undefined') return 'sess_' + Math.random().toString(36).substring(2, 10);
  try {
    let sessId = sessionStorage.getItem('shelby_session_id');
    if (!sessId) {
      sessId = 'sess_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 8);
      sessionStorage.setItem('shelby_session_id', sessId);
    }
    return sessId;
  } catch {
    return 'sess_' + Math.random().toString(36).substring(2, 10);
  }
}

export function getVisitorId(): string {
  if (typeof window === 'undefined') return 'vis_' + Math.random().toString(36).substring(2, 10);
  try {
    let visId = localStorage.getItem('shelby_visitor_id');
    if (!visId) {
      visId = 'vis_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 8);
      localStorage.setItem('shelby_visitor_id', visId);
    }
    return visId;
  } catch {
    return 'vis_' + Math.random().toString(36).substring(2, 10);
  }
}
