import { Sponsor } from '../types';

export type SponsorCategory = 'main' | 'vip' | 'trusted';

export interface SponsorCategoryInfo {
  id: SponsorCategory;
  name: string;
  label: string;
  shortLabel: string;
  badgeText: string;
  badgeLabel: string;
  badgeClass: string;
  borderClass: string;
  accentClass: string;
  gradientClass: string;
  order: number;
}

export const SPONSOR_CATEGORIES: Record<SponsorCategory, SponsorCategoryInfo> = {
  main: {
    id: 'main',
    name: 'ANA SPONSORLAR',
    label: 'ANA SPONSORLAR',
    shortLabel: 'Ana Sponsor',
    badgeText: 'ANA SPONSOR',
    badgeLabel: '👑 ANA SPONSOR',
    badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm shadow-amber-500/20',
    borderClass: 'border-amber-500/40 hover:border-amber-400',
    accentClass: 'text-amber-400',
    gradientClass: 'from-amber-500 to-yellow-600',
    order: 1,
  },
  vip: {
    id: 'vip',
    name: 'VIP SPONSORLAR',
    label: 'VIP SPONSORLAR',
    shortLabel: 'VIP Sponsor',
    badgeText: 'VIP SPONSOR',
    badgeLabel: '⭐ VIP SPONSOR',
    badgeClass: 'bg-purple-500/20 text-purple-300 border-purple-500/40 shadow-sm shadow-purple-500/20',
    borderClass: 'border-purple-500/40 hover:border-purple-400',
    accentClass: 'text-purple-400',
    gradientClass: 'from-purple-600 to-indigo-600',
    order: 2,
  },
  trusted: {
    id: 'trusted',
    name: 'GÜVENİLİR SPONSORLAR',
    label: 'GÜVENİLİR SPONSORLAR',
    shortLabel: 'Güvenilir Sponsor',
    badgeText: 'GÜVENİLİR SPONSOR',
    badgeLabel: '🛡️ GÜVENİLİR SPONSOR',
    badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm shadow-emerald-500/20',
    borderClass: 'border-emerald-500/40 hover:border-emerald-400',
    accentClass: 'text-emerald-400',
    gradientClass: 'from-emerald-600 to-teal-600',
    order: 3,
  },
};

export const SPONSOR_CATEGORY_LIST: SponsorCategoryInfo[] = [
  SPONSOR_CATEGORIES.main,
  SPONSOR_CATEGORIES.vip,
  SPONSOR_CATEGORIES.trusted,
];

export function getSponsorCategory(sponsor: Partial<Sponsor> | null | undefined): SponsorCategory {
  if (!sponsor) return 'trusted';
  const cat = String(sponsor.category || '').toLowerCase().trim();
  if (cat === 'main' || cat.includes('ana') || cat.includes('main')) {
    return 'main';
  }
  if (cat === 'vip' || sponsor.featured) {
    return 'vip';
  }
  if (cat === 'trusted' || cat.includes('guven') || cat.includes('güven')) {
    return 'trusted';
  }
  return 'trusted';
}

/**
 * Pure numeric sort priority engine:
 * 1. Numeric sort_order (1, 2, 3...) ascending - absolute user-defined priority
 * 2. Secondary fallback: category order (main -> vip -> trusted) if sort_order matches
 * 3. Alphabetical tie-breaker
 */
export function sortSponsors(sponsors: Sponsor[]): Sponsor[] {
  if (!Array.isArray(sponsors)) return [];
  return [...sponsors].sort((a, b) => {
    if (!a && !b) return 0;
    if (!a) return 1;
    if (!b) return -1;

    const rawOrderA = a.sort_order;
    const rawOrderB = b.sort_order;

    const numA = typeof rawOrderA === 'number' && !isNaN(rawOrderA) ? rawOrderA : parseInt(String(rawOrderA)) || 9999;
    const numB = typeof rawOrderB === 'number' && !isNaN(rawOrderB) ? rawOrderB : parseInt(String(rawOrderB)) || 9999;

    if (numA !== numB) {
      return numA - numB;
    }

    const catA = SPONSOR_CATEGORIES[getSponsorCategory(a)]?.order ?? 99;
    const catB = SPONSOR_CATEGORIES[getSponsorCategory(b)]?.order ?? 99;
    if (catA !== catB) {
      return catA - catB;
    }

    return (a.name || '').localeCompare(b.name || '');
  });
}

/**
 * Groups sponsors cleanly into the 3 defined categories, each sorted by sort_order
 */
export function groupSponsorsByCategory(sponsors: Sponsor[]): {
  main: Sponsor[];
  vip: Sponsor[];
  trusted: Sponsor[];
} {
  const sorted = sortSponsors(sponsors || []);
  const result: { main: Sponsor[]; vip: Sponsor[]; trusted: Sponsor[] } = {
    main: [],
    vip: [],
    trusted: [],
  };

  for (const s of sorted) {
    if (!s) continue;
    const cat = getSponsorCategory(s);
    if (result[cat]) {
      result[cat].push(s);
    } else {
      result.trusted.push(s);
    }
  }

  return result;
}
