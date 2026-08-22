// Color extraction & vibrant palette generation for sponsor logos

export interface SponsorColorPalette {
  primary: string; // dominant vibrant color hex
  secondary: string; // companion neon color hex
  accent: string; // highlight color hex
  glow: string; // box-shadow string
  auraRgba: string; // rgba string for radial smoke / plasma glow
  emberColors: Array<{
    bg: string;
    glow: string;
    size: string;
    left: string;
    bottom: string;
    duration: string;
    delay: string;
  }>;
}

// Predefined verified brand color signatures for instant zero-latency rendering
const BRAND_COLOR_MAP: Record<string, { primary: string; secondary: string; accent: string }> = {
  starzbet: { primary: '#facc15', secondary: '#f59e0b', accent: '#fef08a' }, // Gold / Amber
  ligobet: { primary: '#10b981', secondary: '#22c55e', accent: '#4ade80' }, // Neon Green
  bizbet: { primary: '#06b6d4', secondary: '#0ea5e9', accent: '#38bdf8' }, // Electric Cyan / Azure
  grandpashabet: { primary: '#f59e0b', secondary: '#fbbf24', accent: '#ef4444' }, // Royal Gold / Orange
  hizlicasino: { primary: '#ef4444', secondary: '#f97316', accent: '#fb923c' }, // Flame Red / Orange
  gobahis: { primary: '#10b981', secondary: '#06b6d4', accent: '#34d399' }, // Emerald / Cyan
  grbets: { primary: '#a855f7', secondary: '#c084fc', accent: '#d946ef' }, // Neon Purple / Magenta
  betvole: { primary: '#eab308', secondary: '#f97316', accent: '#38bdf8' },
  matbet: { primary: '#ef4444', secondary: '#f59e0b', accent: '#ffffff' },
  jojobet: { primary: '#10b981', secondary: '#eab308', accent: '#34d399' },
  holiganbet: { primary: '#eab308', secondary: '#f59e0b', accent: '#fde047' },
  betpas: { primary: '#3b82f6', secondary: '#60a5fa', accent: '#93c5fd' },
  parimatch: { primary: '#facc15', secondary: '#000000', accent: '#fde047' },
};

function hexToRgba(hex: string, alpha: number): string {
  let c = hex.replace('#', '');
  if (c.length === 3) {
    c = c.split('').map((char) => char + char).join('');
  }
  const num = parseInt(c, 16);
  if (isNaN(num)) return `rgba(168, 85, 247, ${alpha})`;
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Fallback palette generator based on string hash
function getDeterministicPalette(name: string): { primary: string; secondary: string; accent: string } {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const palettes = [
    { primary: '#c084fc', secondary: '#a855f7', accent: '#e879f9' }, // Violet
    { primary: '#38bdf8', secondary: '#06b6d4', accent: '#67e8f9' }, // Cyan
    { primary: '#facc15', secondary: '#f59e0b', accent: '#fef08a' }, // Gold
    { primary: '#4ade80', secondary: '#10b981', accent: '#86efac' }, // Emerald
    { primary: '#f472b6', secondary: '#ec4899', accent: '#fbcfe8' }, // Pink
    { primary: '#fb923c', secondary: '#f97316', accent: '#fdba74' }, // Orange
  ];
  const index = Math.abs(hash) % palettes.length;
  return palettes[index];
}

export function getSponsorPalette(sponsor: {
  name?: string;
  slug?: string;
  accent_color?: string;
  badge_color?: string;
}): SponsorColorPalette {
  const slug = (sponsor.slug || sponsor.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  
  let baseColors = BRAND_COLOR_MAP[slug];
  
  if (!baseColors) {
    for (const key in BRAND_COLOR_MAP) {
      if (slug.includes(key) || key.includes(slug)) {
        baseColors = BRAND_COLOR_MAP[key];
        break;
      }
    }
  }

  if (!baseColors && sponsor.accent_color && sponsor.accent_color.startsWith('#')) {
    baseColors = {
      primary: sponsor.accent_color,
      secondary: '#c084fc',
      accent: '#ffffff',
    };
  }

  if (!baseColors) {
    baseColors = getDeterministicPalette(sponsor.name || 'sponsor');
  }

  const { primary, secondary, accent } = baseColors;

  const emberPositions = [
    { left: '12%', bottom: '2%', size: 'w-1.5 h-1.5', duration: '4.6s', delay: '0s', colorHex: primary },
    { left: '26%', bottom: '5%', size: 'w-1 h-1', duration: '5.4s', delay: '-1.6s', colorHex: secondary },
    { left: '42%', bottom: '1%', size: 'w-2 h-2', duration: '4.0s', delay: '-2.8s', colorHex: accent },
    { left: '58%', bottom: '4%', size: 'w-1.5 h-1.5', duration: '5.8s', delay: '-2.2s', colorHex: primary },
    { left: '72%', bottom: '2%', size: 'w-1 h-1', duration: '4.3s', delay: '-0.8s', colorHex: secondary },
    { left: '86%', bottom: '6%', size: 'w-1.5 h-1.5', duration: '5.0s', delay: '-3.4s', colorHex: accent },
  ];

  const emberColors = emberPositions.map((p) => ({
    bg: p.colorHex,
    glow: `0 0 10px ${hexToRgba(p.colorHex, 0.95)}, 0 0 4px #ffffff`,
    size: p.size,
    left: p.left,
    bottom: p.bottom,
    duration: p.duration,
    delay: p.delay,
  }));

  return {
    primary,
    secondary,
    accent,
    glow: `0 0 22px ${hexToRgba(primary, 0.65)}, 0 0 8px ${hexToRgba(secondary, 0.45)}`,
    auraRgba: hexToRgba(primary, 0.35),
    emberColors,
  };
}
