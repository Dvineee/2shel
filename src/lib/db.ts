import {
  Sponsor,
  SponsorCategory,
  HeroSlide,
  Banner,
  BannerPosition,
  SocialLink,
  WheelReward,
  WheelSpin,
  Giveaway,
  GiveawayEntry,
  GiveawayTemplate,
  StoreProduct,
  StoreOrder,
  SiteSettings,
  Profile,
  UserRole,
  AdminLog,
  StreakDayConfig,
  UserStreakInfo,
} from '../types';
import { getSponsorCategory, sortSponsors } from './sponsorUtils';
import {
  initialGiveawayTemplates,
  initialSiteSettings,
  initialSponsors,
  initialHeroSlides,
  initialBanners,
  initialSocialLinks,
  initialWheelRewards,
  initialGiveaways,
  initialStoreProducts,
} from './initialData';
import { supabase, getStoredSupabaseConfig } from './supabase';

const isSupabaseReady = () => getStoredSupabaseConfig().isConfigured;

const STORAGE_KEYS = {
  SPONSORS: 'sponsorhub_sponsors_v1',
  HERO_SLIDES: 'sponsorhub_hero_slides_v1',
  BANNERS: 'sponsorhub_banners_v1',
  SOCIAL_LINKS: 'sponsorhub_social_links_v1',
  WHEEL_REWARDS: 'sponsorhub_wheel_rewards_v1',
  WHEEL_SPINS: 'sponsorhub_wheel_spins_v1',
  USER_STREAKS: 'sponsorhub_user_streaks_v1',
  GIVEAWAYS: 'sponsorhub_giveaways_v1',
  GIVEAWAY_TEMPLATES: 'sponsorhub_giveaway_templates_v1',
  GIVEAWAY_ENTRIES: 'sponsorhub_giveaway_entries_v1',
  STORE_PRODUCTS: 'sponsorhub_store_products_v1',
  STORE_ORDERS: 'sponsorhub_store_orders_v1',
  SITE_SETTINGS: 'sponsorhub_site_settings_v1',
  PROFILES: 'sponsorhub_profiles_v1',
  ADMIN_LOGS: 'sponsorhub_admin_logs_v1',
  SPONSOR_CLICKS: 'sponsorhub_sponsor_clicks_v1',
  BANNER_CLICKS: 'sponsorhub_banner_clicks_v1',
};

// Local cache sync helper
function broadcastChange(key?: string) {
  try {
    window.dispatchEvent(new CustomEvent('sponsorhub_db_change', { detail: { key } }));
  } catch {
    // ignore
  }
}

function getStored<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setStored<T>(key: string, value: T, silent = false): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    if (!silent) {
      broadcastChange(key);
    }
  } catch (err) {
    console.error('Storage error:', err);
  }
}

// Invalidate server-side cache so all clients and endpoints stay 100% updated in real-time
async function invalidateServerCache() {
  try {
    fetch('/api/portal/invalidate-cache', { method: 'POST' }).catch(() => {});
  } catch {
    // ignore
  }
}

// Fast timeout wrapper to prevent slow/hanging network requests
function withTimeout<T>(promise: PromiseLike<T>, ms = 8000): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Database operation timed out after ${ms}ms`));
    }, ms);
    Promise.resolve(promise)
      .then((res) => {
        clearTimeout(timer);
        resolve(res);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

// Database Service API - 100% Database-Driven & Synchronized
export const db = {
  // --- Synchronous initial cache retrieval for instant React rendering ---
  getCachedData() {
    const cachedSponsors = getStored<Sponsor[]>(STORAGE_KEYS.SPONSORS, []);
    const cachedSlides = getStored<HeroSlide[]>(STORAGE_KEYS.HERO_SLIDES, []);
    const cachedBanners = getStored<Banner[]>(STORAGE_KEYS.BANNERS, []);
    const cachedSocials = getStored<SocialLink[]>(STORAGE_KEYS.SOCIAL_LINKS, []);
    const cachedRewards = getStored<WheelReward[]>(STORAGE_KEYS.WHEEL_REWARDS, []);
    const cachedGiveaways = getStored<Giveaway[]>(STORAGE_KEYS.GIVEAWAYS, []);
    const cachedProducts = getStored<StoreProduct[]>(STORAGE_KEYS.STORE_PRODUCTS, []);
    const cachedSettings = getStored<SiteSettings>(STORAGE_KEYS.SITE_SETTINGS, initialSiteSettings);

    return {
      sponsors: cachedSponsors,
      heroSlides: cachedSlides,
      banners: cachedBanners,
      socialLinks: cachedSocials,
      wheelRewards: cachedRewards,
      giveaways: cachedGiveaways,
      storeProducts: cachedProducts,
      settings: cachedSettings,
    };
  },

  // --- Helper to parse, map and cache full portal data from database ---
  parseAndCachePortalData(rawData: {
    settings?: any[];
    sponsors?: any[];
    hero_slides?: any[];
    banners?: any[];
    social_links?: any[];
    wheel_rewards?: any[];
    giveaways?: any[];
    store_products?: any[];
    giveaway_entries?: any[];
  }): {
    sponsors: Sponsor[];
    heroSlides: HeroSlide[];
    banners: Banner[];
    socialLinks: SocialLink[];
    wheelRewards: WheelReward[];
    giveaways: Giveaway[];
    storeProducts: StoreProduct[];
    settings: SiteSettings;
  } {
    const {
      settings,
      sponsors,
      hero_slides,
      banners,
      social_links,
      wheel_rewards,
      giveaways,
      store_products,
      giveaway_entries,
    } = rawData;

    let mappedSettings = initialSiteSettings;
    if (settings && Array.isArray(settings) && settings.length > 0) {
      const gen = settings.find((s: any) => s.setting_key === 'general');
      if (gen?.setting_value) {
        mappedSettings = { ...initialSiteSettings, ...gen.setting_value };
        setStored(STORAGE_KEYS.SITE_SETTINGS, mappedSettings, true);
      }
    }

    let mappedSponsors: Sponsor[] = [];
    if (Array.isArray(sponsors)) {
      mappedSponsors = sponsors.map((d: any) => {
        const cat = getSponsorCategory(d);
        return {
          ...d,
          id: d.id,
          name: d.name,
          slug: d.slug || (d.name ? d.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') : d.id),
          logo_url: d.logo_url,
          banner_url: d.banner_url || '',
          bonus_text: d.bonus_text || '',
          description: d.full_review || d.description || '',
          short_description: d.short_desc || d.short_description || '',
          website_url: d.direct_url || d.website_url || 'https://example.com',
          button_text: d.button_text || 'DETAYLARI GÖR',
          rating: Number(d.rating || 4.8),
          category: cat,
          featured: cat === 'vip' || (d.is_vip !== undefined ? Boolean(d.is_vip) : Boolean(d.featured)),
          verified: d.is_active !== false,
          active: d.is_active !== undefined ? Boolean(d.is_active) : (d.active !== false),
          sort_order: typeof d.sort_order === 'number' && !isNaN(d.sort_order) ? d.sort_order : (parseInt(d.sort_order) || 0),
          stats: d.stats && Array.isArray(d.stats) && d.stats.length > 0 ? d.stats : [
            { id: `stat-1`, label: 'İlk Yatırım', value: '%100', sort_order: 1 },
            { id: `stat-2`, label: 'Deneme', value: '250 TL', sort_order: 2 },
            { id: `stat-3`, label: 'Kayıp', value: '%20', sort_order: 3 },
          ],
          features: d.features && Array.isArray(d.features) && d.features.length > 0 ? d.features : [
            { id: `feat-1`, text: 'Hızlı Çekim', sort_order: 1 },
            { id: `feat-2`, text: '7/24 Destek', sort_order: 2 },
          ],
        };
      });
      mappedSponsors = sortSponsors(mappedSponsors);
      setStored(STORAGE_KEYS.SPONSORS, mappedSponsors, true);
    }

    let mappedHeroSlides: HeroSlide[] = [];
    if (Array.isArray(hero_slides)) {
      mappedHeroSlides = hero_slides.map((d: any) => ({
        id: d.id,
        title: d.title,
        subtitle: d.subtitle || '',
        desktop_image: d.background_image || d.desktop_image || '',
        mobile_image: d.mobile_image || '',
        button_text: d.button_text || 'HEMEN KATIL',
        target_url: d.button_url || d.target_url || '/giveaways',
        sort_order: d.sort_order || 0,
        active: d.is_active !== undefined ? Boolean(d.is_active) : (d.active !== false),
      }));
      setStored(STORAGE_KEYS.HERO_SLIDES, mappedHeroSlides, true);
    }

    let mappedBanners: Banner[] = [];
    if (Array.isArray(banners) && banners.length > 0) {
      mappedBanners = banners.map((d: any, idx: number) => {
        const rawPos = String(d.location || d.position || '').trim().toLowerCase();
        let pos: BannerPosition = 'left';
        if (rawPos.includes('right') || rawPos.includes('sag') || rawPos.includes('sağ')) {
          pos = 'right';
        } else if (rawPos.includes('bottom') || rawPos.includes('alt')) {
          pos = 'home_bottom';
        } else if (rawPos.includes('top') || rawPos.includes('ust') || rawPos.includes('üst')) {
          pos = 'home_top';
        } else if (rawPos.includes('left') || rawPos.includes('sol')) {
          pos = 'left';
        } else {
          // If ambiguous, alternate between left and right for side banners
          pos = idx % 2 === 0 ? 'left' : 'right';
        }

        return {
          id: d.id,
          name: d.title || d.name || 'Banner',
          image_url: d.image_url,
          target_url: d.target_url || '/',
          position: pos,
          active: d.is_active !== undefined ? Boolean(d.is_active) : (d.active !== false),
          sort_order: d.sort_order || 0,
          clicks_count: d.clicks || d.clicks_count || 0,
        };
      });
      setStored(STORAGE_KEYS.BANNERS, mappedBanners, true);
    } else {
      mappedBanners = getStored<Banner[]>(STORAGE_KEYS.BANNERS, initialBanners);
      if (!mappedBanners || mappedBanners.length === 0) {
        mappedBanners = initialBanners;
      }
      setStored(STORAGE_KEYS.BANNERS, mappedBanners, true);
    }

    let mappedSocials: SocialLink[] = [];
    if (Array.isArray(social_links)) {
      mappedSocials = social_links.map((d: any) => ({
        id: d.id,
        platform: d.platform,
        title: d.title,
        subtitle: d.subtitle || 'Katıl',
        url: d.url,
        icon: d.icon || 'Send',
        active: d.is_active !== undefined ? Boolean(d.is_active) : (d.active !== false),
        sort_order: d.sort_order || 0,
      }));
      setStored(STORAGE_KEYS.SOCIAL_LINKS, mappedSocials, true);
    }

    let mappedRewards: WheelReward[] = [];
    if (Array.isArray(wheel_rewards)) {
      mappedRewards = wheel_rewards.map((d: any) => ({
        id: d.id,
        title: d.name || d.title,
        reward_type: d.reward_type || 'coin',
        reward_value: Number(d.coin_reward || d.reward_value || 100),
        color: d.color || '#7C3AED',
        probability: Number(d.probability || 10),
        active: d.is_active !== undefined ? Boolean(d.is_active) : (d.active !== false),
        sort_order: d.sort_order || 0,
      }));
      setStored(STORAGE_KEYS.WHEEL_REWARDS, mappedRewards, true);
    }

    const remoteEntries = Array.isArray(giveaway_entries)
      ? (giveaway_entries as GiveawayEntry[])
      : [];
    if (remoteEntries.length > 0) {
      setStored(STORAGE_KEYS.GIVEAWAY_ENTRIES, remoteEntries, true);
    }
    const allStoredEntries = getStored<GiveawayEntry[]>(STORAGE_KEYS.GIVEAWAY_ENTRIES, []);

    let mappedGiveaways: Giveaway[] = [];
    if (Array.isArray(giveaways)) {
      mappedGiveaways = giveaways.map((d: any) => {
        const winnerObj = Array.isArray(d.winners) && d.winners.length > 0 ? d.winners[0] : null;
        const winnerName = d.winner_username || (winnerObj ? (winnerObj.username || winnerObj.name) : undefined);
        const matchingEntriesCount = allStoredEntries.filter((e) => e.giveaway_id === d.id).length;
        return {
          id: d.id,
          title: d.title || 'Çekiliş',
          description: d.description || '',
          image_url: d.image_url || '',
          prize_details: d.prize || d.prize_details || 'Ödül',
          start_at: d.created_at || new Date().toISOString(),
          end_at: d.end_date || d.end_at || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          active: d.is_active !== undefined ? Boolean(d.is_active) : (d.active !== false),
          winner_count: d.total_winners || d.winner_count || 1,
          entries_count: Math.max(Number(d.entries_count) || 0, matchingEntriesCount),
          is_completed: Boolean(d.is_completed || winnerName),
          winner_username: winnerName,
          winner_id: d.winner_id || (winnerObj ? winnerObj.id : undefined),
          winner_announced_at: d.winner_announced_at || (winnerObj ? winnerObj.date : undefined),
          winner_note: d.winner_note || (winnerObj ? winnerObj.note : undefined),
        };
      });
      setStored(STORAGE_KEYS.GIVEAWAYS, mappedGiveaways, true);
    }

    let mappedProducts: StoreProduct[] = [];
    if (Array.isArray(store_products)) {
      mappedProducts = store_products.map((d: any) => ({
        id: d.id,
        name: d.title || d.name,
        description: d.description || '',
        image_url: d.image_url || '',
        coin_price: d.price_coins || d.coin_price || 100,
        stock: d.stock || 50,
        category: d.category || 'digital',
        active: d.is_active !== undefined ? Boolean(d.is_active) : (d.active !== false),
        sort_order: d.sort_order || 0,
      }));
      setStored(STORAGE_KEYS.STORE_PRODUCTS, mappedProducts, true);
    }

    return {
      settings: mappedSettings,
      sponsors: mappedSponsors,
      heroSlides: mappedHeroSlides,
      banners: mappedBanners,
      socialLinks: mappedSocials,
      wheelRewards: mappedRewards,
      giveaways: mappedGiveaways,
      storeProducts: mappedProducts,
    };
  },

  // --- Preload / Hybrid Portal Data from Database ---
  async preloadAll(): Promise<{
    sponsors: Sponsor[];
    heroSlides: HeroSlide[];
    banners: Banner[];
    socialLinks: SocialLink[];
    wheelRewards: WheelReward[];
    giveaways: Giveaway[];
    storeProducts: StoreProduct[];
    settings: SiteSettings;
  } | null> {
    // 1. Try server-side fast endpoint if available
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 2500);
      const res = await fetch('/api/portal/data', { signal: controller.signal });
      clearTimeout(timer);

      if (res.ok) {
        const json = await res.json();
        if (json.status === 'ok' && json.data) {
          return this.parseAndCachePortalData(json.data);
        }
      }
    } catch {
      // Ignore: fall through to direct Supabase client queries
    }

    // 2. Direct Supabase Client Query (Works on static hosting, cPanel, Hostinger, Vercel, Netlify, etc.)
    if (isSupabaseReady()) {
      try {
        const [
          settingsRes,
          sponsorsRes,
          heroRes,
          bannersRes,
          socialRes,
          rewardsRes,
          giveawaysRes,
          storeRes,
          entriesRes,
        ] = await Promise.all([
          supabase.from('site_settings').select('*'),
          supabase.from('sponsors').select('*').order('sort_order', { ascending: true }),
          supabase.from('hero_slides').select('*').order('sort_order', { ascending: true }),
          supabase.from('banners').select('*').order('sort_order', { ascending: true }),
          supabase.from('social_links').select('*').order('sort_order', { ascending: true }),
          supabase.from('wheel_rewards').select('*').order('sort_order', { ascending: true }),
          supabase.from('giveaways').select('*').order('created_at', { ascending: false }),
          supabase.from('store_products').select('*').order('sort_order', { ascending: true }),
          supabase.from('giveaway_entries').select('*').order('created_at', { ascending: false }).limit(200),
        ]);

        const rawData = {
          settings: settingsRes.data || [],
          sponsors: sponsorsRes.data || [],
          hero_slides: heroRes.data || [],
          banners: bannersRes.data || [],
          social_links: socialRes.data || [],
          wheel_rewards: rewardsRes.data || [],
          giveaways: giveawaysRes.data || [],
          store_products: storeRes.data || [],
          giveaway_entries: entriesRes.data || [],
        };

        return this.parseAndCachePortalData(rawData);
      } catch (err) {
        console.warn('Direct Supabase preloadAll error:', err);
      }
    }

    return null;
  },

  // --- Site Settings (Database Authoritative) ---
  async getSettings(): Promise<SiteSettings> {
    if (isSupabaseReady()) {
      try {
        const { data, error } = await withTimeout(
          supabase
            .from('site_settings')
            .select('setting_value')
            .eq('setting_key', 'general')
            .maybeSingle(),
          8000
        );

        if (!error && data?.setting_value && typeof data.setting_value === 'object') {
          const merged: SiteSettings = {
            ...initialSiteSettings,
            ...data.setting_value,
          };
          setStored(STORAGE_KEYS.SITE_SETTINGS, merged, true);
          return merged;
        }
      } catch (err) {
        console.warn('Supabase getSettings error:', err);
      }
    }

    return getStored<SiteSettings>(STORAGE_KEYS.SITE_SETTINGS, initialSiteSettings);
  },

  async updateSettings(settings: Partial<SiteSettings>): Promise<SiteSettings> {
    const current = await this.getSettings();
    const updated: SiteSettings = { ...current, ...settings };
    setStored(STORAGE_KEYS.SITE_SETTINGS, updated);

    if (isSupabaseReady()) {
      try {
        const { error } = await supabase
          .from('site_settings')
          .upsert({
            setting_key: 'general',
            setting_value: updated,
            updated_at: new Date().toISOString(),
          });
        if (error) {
          console.warn('Supabase updateSettings warning:', error);
        }
      } catch (err) {
        console.warn('Supabase updateSettings exception:', err);
      }
    }

    await invalidateServerCache();
    await this.logAdminAction('Site Ayarları Güncellendi', 'settings', undefined, settings);
    return updated;
  },

  // --- Sponsors (Database Authoritative) ---
  async getSponsors(): Promise<Sponsor[]> {
    if (isSupabaseReady()) {
      try {
        const { data, error } = await withTimeout(
          supabase
            .from('sponsors')
            .select('*')
            .order('sort_order', { ascending: true }),
          8000
        );
        if (!error && Array.isArray(data)) {
          const mapped = data.map((d: any) => {
            const cat = getSponsorCategory(d);
            return {
              ...d,
              id: d.id,
              name: d.name,
              slug: d.slug || (d.name ? d.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') : d.id),
              logo_url: d.logo_url,
              banner_url: d.banner_url || '',
              bonus_text: d.bonus_text || '',
              description: d.full_review || d.description || '',
              short_description: d.short_desc || d.short_description || '',
              website_url: d.direct_url || d.website_url || 'https://example.com',
              button_text: d.button_text || 'DETAYLARI GÖR',
              rating: Number(d.rating || 4.8),
              category: cat,
              featured: cat === 'vip' || (d.is_vip !== undefined ? Boolean(d.is_vip) : Boolean(d.featured)),
              verified: d.is_active !== false,
              active: d.is_active !== undefined ? Boolean(d.is_active) : (d.active !== false),
              sort_order: typeof d.sort_order === 'number' && !isNaN(d.sort_order) ? d.sort_order : (parseInt(d.sort_order) || 0),
              stats: d.stats && Array.isArray(d.stats) && d.stats.length > 0 ? d.stats : [
                { id: `stat-1`, label: 'İlk Yatırım', value: '%100', sort_order: 1 },
                { id: `stat-2`, label: 'Deneme', value: '250 TL', sort_order: 2 },
                { id: `stat-3`, label: 'Kayıp', value: '%20', sort_order: 3 },
              ],
              features: d.features && Array.isArray(d.features) && d.features.length > 0 ? d.features : [
                { id: `feat-1`, text: 'Hızlı Çekim', sort_order: 1 },
                { id: `feat-2`, text: '7/24 Destek', sort_order: 2 },
              ],
            };
          }) as Sponsor[];
          const sorted = sortSponsors(mapped);
          setStored(STORAGE_KEYS.SPONSORS, sorted, true);
          return sorted;
        }
      } catch (err) {
        console.warn('Supabase getSponsors error:', err);
      }
    }
    const storedSponsors = getStored<Sponsor[]>(STORAGE_KEYS.SPONSORS, initialSponsors);
    const finalSponsors = (storedSponsors && storedSponsors.length > 0) ? storedSponsors : initialSponsors;
    return sortSponsors(finalSponsors);
  },

  async getSponsorBySlug(slug: string): Promise<Sponsor | null> {
    const sponsors = await this.getSponsors();
    return sponsors.find((s) => s.slug === slug || s.id === slug) || null;
  },

  async createSponsor(sponsor: Partial<Sponsor>): Promise<Sponsor> {
    return this.saveSponsor(sponsor);
  },

  async updateSponsor(id: string, sponsor: Partial<Sponsor>): Promise<Sponsor> {
    return this.saveSponsor({ ...sponsor, id });
  },

  async saveSponsor(sponsor: Partial<Sponsor>): Promise<Sponsor> {
    const sponsors = await this.getSponsors();
    let saved: Sponsor;
    const cat = getSponsorCategory(sponsor);

    if (sponsor.id) {
      const index = sponsors.findIndex((s) => s.id === sponsor.id);
      if (index !== -1) {
        saved = {
          ...sponsors[index],
          ...sponsor,
          category: cat,
          featured: cat === 'vip' || Boolean(sponsor.featured),
          sort_order: typeof sponsor.sort_order === 'number' && !isNaN(sponsor.sort_order) ? sponsor.sort_order : sponsors[index].sort_order,
          updated_at: new Date().toISOString(),
        } as Sponsor;
        sponsors[index] = saved;
      } else {
        saved = {
          ...sponsor,
          id: sponsor.id,
          category: cat,
          featured: cat === 'vip' || Boolean(sponsor.featured),
          sort_order: typeof sponsor.sort_order === 'number' && !isNaN(sponsor.sort_order) ? sponsor.sort_order : sponsors.length + 1,
        } as Sponsor;
        sponsors.push(saved);
      }
    } else {
      saved = {
        id: `sp-${Date.now()}`,
        name: sponsor.name || 'Yeni Sponsor',
        slug: sponsor.slug || `sponsor-${Date.now()}`,
        logo_url: sponsor.logo_url || 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=200&h=100&q=80',
        banner_url: sponsor.banner_url || '',
        description: sponsor.description || '',
        short_description: sponsor.short_description || '',
        website_url: sponsor.website_url || 'https://example.com',
        button_text: sponsor.button_text || 'DETAYLARI GÖR',
        rating: sponsor.rating || 4.8,
        category: cat,
        featured: cat === 'vip' || Boolean(sponsor.featured),
        verified: sponsor.verified !== false,
        active: sponsor.active !== false,
        sort_order: typeof sponsor.sort_order === 'number' && !isNaN(sponsor.sort_order) ? sponsor.sort_order : sponsors.length + 1,
        stats: sponsor.stats || [
          { id: `stat-${Date.now()}-1`, label: 'İlk Yatırım', value: '%100', sort_order: 1 },
          { id: `stat-${Date.now()}-2`, label: 'Deneme', value: '250 TL', sort_order: 2 },
          { id: `stat-${Date.now()}-3`, label: 'Kayıp', value: '%20', sort_order: 3 },
        ],
        features: sponsor.features || [
          { id: `feat-${Date.now()}-1`, text: 'Hızlı Çekim', sort_order: 1 },
          { id: `feat-${Date.now()}-2`, text: '7/24 Destek', sort_order: 2 },
        ],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      sponsors.push(saved);
    }

    const sortedList = sortSponsors(sponsors);
    setStored(STORAGE_KEYS.SPONSORS, sortedList);

    if (isSupabaseReady()) {
      try {
        await supabase.from('sponsors').upsert({
          id: saved.id,
          name: saved.name,
          slug: saved.slug,
          logo_url: saved.logo_url,
          banner_url: saved.banner_url || null,
          bonus_text: (saved as any).bonus_text || null,
          rating: saved.rating || 5.0,
          review_count: (saved as any).review_count || 0,
          direct_url: saved.website_url || (saved as any).direct_url || null,
          short_desc: saved.short_description || (saved as any).short_desc || null,
          full_review: saved.description || (saved as any).full_review || null,
          features: saved.features || [],
          tags: (saved as any).tags || [],
          category: saved.category || cat,
          is_active: saved.active !== false,
          is_vip: saved.category === 'vip' || Boolean(saved.featured),
          is_popular: Boolean((saved as any).is_popular),
          sort_order: saved.sort_order || 0,
          created_at: saved.created_at || new Date().toISOString(),
        });
      } catch (err) {
        console.warn('Supabase saveSponsor error:', err);
      }
    }

    await invalidateServerCache();
    await this.logAdminAction(
      sponsor.id ? 'Sponsor Güncellendi' : 'Yeni Sponsor Eklendi',
      'sponsor',
      saved.id,
      { name: saved.name, slug: saved.slug, category: saved.category, sort_order: saved.sort_order }
    );
    return saved;
  },

  async deleteSponsor(id: string): Promise<void> {
    const sponsors = await this.getSponsors();
    const target = sponsors.find((s) => s.id === id);
    const filtered = sponsors.filter((s) => s.id !== id);
    const sorted = sortSponsors(filtered);
    setStored(STORAGE_KEYS.SPONSORS, sorted);

    if (isSupabaseReady()) {
      try {
        await supabase.from('sponsors').delete().eq('id', id);
      } catch (err) {
        console.warn('Supabase deleteSponsor error:', err);
      }
    }

    await invalidateServerCache();
    await this.logAdminAction('Sponsor Silindi', 'sponsor', id, { name: target?.name });
  },

  async reorderSponsors(orderedIds: string[]): Promise<void> {
    const sponsors = await this.getSponsors();
    const map = new Map<string, Sponsor>(sponsors.map((s) => [s.id, s]));
    const updated: Sponsor[] = [];
    
    orderedIds.forEach((id, index) => {
      const item = map.get(id);
      if (item) {
        updated.push({ ...item, sort_order: index + 1 });
      }
    });

    sponsors.forEach((s) => {
      if (!orderedIds.includes(s.id)) {
        updated.push({ ...s, sort_order: updated.length + 1 });
      }
    });

    const sorted = sortSponsors(updated);
    setStored(STORAGE_KEYS.SPONSORS, sorted);

    if (isSupabaseReady()) {
      try {
        for (const sp of sorted) {
          await supabase.from('sponsors').update({ sort_order: sp.sort_order }).eq('id', sp.id);
        }
      } catch (err) {
        console.warn('Supabase reorderSponsors error:', err);
      }
    }

    broadcastChange();
    await invalidateServerCache();
  },

  async moveSponsorOrder(id: string, direction: 'up' | 'down'): Promise<Sponsor[]> {
    const sponsors = await this.getSponsors();
    const sorted = sortSponsors(sponsors);
    const index = sorted.findIndex((s) => s.id === id);
    if (index === -1) return sorted;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sorted.length) return sorted;

    const currentItem = sorted[index];
    const targetItem = sorted[targetIndex];

    // Swap items in sorted array
    sorted[index] = targetItem;
    sorted[targetIndex] = currentItem;

    // Renumber sequential sort_orders (1..N)
    const updated = sorted.map((sp, idx) => ({
      ...sp,
      sort_order: idx + 1,
      updated_at: new Date().toISOString(),
    }));

    setStored(STORAGE_KEYS.SPONSORS, updated);

    if (isSupabaseReady()) {
      try {
        for (const item of updated) {
          await supabase.from('sponsors').update({ sort_order: item.sort_order }).eq('id', item.id);
        }
      } catch (err) {
        console.warn('Supabase moveSponsorOrder error:', err);
      }
    }

    broadcastChange();
    await invalidateServerCache();
    return updated;
  },

  async setSponsorSortOrder(id: string, newOrder: number): Promise<Sponsor[]> {
    const sponsors = await this.getSponsors();
    const target = sponsors.find((s) => s.id === id);
    if (!target) return sponsors;

    target.sort_order = Math.max(1, Number(newOrder) || 1);
    target.updated_at = new Date().toISOString();

    const sorted = sortSponsors(sponsors);
    // Renumber sequentially
    const updated = sorted.map((sp, idx) => ({
      ...sp,
      sort_order: idx + 1,
    }));

    setStored(STORAGE_KEYS.SPONSORS, updated);

    if (isSupabaseReady()) {
      try {
        for (const item of updated) {
          await supabase.from('sponsors').update({ sort_order: item.sort_order }).eq('id', item.id);
        }
      } catch (err) {
        console.warn('Supabase setSponsorSortOrder error:', err);
      }
    }

    broadcastChange();
    await invalidateServerCache();
    return updated;
  },

  async toggleSponsorActive(id: string, active: boolean): Promise<Sponsor | null> {
    const sponsors = await this.getSponsors();
    const index = sponsors.findIndex((s) => s.id === id);
    if (index === -1) return null;
    sponsors[index] = { ...sponsors[index], active, updated_at: new Date().toISOString() };
    setStored(STORAGE_KEYS.SPONSORS, sponsors);

    if (isSupabaseReady()) {
      try {
        await supabase.from('sponsors').update({ is_active: active }).eq('id', id);
      } catch (err) {
        console.warn('Supabase toggleSponsorActive error:', err);
      }
    }

    await invalidateServerCache();
    await this.logAdminAction(
      active ? 'Sponsor Aktifleştirildi' : 'Sponsor Pasife Alındı',
      'sponsor',
      id,
      { name: sponsors[index].name, active }
    );
    return sponsors[index];
  },

  async toggleSponsorFeatured(id: string, featured: boolean): Promise<Sponsor | null> {
    const sponsors = await this.getSponsors();
    const index = sponsors.findIndex((s) => s.id === id);
    if (index === -1) return null;
    sponsors[index] = { ...sponsors[index], featured, updated_at: new Date().toISOString() };
    setStored(STORAGE_KEYS.SPONSORS, sponsors);

    if (isSupabaseReady()) {
      try {
        await supabase.from('sponsors').update({ is_vip: featured }).eq('id', id);
      } catch (err) {
        console.warn('Supabase toggleSponsorFeatured error:', err);
      }
    }

    await invalidateServerCache();
    await this.logAdminAction(
      featured ? 'Sponsor Öne Çıkarıldı (VIP)' : 'Sponsor Öne Çıkarma Kaldırıldı',
      'sponsor',
      id,
      { name: sponsors[index].name, featured }
    );
    return sponsors[index];
  },

  // --- Hero Slides (Database Authoritative) ---
  async getHeroSlides(): Promise<HeroSlide[]> {
    if (isSupabaseReady()) {
      try {
        const { data, error } = await withTimeout(
          supabase
            .from('hero_slides')
            .select('*')
            .order('sort_order', { ascending: true }),
          8000
        );
        if (!error && Array.isArray(data)) {
          const mapped = data.map((d: any) => ({
            ...d,
            id: d.id,
            title: d.title,
            subtitle: d.subtitle || '',
            desktop_image: d.background_image || d.desktop_image || '',
            mobile_image: d.mobile_image || '',
            button_text: d.button_text || 'HEMEN KATIL',
            target_url: d.button_url || d.target_url || '/giveaways',
            sort_order: d.sort_order || 0,
            active: d.is_active !== undefined ? Boolean(d.is_active) : (d.active !== false),
          })) as HeroSlide[];
          setStored(STORAGE_KEYS.HERO_SLIDES, mapped, true);
          return mapped;
        }
      } catch (err) {
        console.warn('Supabase getHeroSlides error:', err);
      }
    }
    const storedSlides = getStored<HeroSlide[]>(STORAGE_KEYS.HERO_SLIDES, []);
    return storedSlides.sort(
      (a, b) => a.sort_order - b.sort_order
    );
  },

  async createHeroSlide(slide: Partial<HeroSlide>): Promise<HeroSlide> {
    return this.saveHeroSlide(slide);
  },

  async updateHeroSlide(id: string, slide: Partial<HeroSlide>): Promise<HeroSlide> {
    return this.saveHeroSlide({ ...slide, id });
  },

  async saveHeroSlide(slide: Partial<HeroSlide>): Promise<HeroSlide> {
    const slides = await this.getHeroSlides();
    let saved: HeroSlide;
    if (slide.id) {
      const idx = slides.findIndex((s) => s.id === slide.id);
      if (idx !== -1) {
        saved = { ...slides[idx], ...slide } as HeroSlide;
        slides[idx] = saved;
      } else {
        saved = { ...slide, id: slide.id } as HeroSlide;
        slides.push(saved);
      }
    } else {
      saved = {
        id: `slide-${Date.now()}`,
        title: slide.title || 'Yeni Hero Kampanya',
        subtitle: slide.subtitle || 'Açıklama metni',
        desktop_image: slide.desktop_image || 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&w=1350&h=380&q=80',
        mobile_image: slide.mobile_image || '',
        button_text: slide.button_text || 'HEMEN KATIL',
        target_url: slide.target_url || '/giveaways',
        sort_order: slides.length + 1,
        active: slide.active !== false,
      };
      slides.push(saved);
    }
    setStored(STORAGE_KEYS.HERO_SLIDES, slides);

    if (isSupabaseReady()) {
      try {
        await supabase.from('hero_slides').upsert({
          id: saved.id,
          title: saved.title,
          subtitle: saved.subtitle || null,
          button_text: saved.button_text || null,
          button_url: saved.target_url || null,
          background_image: saved.desktop_image || null,
          is_active: saved.active !== false,
          sort_order: saved.sort_order || 0,
          created_at: new Date().toISOString(),
        });
      } catch (err) {
        console.warn('Supabase saveHeroSlide error:', err);
      }
    }

    await invalidateServerCache();
    await this.logAdminAction(slide.id ? 'Slide Güncellendi' : 'Slide Eklendi', 'slide', saved.id);
    return saved;
  },

  async deleteHeroSlide(id: string): Promise<void> {
    const slides = await this.getHeroSlides();
    setStored(STORAGE_KEYS.HERO_SLIDES, slides.filter((s) => s.id !== id));

    if (isSupabaseReady()) {
      try {
        await supabase.from('hero_slides').delete().eq('id', id);
      } catch (err) {
        console.warn('Supabase deleteHeroSlide error:', err);
      }
    }

    await invalidateServerCache();
    await this.logAdminAction('Slide Silindi', 'slide', id);
  },

  // --- Banners (Database Authoritative) ---
  async getBanners(): Promise<Banner[]> {
    if (isSupabaseReady()) {
      try {
        const { data, error } = await withTimeout(
          supabase
            .from('banners')
            .select('*')
            .order('sort_order', { ascending: true }),
          8000
        );
        if (!error && Array.isArray(data) && data.length > 0) {
          const mapped = data.map((d: any, idx: number) => {
            const rawPos = String(d.location || d.position || '').trim().toLowerCase();
            let pos: BannerPosition = 'left';
            if (rawPos.includes('right') || rawPos.includes('sag') || rawPos.includes('sağ')) {
              pos = 'right';
            } else if (rawPos.includes('bottom') || rawPos.includes('alt')) {
              pos = 'home_bottom';
            } else if (rawPos.includes('top') || rawPos.includes('ust') || rawPos.includes('üst')) {
              pos = 'home_top';
            } else if (rawPos.includes('left') || rawPos.includes('sol')) {
              pos = 'left';
            } else {
              pos = idx % 2 === 0 ? 'left' : 'right';
            }

            return {
              ...d,
              id: d.id,
              name: d.title || d.name || 'Banner',
              image_url: d.image_url,
              target_url: d.target_url || '/',
              position: pos,
              active: d.is_active !== undefined ? Boolean(d.is_active) : (d.active !== false),
              sort_order: d.sort_order || 0,
              clicks_count: d.clicks || d.clicks_count || 0,
            };
          }) as Banner[];
          setStored(STORAGE_KEYS.BANNERS, mapped, true);
          return mapped;
        }
      } catch (err) {
        console.warn('Supabase getBanners error:', err);
      }
    }
    const storedBanners = getStored<Banner[]>(STORAGE_KEYS.BANNERS, initialBanners);
    const finalBanners = (storedBanners && storedBanners.length > 0) ? storedBanners : initialBanners;
    return finalBanners.sort(
      (a, b) => a.sort_order - b.sort_order
    );
  },

  async createBanner(banner: Partial<Banner>): Promise<Banner> {
    return this.saveBanner(banner);
  },

  async updateBanner(id: string, banner: Partial<Banner>): Promise<Banner> {
    return this.saveBanner({ ...banner, id });
  },

  async saveBanner(banner: Partial<Banner>): Promise<Banner> {
    const banners = await this.getBanners();
    let saved: Banner;
    if (banner.id) {
      const idx = banners.findIndex((b) => b.id === banner.id);
      if (idx !== -1) {
        saved = { ...banners[idx], ...banner } as Banner;
        banners[idx] = saved;
      } else {
        saved = { ...banner, id: banner.id } as Banner;
        banners.push(saved);
      }
    } else {
      saved = {
        id: `ban-${Date.now()}`,
        name: banner.name || 'Yeni Dikey Banner',
        image_url: banner.image_url || 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=160&h=600&q=80',
        target_url: banner.target_url || '/',
        position: banner.position || 'left',
        active: banner.active !== false,
        sort_order: banners.length + 1,
        clicks_count: 0,
      };
      banners.push(saved);
    }
    setStored(STORAGE_KEYS.BANNERS, banners);

    if (isSupabaseReady()) {
      try {
        await supabase.from('banners').upsert({
          id: saved.id,
          title: saved.name,
          image_url: saved.image_url,
          target_url: saved.target_url,
          location: saved.position || 'left',
          is_active: saved.active !== false,
          sort_order: saved.sort_order || 0,
          clicks: saved.clicks_count || 0,
          created_at: new Date().toISOString(),
        });
      } catch (err) {
        console.warn('Supabase saveBanner error:', err);
      }
    }

    await invalidateServerCache();
    await this.logAdminAction(banner.id ? 'Banner Güncellendi' : 'Banner Eklendi', 'banner', saved.id);
    return saved;
  },

  async deleteBanner(id: string): Promise<void> {
    const banners = await this.getBanners();
    setStored(STORAGE_KEYS.BANNERS, banners.filter((b) => b.id !== id));

    if (isSupabaseReady()) {
      try {
        await supabase.from('banners').delete().eq('id', id);
      } catch (err) {
        console.warn('Supabase deleteBanner error:', err);
      }
    }

    await invalidateServerCache();
    await this.logAdminAction('Banner Silindi', 'banner', id);
  },

  // --- Social Links (Database Authoritative) ---
  async getSocialLinks(): Promise<SocialLink[]> {
    if (isSupabaseReady()) {
      try {
        const { data, error } = await withTimeout(
          supabase
            .from('social_links')
            .select('*')
            .order('sort_order', { ascending: true }),
          8000
        );
        if (!error && Array.isArray(data)) {
          const mapped = data.map((d: any) => ({
            ...d,
            id: d.id,
            platform: d.platform,
            title: d.title,
            subtitle: d.subtitle || 'Katıl',
            url: d.url,
            icon: d.icon || 'Send',
            active: d.is_active !== undefined ? Boolean(d.is_active) : (d.active !== false),
            sort_order: d.sort_order || 0,
          })) as SocialLink[];
          setStored(STORAGE_KEYS.SOCIAL_LINKS, mapped, true);
          return mapped;
        }
      } catch (err) {
        console.warn('Supabase getSocialLinks error:', err);
      }
    }
    const storedSocials = getStored<SocialLink[]>(STORAGE_KEYS.SOCIAL_LINKS, []);
    return storedSocials.sort(
      (a, b) => a.sort_order - b.sort_order
    );
  },

  async createSocialLink(link: Partial<SocialLink>): Promise<SocialLink> {
    return this.saveSocialLink(link);
  },

  async updateSocialLink(id: string, link: Partial<SocialLink>): Promise<SocialLink> {
    return this.saveSocialLink({ ...link, id });
  },

  async saveSocialLink(link: Partial<SocialLink>): Promise<SocialLink> {
    const links = await this.getSocialLinks();
    let saved: SocialLink;
    if (link.id) {
      const idx = links.findIndex((l) => l.id === link.id);
      if (idx !== -1) {
        saved = { ...links[idx], ...link } as SocialLink;
        links[idx] = saved;
      } else {
        saved = { ...link, id: link.id } as SocialLink;
        links.push(saved);
      }
    } else {
      saved = {
        id: `soc-${Date.now()}`,
        platform: link.platform || 'telegram',
        title: link.title || 'Yeni Telegram Kanalı',
        subtitle: link.subtitle || 'Katıl',
        url: link.url || 'https://t.me',
        icon: link.icon || 'Send',
        active: link.active !== false,
        sort_order: links.length + 1,
      };
      links.push(saved);
    }
    setStored(STORAGE_KEYS.SOCIAL_LINKS, links);

    if (isSupabaseReady()) {
      try {
        await supabase.from('social_links').upsert({
          id: saved.id,
          platform: saved.platform,
          title: saved.title,
          url: saved.url,
          icon: saved.icon || null,
          is_active: saved.active !== false,
          sort_order: saved.sort_order || 0,
          created_at: new Date().toISOString(),
        });
      } catch (err) {
        console.warn('Supabase saveSocialLink error:', err);
      }
    }

    await invalidateServerCache();
    await this.logAdminAction('Sosyal Link Güncellendi', 'social_link', saved.id);
    return saved;
  },

  async setSocialLinks(newLinks: SocialLink[]): Promise<SocialLink[]> {
    setStored(STORAGE_KEYS.SOCIAL_LINKS, newLinks);
    if (isSupabaseReady()) {
      try {
        await supabase.from('social_links').delete().neq('id', 'placeholder_impossible_id');
        for (const l of newLinks) {
          await supabase.from('social_links').upsert({
            id: l.id,
            platform: l.platform,
            title: l.title,
            url: l.url,
            icon: l.icon || null,
            is_active: l.active !== false,
            sort_order: l.sort_order || 0,
            created_at: new Date().toISOString(),
          });
        }
      } catch (err) {
        console.warn('Supabase setSocialLinks error:', err);
      }
    }
    await invalidateServerCache();
    await this.logAdminAction('Tüm Sosyal Linkler Güncellendi', 'social_links');
    return newLinks;
  },

  async deleteSocialLink(id: string): Promise<void> {
    const links = await this.getSocialLinks();
    setStored(STORAGE_KEYS.SOCIAL_LINKS, links.filter((l) => l.id !== id));

    if (isSupabaseReady()) {
      try {
        await supabase.from('social_links').delete().eq('id', id);
      } catch (err) {
        console.warn('Supabase deleteSocialLink error:', err);
      }
    }

    await invalidateServerCache();
  },

  // --- Wheel Rewards & Spins (Database Authoritative) ---
  async getWheelRewards(): Promise<WheelReward[]> {
    if (isSupabaseReady()) {
      try {
        const { data, error } = await withTimeout(
          supabase
            .from('wheel_rewards')
            .select('*')
            .order('sort_order', { ascending: true }),
          8000
        );
        if (!error && Array.isArray(data)) {
          const mapped = data.map((d: any) => ({
            ...d,
            id: d.id,
            title: d.name || d.title,
            reward_type: d.reward_type || 'coin',
            reward_value: Number(d.coin_reward || d.reward_value || 100),
            color: d.color || '#7C3AED',
            probability: Number(d.probability || 10),
            active: d.is_active !== undefined ? Boolean(d.is_active) : (d.active !== false),
            sort_order: d.sort_order || 0,
          })) as WheelReward[];
          setStored(STORAGE_KEYS.WHEEL_REWARDS, mapped, true);
          return mapped;
        }
      } catch (err) {
        console.warn('Supabase getWheelRewards error:', err);
      }
    }
    const storedRewards = getStored<WheelReward[]>(STORAGE_KEYS.WHEEL_REWARDS, []);
    return storedRewards.sort(
      (a, b) => a.sort_order - b.sort_order
    );
  },

  async createWheelReward(reward: Partial<WheelReward>): Promise<WheelReward> {
    return this.saveWheelReward(reward);
  },

  async updateWheelReward(id: string, reward: Partial<WheelReward>): Promise<WheelReward> {
    return this.saveWheelReward({ ...reward, id });
  },

  async saveWheelReward(reward: Partial<WheelReward>): Promise<WheelReward> {
    const rewards = await this.getWheelRewards();
    let saved: WheelReward;
    if (reward.id) {
      const idx = rewards.findIndex((r) => r.id === reward.id);
      if (idx !== -1) {
        saved = { ...rewards[idx], ...reward } as WheelReward;
        rewards[idx] = saved;
      } else {
        saved = { ...reward, id: reward.id } as WheelReward;
        rewards.push(saved);
      }
    } else {
      saved = {
        id: `wr-${Date.now()}`,
        title: reward.title || '100 Coin',
        reward_type: reward.reward_type || 'coin',
        reward_value: reward.reward_value || 100,
        color: reward.color || '#7C3AED',
        probability: reward.probability || 10,
        active: reward.active !== false,
        sort_order: rewards.length + 1,
      };
      rewards.push(saved);
    }
    setStored(STORAGE_KEYS.WHEEL_REWARDS, rewards);

    if (isSupabaseReady()) {
      try {
        await supabase.from('wheel_rewards').upsert({
          id: saved.id,
          name: saved.title,
          reward_type: saved.reward_type,
          reward_value: String(saved.reward_value),
          probability: saved.probability,
          color: saved.color,
          coin_reward: saved.reward_value,
          is_active: saved.active !== false,
          sort_order: saved.sort_order || 0,
          created_at: new Date().toISOString(),
        });
      } catch (err) {
        console.warn('Supabase saveWheelReward error:', err);
      }
    }

    await invalidateServerCache();
    await this.logAdminAction('Çark Ödülü Güncellendi', 'wheel_reward', saved.id);
    return saved;
  },

  async deleteWheelReward(id: string): Promise<void> {
    const rewards = await this.getWheelRewards();
    setStored(STORAGE_KEYS.WHEEL_REWARDS, rewards.filter((r) => r.id !== id));

    if (isSupabaseReady()) {
      try {
        await supabase.from('wheel_rewards').delete().eq('id', id);
      } catch (err) {
        console.warn('Supabase deleteWheelReward error:', err);
      }
    }

    await invalidateServerCache();
  },

  async getWheelSpins(): Promise<WheelSpin[]> {
    if (isSupabaseReady()) {
      try {
        const { data, error } = await withTimeout(
          supabase
            .from('wheel_spins')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(100),
          8000
        );
        if (!error && Array.isArray(data)) {
          const mapped = data.map((d: any) => ({
            id: d.id,
            user_id: d.user_id,
            username: d.ip_address || 'Kullanıcı',
            reward_title: d.reward_name,
            reward_value: Number(d.reward_value || 0),
            created_at: d.created_at,
          })) as WheelSpin[];
          setStored(STORAGE_KEYS.WHEEL_SPINS, mapped, true);
          return mapped;
        }
      } catch (err) {
        console.warn('Supabase getWheelSpins error:', err);
      }
    }
    return getStored<WheelSpin[]>(STORAGE_KEYS.WHEEL_SPINS, []);
  },

  async spinWheel(userId: string, username: string): Promise<{ success: boolean; reward: WheelReward; message?: string }> {
    const spins = await this.getWheelSpins();
    const today = new Date().toDateString();

    const rewards = (await this.getWheelRewards()).filter((r) => r.active);
    if (rewards.length === 0) {
      throw new Error('Aktif çark ödülü bulunamadı');
    }

    // Check if user already spun today in database
    const userTodaySpin = spins.find(
      (s) => s.user_id === userId && new Date(s.created_at).toDateString() === today
    );

    if (userTodaySpin) {
      return {
        success: false,
        reward: rewards[0],
        message: 'Bugünkü çark çevirme hakkınızı kullandınız. Yarın tekrar bekleriz!',
      };
    }

    // Weighted random selection
    const totalProb = rewards.reduce((acc, r) => acc + (r.probability || 10), 0);
    const rand = Math.random() * totalProb;
    let running = 0;
    let selected = rewards[0];

    for (const r of rewards) {
      running += r.probability || 10;
      if (rand <= running) {
        selected = r;
        break;
      }
    }

    // Save spin to database
    const newSpin: WheelSpin = {
      id: `spin-${Date.now()}`,
      user_id: userId,
      username,
      reward_id: selected.id,
      reward_title: selected.title,
      reward_value: selected.reward_value,
      created_at: new Date().toISOString(),
    };
    spins.unshift(newSpin);
    setStored(STORAGE_KEYS.WHEEL_SPINS, spins);

    if (isSupabaseReady()) {
      try {
        await supabase.from('wheel_spins').insert({
          id: newSpin.id,
          user_id: userId,
          reward_id: selected.id,
          reward_name: selected.title,
          reward_type: selected.reward_type,
          reward_value: String(selected.reward_value),
          ip_address: username,
          created_at: newSpin.created_at,
        });
      } catch (err) {
        console.warn('Supabase wheel_spins insert error:', err);
      }
    }

    // Update user balance directly in database if coin
    if (selected.reward_type === 'coin' && selected.reward_value > 0) {
      await this.addCoins(userId, selected.reward_value);
    }

    return {
      success: true,
      reward: selected,
    };
  },

  // --- 7-Day Login Streak (Database Authoritative) ---
  async getUserStreak(userId: string): Promise<UserStreakInfo> {
    const allStreaks = getStored<Record<string, UserStreakInfo>>(STORAGE_KEYS.USER_STREAKS, {});
    let userStreak = allStreaks[userId] || {
      current_streak: 0,
      last_claimed_date: null,
      is_claimed_today: false,
      streak_history: [],
    };

    if (isSupabaseReady()) {
      try {
        const { data, error } = await withTimeout(
          supabase
            .from('user_streaks')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle(),
          6000
        );
        if (!error && data) {
          userStreak = {
            current_streak: Number(data.current_streak || 0),
            last_claimed_date: data.last_claimed_date || null,
            is_claimed_today: false,
            streak_history: Array.isArray(data.streak_history) ? data.streak_history : [],
          };
          allStreaks[userId] = userStreak;
          setStored(STORAGE_KEYS.USER_STREAKS, allStreaks, true);
        }
      } catch (err) {
        console.warn('Supabase getUserStreak error:', err);
      }
    }

    const d = new Date();
    const todayKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    
    const y = new Date();
    y.setDate(y.getDate() - 1);
    const yesterdayKey = `${y.getFullYear()}-${String(y.getMonth() + 1).padStart(2, '0')}-${String(y.getDate()).padStart(2, '0')}`;

    const isClaimedToday = userStreak.last_claimed_date === todayKey;
    let currentStreak = userStreak.current_streak || 0;

    if (!isClaimedToday && userStreak.last_claimed_date && userStreak.last_claimed_date !== yesterdayKey) {
      currentStreak = 0;
    }

    return {
      current_streak: currentStreak,
      last_claimed_date: userStreak.last_claimed_date,
      is_claimed_today: isClaimedToday,
      streak_history: userStreak.streak_history || [],
    };
  },

  async claimDailyStreak(userId: string, username?: string): Promise<{ success: boolean; message: string; streak: number; reward: StreakDayConfig; new_balance: number }> {
    const settings = await this.getSettings();
    const streakDays: StreakDayConfig[] = (settings.streak_rewards && settings.streak_rewards.length > 0)
      ? settings.streak_rewards
      : (initialSiteSettings.streak_rewards || []);

    const allStreaks = getStored<Record<string, UserStreakInfo>>(STORAGE_KEYS.USER_STREAKS, {});
    const currentInfo = await this.getUserStreak(userId);

    if (currentInfo.is_claimed_today) {
      const todayReward = streakDays.find((r) => r.day === currentInfo.current_streak) || streakDays[0];
      const profiles = await this.getProfiles();
      const user = profiles.find((p) => p.id === userId);
      return {
        success: false,
        message: 'Bugünkü giriş bonusunuzu zaten aldınız. Yarın tekrar bekleriz!',
        streak: currentInfo.current_streak,
        reward: todayReward,
        new_balance: user?.coin_balance || 0,
      };
    }

    const d = new Date();
    const todayKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    const nextStreak = (currentInfo.current_streak >= 7 || currentInfo.current_streak === 0) ? 1 : currentInfo.current_streak + 1;
    
    const reward = streakDays.find((r) => r.day === nextStreak) || streakDays[nextStreak - 1] || {
      day: nextStreak,
      reward_coins: 50 * nextStreak,
      label: `${50 * nextStreak} Coin`,
    };

    // Add coins directly to Supabase
    const newBalance = await this.addCoins(userId, reward.reward_coins);

    const historyItem = {
      day: nextStreak,
      claimed_at: new Date().toISOString(),
      coins_awarded: reward.reward_coins,
    };

    const updatedUserStreak: UserStreakInfo = {
      current_streak: nextStreak,
      last_claimed_date: todayKey,
      is_claimed_today: true,
      streak_history: [historyItem, ...(currentInfo.streak_history || []).slice(0, 30)],
    };

    allStreaks[userId] = updatedUserStreak;
    setStored(STORAGE_KEYS.USER_STREAKS, allStreaks);

    if (isSupabaseReady()) {
      try {
        await supabase
          .from('user_streaks')
          .upsert({
            user_id: userId,
            current_streak: nextStreak,
            last_claimed_date: todayKey,
            streak_history: updatedUserStreak.streak_history,
            updated_at: new Date().toISOString(),
          });
      } catch (err) {
        console.warn('Supabase user_streaks upsert error:', err);
      }
    }

    await this.logAdminAction(
      `${nextStreak}. Gün Giriş Bonusu Alındı (+${reward.reward_coins} Coin)`,
      'user_streak',
      userId,
      { streak: nextStreak, coins: reward.reward_coins, username: username || userId }
    );

    return {
      success: true,
      message: `Tebrikler! ${nextStreak}. Gün Giriş Bonusu (+${reward.reward_coins} Coin) hesabınıza tanımlandı!`,
      streak: nextStreak,
      reward,
      new_balance: newBalance,
    };
  },

  // --- Giveaways (Database Authoritative) ---
  async getGiveaways(): Promise<Giveaway[]> {
    if (isSupabaseReady()) {
      try {
        const { data, error } = await withTimeout(
          supabase
            .from('giveaways')
            .select('*')
            .order('created_at', { ascending: false }),
          8000
        );
        if (!error && Array.isArray(data)) {
          const allStoredEntries = await this.getGiveawayEntries();
          const remoteGiveaways = data.map((d: any) => {
            const winnerObj = Array.isArray(d.winners) && d.winners.length > 0 ? d.winners[0] : null;
            const winnerName = d.winner_username || (winnerObj ? (winnerObj.username || winnerObj.name) : undefined);
            const matchCount = allStoredEntries.filter((e) => e.giveaway_id === d.id).length;
            return {
              ...d,
              id: d.id,
              title: d.title || 'Çekiliş',
              description: d.description || '',
              image_url: d.image_url || '',
              prize_details: d.prize || d.prize_details || 'Ödül',
              start_at: d.created_at || new Date().toISOString(),
              end_at: d.end_date || d.end_at || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
              active: d.is_active !== undefined ? Boolean(d.is_active) : (d.active !== false),
              winner_count: d.total_winners || d.winner_count || 1,
              entries_count: Math.max(Number(d.entries_count) || 0, matchCount),
              is_completed: Boolean(d.is_completed || winnerName),
              winner_username: winnerName,
              winner_id: d.winner_id || (winnerObj ? winnerObj.id : undefined),
              winner_announced_at: d.winner_announced_at || (winnerObj ? winnerObj.date : undefined),
              winner_note: d.winner_note || (winnerObj ? winnerObj.note : undefined),
            };
          }) as Giveaway[];
          setStored(STORAGE_KEYS.GIVEAWAYS, remoteGiveaways, true);
          return remoteGiveaways;
        }
      } catch (err) {
        console.warn('Supabase getGiveaways error:', err);
      }
    }

    const localGiveaways = getStored<Giveaway[]>(STORAGE_KEYS.GIVEAWAYS, []);
    return localGiveaways.map((g) => ({
      ...g,
      active: g.is_completed ? true : (g.active !== false),
    }));
  },

  async createGiveaway(giveaway: Partial<Giveaway>): Promise<Giveaway> {
    return this.saveGiveaway(giveaway);
  },

  async updateGiveaway(id: string, giveaway: Partial<Giveaway>): Promise<Giveaway> {
    return this.saveGiveaway({ ...giveaway, id });
  },

  async saveGiveaway(giveaway: Partial<Giveaway>): Promise<Giveaway> {
    const giveaways = await this.getGiveaways();
    let saved: Giveaway;

    let endAtIso = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    if (giveaway.end_at) {
      const parsed = new Date(giveaway.end_at);
      if (!isNaN(parsed.getTime())) {
        endAtIso = parsed.toISOString();
      }
    }

    if (giveaway.id) {
      const idx = giveaways.findIndex((g) => g.id === giveaway.id);
      if (idx !== -1) {
        saved = {
          ...giveaways[idx],
          ...giveaway,
          end_at: endAtIso,
          id: giveaway.id,
        } as Giveaway;
        giveaways[idx] = saved;
      } else {
        saved = {
          ...giveaway,
          end_at: endAtIso,
          id: giveaway.id,
        } as Giveaway;
        giveaways.unshift(saved);
      }
    } else {
      const generatedId = `giv-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      saved = {
        id: generatedId,
        title: giveaway.title?.trim() || 'Yeni Büyük Çekiliş',
        description: giveaway.description?.trim() || '',
        image_url: giveaway.image_url?.trim() || 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=800&h=450&q=80',
        prize_details: giveaway.prize_details?.trim() || 'Büyük Ödül',
        start_at: giveaway.start_at || new Date().toISOString(),
        end_at: endAtIso,
        active: giveaway.active !== false,
        winner_count: giveaway.winner_count || 1,
        entries_count: 0,
        is_completed: Boolean(giveaway.is_completed),
        winner_username: giveaway.winner_username || undefined,
        winner_id: giveaway.winner_id || undefined,
        winner_announced_at: giveaway.winner_announced_at || undefined,
        winner_note: giveaway.winner_note || undefined,
      };
      giveaways.unshift(saved);
    }

    setStored(STORAGE_KEYS.GIVEAWAYS, giveaways);

    if (isSupabaseReady()) {
      try {
        const basePayload = {
          id: saved.id,
          title: saved.title,
          description: saved.description,
          image_url: saved.image_url,
          prize: saved.prize_details,
          total_winners: saved.winner_count,
          end_date: saved.end_at,
          is_active: saved.active !== false,
          created_at: saved.start_at || new Date().toISOString(),
          winners: saved.winner_username
            ? [{ username: saved.winner_username, id: saved.winner_id, note: saved.winner_note, date: saved.winner_announced_at }]
            : [],
        };

        const extendedPayload = {
          ...basePayload,
          is_completed: Boolean(saved.is_completed),
          winner_username: saved.winner_username || null,
          winner_id: saved.winner_id || null,
          winner_announced_at: saved.winner_announced_at || null,
          winner_note: saved.winner_note || null,
        };

        const { error: upsertErr } = await supabase.from('giveaways').upsert(extendedPayload);
        if (upsertErr) {
          console.warn('Extended giveaways upsert error, falling back to base schema:', upsertErr);
          await supabase.from('giveaways').upsert(basePayload);
        }
      } catch (err) {
        console.warn('Supabase saveGiveaway error:', err);
      }
    }

    await invalidateServerCache();
    await this.logAdminAction(giveaway.id ? 'Çekiliş Güncellendi' : 'Yeni Çekiliş Oluşturuldu', 'giveaway', saved.id);
    return saved;
  },

  async concludeGiveaway(
    giveawayId: string,
    winnerUsername: string,
    winnerId?: string,
    winnerNote?: string
  ): Promise<Giveaway> {
    const giveaways = await this.getGiveaways();
    const target = giveaways.find((g) => g.id === giveawayId);
    if (!target) {
      throw new Error('Çekiliş bulunamadı');
    }

    const updated: Giveaway = {
      ...target,
      is_completed: true,
      active: true,
      winner_username: winnerUsername.trim(),
      winner_id: winnerId || undefined,
      winner_note: winnerNote?.trim() || undefined,
      winner_announced_at: new Date().toISOString(),
    };

    const saved = await this.saveGiveaway(updated);
    await this.logAdminAction('Çekiliş Sonuçlandırıldı', 'giveaway', giveawayId, {
      winner: winnerUsername,
      prize: target.prize_details,
    });
    return saved;
  },

  async reopenGiveaway(giveawayId: string): Promise<Giveaway> {
    const giveaways = await this.getGiveaways();
    const target = giveaways.find((g) => g.id === giveawayId);
    if (!target) {
      throw new Error('Çekiliş bulunamadı');
    }

    const updated: Giveaway = {
      ...target,
      is_completed: false,
      active: true,
      winner_username: undefined,
      winner_id: undefined,
      winner_note: undefined,
      winner_announced_at: undefined,
    };

    const saved = await this.saveGiveaway(updated);
    await this.logAdminAction('Çekiliş Yeniden Başlatıldı', 'giveaway', giveawayId);
    return saved;
  },

  async getEntriesByGiveawayId(giveawayId: string): Promise<GiveawayEntry[]> {
    const allEntries = await this.getGiveawayEntries();
    return allEntries.filter((e) => e.giveaway_id === giveawayId);
  },

  async deleteGiveaway(id: string): Promise<void> {
    const giveaways = await this.getGiveaways();
    setStored(STORAGE_KEYS.GIVEAWAYS, giveaways.filter((g) => g.id !== id));

    if (isSupabaseReady()) {
      try {
        await supabase.from('giveaways').delete().eq('id', id);
      } catch (err) {
        console.warn('Supabase deleteGiveaway error:', err);
      }
    }

    await invalidateServerCache();
  },

  // --- Giveaway Templates ---
  async getGiveawayTemplates(): Promise<GiveawayTemplate[]> {
    if (isSupabaseReady()) {
      try {
        const { data, error } = await withTimeout(
          supabase
            .from('giveaway_templates')
            .select('*')
            .order('created_at', { ascending: true }),
          5000
        );
        if (!error && Array.isArray(data) && data.length > 0) {
          setStored(STORAGE_KEYS.GIVEAWAY_TEMPLATES, data, true);
          return data as GiveawayTemplate[];
        }
      } catch (err) {
        console.warn('Supabase getGiveawayTemplates fallback:', err);
      }
    }
    return getStored<GiveawayTemplate[]>(STORAGE_KEYS.GIVEAWAY_TEMPLATES, initialGiveawayTemplates);
  },

  async saveGiveawayTemplate(template: GiveawayTemplate): Promise<GiveawayTemplate> {
    const templates = await this.getGiveawayTemplates();
    const targetId = template.id || `tpl-${Date.now()}`;
    const idx = templates.findIndex((t) => t.id === targetId);
    let saved: GiveawayTemplate;
    if (idx !== -1) {
      saved = { ...templates[idx], ...template, id: targetId };
      templates[idx] = saved;
    } else {
      saved = { ...template, id: targetId };
      templates.push(saved);
    }
    setStored(STORAGE_KEYS.GIVEAWAY_TEMPLATES, templates);

    if (isSupabaseReady()) {
      try {
        await supabase.from('giveaway_templates').upsert({
          id: saved.id,
          name: saved.name,
          title: saved.title,
          prize_details: saved.prize_details,
          image_url: saved.image_url,
          description: saved.description,
          duration_days: saved.duration_days || 7,
          badge_color: saved.badge_color || 'violet',
        });
      } catch (err) {
        console.warn('Supabase saveGiveawayTemplate error:', err);
      }
    }

    return saved;
  },

  async deleteGiveawayTemplate(id: string): Promise<void> {
    const templates = await this.getGiveawayTemplates();
    setStored(STORAGE_KEYS.GIVEAWAY_TEMPLATES, templates.filter((t) => t.id !== id));

    if (isSupabaseReady()) {
      try {
        await supabase.from('giveaway_templates').delete().eq('id', id);
      } catch (err) {
        console.warn('Supabase deleteGiveawayTemplate error:', err);
      }
    }
  },

  async resetGiveawayTemplates(): Promise<GiveawayTemplate[]> {
    setStored(STORAGE_KEYS.GIVEAWAY_TEMPLATES, initialGiveawayTemplates);

    if (isSupabaseReady()) {
      try {
        await supabase.from('giveaway_templates').delete().neq('id', 'null');
        await supabase.from('giveaway_templates').upsert(initialGiveawayTemplates);
      } catch (err) {
        console.warn('Supabase resetGiveawayTemplates error:', err);
      }
    }

    return initialGiveawayTemplates;
  },

  // --- Giveaway Entries (Database Authoritative) ---
  async getGiveawayEntries(): Promise<GiveawayEntry[]> {
    if (isSupabaseReady()) {
      try {
        const { data, error } = await withTimeout(
          supabase
            .from('giveaway_entries')
            .select('*')
            .order('created_at', { ascending: false }),
          8000
        );
        if (!error && Array.isArray(data)) {
          setStored(STORAGE_KEYS.GIVEAWAY_ENTRIES, data, true);
          return data as GiveawayEntry[];
        }
      } catch (err) {
        console.warn('Supabase getGiveawayEntries error:', err);
      }
    }
    return getStored<GiveawayEntry[]>(STORAGE_KEYS.GIVEAWAY_ENTRIES, []);
  },

  async enterGiveaway(giveawayId: string, userId: string, username: string): Promise<{ success: boolean; message: string }> {
    // 1. Check if giveaway has completed or expired
    const allGiveaways = await this.getGiveaways();
    const targetG = allGiveaways.find((g) => g.id === giveawayId);
    if (targetG) {
      const isExpired = targetG.is_completed || (targetG.end_at && new Date(targetG.end_at).getTime() <= Date.now());
      if (isExpired) {
        return { success: false, message: 'Bu çekilişin katılım süresi dolmuştur. Katılım sağlanamaz.' };
      }
    }

    const entries = await this.getGiveawayEntries();
    const cleanUsername = (username || 'Kullanıcı').trim();
    const existing = entries.find(
      (e) => e.giveaway_id === giveawayId && (e.user_id === userId || (cleanUsername && e.username?.toLowerCase() === cleanUsername.toLowerCase()))
    );
    if (existing) {
      return { success: false, message: 'Bu çekilişe zaten katıldınız!' };
    }

    const newEntry: GiveawayEntry = {
      id: `entry-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      giveaway_id: giveawayId,
      user_id: userId,
      username: cleanUsername,
      created_at: new Date().toISOString(),
    };
    entries.push(newEntry);
    setStored(STORAGE_KEYS.GIVEAWAY_ENTRIES, entries);

    // Try server-side join endpoint for instant Supabase sync & duplicate check
    try {
      const res = await fetch('/api/giveaways/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          giveaway_id: giveawayId,
          user_id: userId,
          username: cleanUsername,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.already_joined) {
          return { success: false, message: 'Bu çekilişe zaten katıldınız!' };
        }
        if (json.expired) {
          return { success: false, message: 'Bu çekilişin katılım süresi dolmuştur. Katılım sağlanamaz.' };
        }
      } else {
        const errJson = await res.json().catch(() => ({}));
        if (errJson.message) {
          return { success: false, message: errJson.message };
        }
      }
    } catch {
      if (isSupabaseReady()) {
        try {
          await supabase.from('giveaway_entries').insert({
            id: newEntry.id,
            giveaway_id: giveawayId,
            user_id: userId,
            username: cleanUsername,
            created_at: newEntry.created_at,
          });
        } catch (err) {
          console.warn('Supabase giveaway_entries insert error:', err);
        }
      }
    }

    await invalidateServerCache();
    window.dispatchEvent(
      new CustomEvent('sponsorhub_db_change', {
        detail: { key: 'sponsorhub_giveaways_v1' },
      })
    );

    return { success: true, message: '🎉 Çekilişe başarıyla katıldınız! Bol şans.' };
  },

  // --- Store Products & Orders (Database Authoritative) ---
  async getStoreProducts(): Promise<StoreProduct[]> {
    if (isSupabaseReady()) {
      try {
        const { data, error } = await withTimeout(
          supabase
            .from('store_products')
            .select('*')
            .order('sort_order', { ascending: true }),
          8000
        );
        if (!error && Array.isArray(data)) {
          const mapped = data.map((d: any) => ({
            ...d,
            id: d.id,
            name: d.title || d.name,
            description: d.description || '',
            image_url: d.image_url || '',
            coin_price: d.price_coins || d.coin_price || 100,
            stock: d.stock || 50,
            category: d.category || 'digital',
            active: d.is_active !== undefined ? Boolean(d.is_active) : (d.active !== false),
            sort_order: d.sort_order || 0,
          })) as StoreProduct[];
          setStored(STORAGE_KEYS.STORE_PRODUCTS, mapped, true);
          return mapped;
        }
      } catch (err) {
        console.warn('Supabase getStoreProducts error:', err);
      }
    }
    const storedProducts = getStored<StoreProduct[]>(STORAGE_KEYS.STORE_PRODUCTS, []);
    return storedProducts.sort(
      (a, b) => a.sort_order - b.sort_order
    );
  },

  async createStoreProduct(product: Partial<StoreProduct>): Promise<StoreProduct> {
    return this.saveStoreProduct(product);
  },

  async updateStoreProduct(id: string, product: Partial<StoreProduct>): Promise<StoreProduct> {
    return this.saveStoreProduct({ ...product, id });
  },

  async saveStoreProduct(product: Partial<StoreProduct>): Promise<StoreProduct> {
    const products = await this.getStoreProducts();
    let saved: StoreProduct;
    if (product.id) {
      const idx = products.findIndex((p) => p.id === product.id);
      if (idx !== -1) {
        saved = { ...products[idx], ...product } as StoreProduct;
        products[idx] = saved;
      } else {
        saved = { ...product, id: product.id } as StoreProduct;
        products.push(saved);
      }
    } else {
      saved = {
        id: `prod-${Date.now()}`,
        name: product.name || 'Yeni Ürün',
        description: product.description || '',
        image_url: product.image_url || 'https://images.unsplash.com/photo-1612287233261-267039757657?auto=format&fit=crop&w=500&h=350&q=80',
        coin_price: product.coin_price || 100,
        stock: product.stock || 50,
        category: product.category || 'digital',
        active: product.active !== false,
        sort_order: products.length + 1,
      };
      products.push(saved);
    }
    setStored(STORAGE_KEYS.STORE_PRODUCTS, products);

    if (isSupabaseReady()) {
      try {
        await supabase.from('store_products').upsert({
          id: saved.id,
          title: saved.name,
          description: saved.description,
          image_url: saved.image_url,
          price_coins: saved.coin_price,
          stock: saved.stock,
          category: saved.category,
          is_active: saved.active !== false,
          sort_order: saved.sort_order || 0,
          created_at: new Date().toISOString(),
        });
      } catch (err) {
        console.warn('Supabase saveStoreProduct error:', err);
      }
    }

    await invalidateServerCache();
    await this.logAdminAction('Mağaza Ürünü Güncellendi', 'product', saved.id);
    return saved;
  },

  async deleteStoreProduct(id: string): Promise<void> {
    const products = await this.getStoreProducts();
    setStored(STORAGE_KEYS.STORE_PRODUCTS, products.filter((p) => p.id !== id));

    if (isSupabaseReady()) {
      try {
        await supabase.from('store_products').delete().eq('id', id);
      } catch (err) {
        console.warn('Supabase deleteStoreProduct error:', err);
      }
    }

    await invalidateServerCache();
  },

  async getStoreOrders(): Promise<StoreOrder[]> {
    if (isSupabaseReady()) {
      try {
        const { data, error } = await withTimeout(
          supabase
            .from('store_orders')
            .select('*')
            .order('created_at', { ascending: false }),
          8000
        );
        if (!error && Array.isArray(data)) {
          const mapped = data.map((d: any) => {
            let parsedInfo: any = {};
            if (typeof d.delivery_info === 'object' && d.delivery_info !== null) {
              parsedInfo = d.delivery_info;
            } else if (typeof d.delivery_info === 'string') {
              try {
                parsedInfo = JSON.parse(d.delivery_info);
              } catch {
                parsedInfo = { note: d.delivery_info };
              }
            }

            return {
              id: d.id,
              user_id: d.user_id,
              username: parsedInfo.username || d.username || 'Kullanıcı',
              product_id: d.product_id,
              product_name: d.product_title || d.product_name || 'Ürün',
              coin_price: d.price_coins || d.coin_price || 0,
              payout_type: d.payout_type || parsedInfo.payout_type || (parsedInfo.iban ? 'iban' : parsedInfo.trx_address ? 'trx' : undefined),
              payout_address: d.payout_address || parsedInfo.payout_address || parsedInfo.iban || parsedInfo.trx_address || '',
              payout_holder_name: d.payout_holder_name || parsedInfo.payout_holder_name || parsedInfo.holder_name || '',
              payout_bank_name: d.payout_bank_name || parsedInfo.payout_bank_name || '',
              status: (d.status || 'pending') as 'pending' | 'completed' | 'cancelled' | 'rejected',
              delivery_note: parsedInfo.note || parsedInfo.delivery_note || d.delivery_note || '',
              admin_note: d.admin_note || parsedInfo.admin_note || '',
              created_at: d.created_at,
              updated_at: d.updated_at,
            };
          }) as StoreOrder[];
          setStored(STORAGE_KEYS.STORE_ORDERS, mapped, true);
          return mapped;
        }
      } catch (err) {
        console.warn('Supabase getStoreOrders error:', err);
      }
    }
    return getStored<StoreOrder[]>(STORAGE_KEYS.STORE_ORDERS, []);
  },

  async purchaseProduct(
    userId: string,
    username: string,
    productId: string,
    payoutDetails: {
      payout_type: 'trx' | 'iban';
      payout_address: string;
      payout_holder_name?: string;
      payout_bank_name?: string;
      delivery_note?: string;
    }
  ): Promise<{ success: boolean; message: string }> {
    const profile = (await this.getProfiles()).find((p) => p.id === userId);
    if (!profile) return { success: false, message: 'Kullanıcı profili bulunamadı' };

    const products = await this.getStoreProducts();
    const product = products.find((p) => p.id === productId);
    if (!product || !product.active) return { success: false, message: 'Ürün bulunamadı veya satışta değil' };

    if (product.stock <= 0) return { success: false, message: 'Ürün stokları tükenmiştir' };
    if (profile.coin_balance < product.coin_price) {
      return {
        success: false,
        message: `Yetersiz bakiye! Gereken: ${product.coin_price} Coin, Mevcut: ${profile.coin_balance} Coin`,
      };
    }

    if (!payoutDetails || !payoutDetails.payout_address || !payoutDetails.payout_address.trim()) {
      return {
        success: false,
        message: payoutDetails?.payout_type === 'trx'
          ? 'Lütfen geçerli bir TRX / TRC-20 cüzdan adresi giriniz.'
          : 'Lütfen geçerli bir IBAN numarası giriniz.',
      };
    }

    if (payoutDetails.payout_type === 'iban' && (!payoutDetails.payout_holder_name || !payoutDetails.payout_holder_name.trim())) {
      return {
        success: false,
        message: 'Lütfen IBAN hesap sahibinin Ad ve Soyadını giriniz.',
      };
    }

    // Deduct coins directly from Supabase profile
    await this.addCoins(userId, -product.coin_price);

    // Decrease stock in Supabase store_products
    product.stock = Math.max(0, product.stock - 1);
    await this.saveStoreProduct(product);

    // Delivery info bundle
    const deliveryPayload = {
      username,
      payout_type: payoutDetails.payout_type,
      payout_address: payoutDetails.payout_address.trim(),
      payout_holder_name: payoutDetails.payout_holder_name?.trim() || '',
      payout_bank_name: payoutDetails.payout_bank_name?.trim() || '',
      note: payoutDetails.delivery_note?.trim() || '',
    };

    // Add order directly to store_orders
    const newOrder: StoreOrder = {
      id: `ord-${Date.now()}`,
      user_id: userId,
      username,
      product_id: productId,
      product_name: product.name,
      coin_price: product.coin_price,
      payout_type: payoutDetails.payout_type,
      payout_address: payoutDetails.payout_address.trim(),
      payout_holder_name: payoutDetails.payout_holder_name?.trim() || '',
      payout_bank_name: payoutDetails.payout_bank_name?.trim() || '',
      status: 'pending',
      delivery_note: payoutDetails.delivery_note?.trim() || '',
      created_at: new Date().toISOString(),
    };

    const orders = await this.getStoreOrders();
    orders.unshift(newOrder);
    setStored(STORAGE_KEYS.STORE_ORDERS, orders);

    if (isSupabaseReady()) {
      try {
        await supabase.from('store_orders').insert({
          id: newOrder.id,
          user_id: userId,
          product_id: productId,
          product_title: product.name,
          price_coins: product.coin_price,
          status: 'pending',
          delivery_info: deliveryPayload,
          created_at: newOrder.created_at,
        });
      } catch (err) {
        console.warn('Supabase store_orders insert error:', err);
      }
    }

    await this.logAdminAction(
      `Mağaza Siparişi Alındı (${payoutDetails.payout_type.toUpperCase()}): ${product.name}`,
      'store_order',
      newOrder.id,
      {
        user_id: userId,
        username,
        product_name: product.name,
        price: product.coin_price,
        payout_type: payoutDetails.payout_type,
        payout_address: payoutDetails.payout_address,
        payout_holder: payoutDetails.payout_holder_name,
      }
    );

    return {
      success: true,
      message: `🎉 Tebrikler! ${product.name} siparişiniz oluşturuldu ve incelenmek üzere kuyruğa alındı.`,
    };
  },

  async updateStoreOrderStatus(
    orderId: string,
    status: 'pending' | 'completed' | 'cancelled' | 'rejected',
    adminNote?: string
  ): Promise<StoreOrder | null> {
    const orders = await this.getStoreOrders();
    const idx = orders.findIndex((o) => o.id === orderId);
    if (idx === -1) return null;

    const currentOrder = orders[idx];
    orders[idx] = {
      ...currentOrder,
      status,
      admin_note: adminNote !== undefined ? adminNote : currentOrder.admin_note,
      updated_at: new Date().toISOString(),
    };

    // If order was cancelled or rejected, optionally refund coins if requested
    if ((status === 'cancelled' || status === 'rejected') && currentOrder.status === 'pending') {
      // Refund coins
      await this.addCoins(currentOrder.user_id, currentOrder.coin_price);
    }

    setStored(STORAGE_KEYS.STORE_ORDERS, orders);

    if (isSupabaseReady()) {
      try {
        await supabase.from('store_orders').update({
          status,
          updated_at: new Date().toISOString(),
        }).eq('id', orderId);
      } catch (err) {
        console.warn('Supabase updateStoreOrderStatus error:', err);
      }
    }

    await invalidateServerCache();
    await this.logAdminAction(
      `Sipariş Durumu Güncellendi (${status.toUpperCase()}): #${orderId}`,
      'store_order',
      orderId,
      { status, admin_note: adminNote }
    );

    return orders[idx];
  },

  // --- Profiles & Auth (Database Authoritative) ---
  async getProfiles(): Promise<Profile[]> {
    if (isSupabaseReady()) {
      try {
        const { data, error } = await withTimeout(
          supabase
            .from('profiles')
            .select('*'),
          8000
        );
        if (!error && Array.isArray(data)) {
          const mapped = data.map((d: any) => {
            const hasTelegram = Boolean(d.telegram_id || d.telegram_username);
            const tgAvatar = d.avatar_url || (hasTelegram
              ? `https://ui-avatars.com/api/?name=${encodeURIComponent(d.first_name || d.username || 'Telegram User')}&background=24A1DE&color=ffffff&bold=true&size=256`
              : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&h=200&q=80');

            return {
              id: d.id,
              username: d.username,
              avatar_url: tgAvatar,
              coin_balance: d.coins ?? d.coin_balance ?? 250,
              role: d.role || 'user',
              active: d.active !== false,
              telegram_id: d.telegram_id || undefined,
              telegram_username: d.telegram_username || undefined,
              telegram_first_name: d.first_name || d.telegram_first_name || undefined,
              telegram_last_name: d.last_name || d.telegram_last_name || undefined,
              telegram_photo_url: d.avatar_url || undefined,
              is_telegram_verified: hasTelegram,
              created_at: d.created_at || new Date().toISOString(),
              updated_at: d.updated_at || new Date().toISOString(),
            };
          }) as Profile[];
          setStored(STORAGE_KEYS.PROFILES, mapped, true);
          return mapped;
        }
      } catch (err) {
        console.warn('Supabase getProfiles error:', err);
      }
    }
    return getStored<Profile[]>(STORAGE_KEYS.PROFILES, []);
  },

  async saveProfile(profile: Partial<Profile>): Promise<Profile> {
    const profiles = await this.getProfiles();
    let saved: Profile;
    const idx = profiles.findIndex((p) => p.id === profile.id || (profile.telegram_id && p.telegram_id === profile.telegram_id));
    if (idx !== -1) {
      saved = { ...profiles[idx], ...profile, updated_at: new Date().toISOString() };
      profiles[idx] = saved;
    } else {
      saved = {
        id: profile.id || `usr-${Date.now()}`,
        username: profile.username || `Kullanıcı_${Math.floor(1000 + Math.random() * 9000)}`,
        avatar_url: profile.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&h=200&q=80',
        coin_balance: profile.coin_balance ?? 250,
        role: profile.role || 'user',
        active: profile.active !== false,
        telegram_id: profile.telegram_id,
        telegram_username: profile.telegram_username,
        telegram_first_name: profile.telegram_first_name,
        telegram_last_name: profile.telegram_last_name,
        telegram_photo_url: profile.telegram_photo_url,
        telegram_auth_date: profile.telegram_auth_date,
        is_telegram_verified: profile.is_telegram_verified ?? Boolean(profile.telegram_id || profile.telegram_username),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      profiles.push(saved);
    }
    setStored(STORAGE_KEYS.PROFILES, profiles);

    if (isSupabaseReady()) {
      try {
        await supabase.from('profiles').upsert({
          id: saved.id,
          username: saved.username,
          telegram_id: saved.telegram_id || null,
          telegram_username: saved.telegram_username || null,
          first_name: saved.telegram_first_name || null,
          last_name: saved.telegram_last_name || null,
          avatar_url: saved.avatar_url,
          coins: saved.coin_balance,
          role: saved.role,
        });
      } catch (err) {
        console.warn('Supabase saveProfile error:', err);
      }
    }

    try {
      fetch('/api/telegram/sync-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user: {
            id: saved.telegram_id || saved.id,
            username: saved.telegram_username || saved.username,
            first_name: saved.telegram_first_name,
            last_name: saved.telegram_last_name,
            photo_url: saved.avatar_url,
            coins: saved.coin_balance,
            role: saved.role,
          },
        }),
      }).catch(() => {});
    } catch {
      // ignore
    }

    return saved;
  },

  async addCoins(userId: string, amount: number): Promise<number> {
    const profiles = await this.getProfiles();
    const user = profiles.find((p) => p.id === userId);
    if (user) {
      user.coin_balance = Math.max(0, (user.coin_balance || 0) + amount);
      user.updated_at = new Date().toISOString();
      await this.saveProfile(user);
      return user.coin_balance;
    }
    return 0;
  },

  async updateUserByAdmin(
    userId: string,
    updates: {
      role?: UserRole;
      coin_balance?: number;
      active?: boolean;
      username?: string;
    },
    adminUsername?: string
  ): Promise<Profile | null> {
    const profiles = await this.getProfiles();
    const target = profiles.find((p) => p.id === userId);
    if (!target) return null;

    const previousRole = target.role;
    const previousCoins = target.coin_balance;
    const previousStatus = target.active;

    if (updates.role !== undefined) target.role = updates.role;
    if (updates.coin_balance !== undefined) target.coin_balance = Math.max(0, updates.coin_balance);
    if (updates.active !== undefined) target.active = updates.active;
    if (updates.username !== undefined && updates.username.trim()) target.username = updates.username.trim();

    target.updated_at = new Date().toISOString();
    await this.saveProfile(target);

    await this.logAdminAction(
      `Kullanıcı Güncellendi: @${target.username} (${target.role})`,
      'user_management',
      target.id,
      {
        previous: { role: previousRole, coins: previousCoins, active: previousStatus },
        updated: { role: target.role, coins: target.coin_balance, active: target.active },
      },
      adminUsername
    );

    return target;
  },

  async deleteProfile(userId: string, adminUsername?: string): Promise<boolean> {
    const profiles = await this.getProfiles();
    const target = profiles.find((p) => p.id === userId);
    if (!target) return false;

    // 1. Remove from local profiles state
    const remaining = profiles.filter((p) => p.id !== userId);
    setStored(STORAGE_KEYS.PROFILES, remaining);

    // 2. Also remove user-specific local stored items
    try {
      const allSpins = (await this.getWheelSpins()).filter((s) => s.user_id !== userId);
      setStored(STORAGE_KEYS.WHEEL_SPINS, allSpins);
    } catch {
      // ignore
    }

    try {
      const allEntries = (await this.getGiveawayEntries()).filter((e) => e.user_id !== userId);
      setStored(STORAGE_KEYS.GIVEAWAY_ENTRIES, allEntries);
    } catch {
      // ignore
    }

    // 3. Remove from Supabase if connected
    if (isSupabaseReady()) {
      try {
        // Cascade delete related records first if foreign keys are restrictive
        await Promise.allSettled([
          supabase.from('wheel_spins').delete().eq('user_id', userId),
          supabase.from('giveaway_entries').delete().eq('user_id', userId),
          supabase.from('store_orders').delete().eq('user_id', userId),
          supabase.from('user_streaks').delete().eq('user_id', userId),
          supabase.from('daily_bonuses').delete().eq('user_id', userId),
        ]);
        await supabase.from('profiles').delete().eq('id', userId);
      } catch (err) {
        console.warn('Supabase deleteProfile error:', err);
      }
    }

    await this.logAdminAction(
      `Kullanıcı Hesabı Silindi: @${target.username} (ID: ${userId})`,
      'user_management',
      userId,
      { deleted_user: target },
      adminUsername
    );

    await invalidateServerCache();
    return true;
  },

  async getUserActivityHistory(userId: string) {
    const [spins, entries, orders, logs] = await Promise.all([
      this.getWheelSpins().catch(() => []),
      this.getGiveawayEntries().catch(() => []),
      this.getStoreOrders().catch(() => []),
      this.getAdminLogs().catch(() => []),
    ]);

    const userSpins = (spins || []).filter((s) => s.user_id === userId);
    const userEntries = (entries || []).filter((e) => e.user_id === userId);
    const userOrders = (orders || []).filter((o) => o.user_id === userId);
    const userLogs = (logs || []).filter(
      (l) => l.entity_id === userId || (l.details && (l.details as any).user_id === userId)
    );

    return {
      spins: userSpins,
      entries: userEntries,
      orders: userOrders,
      logs: userLogs,
      totalActivityCount: userSpins.length + userEntries.length + userOrders.length + userLogs.length,
    };
  },

  // --- Click Tracking ---
  async trackSponsorClick(sponsorId: string, userId?: string): Promise<void> {
    try {
      const sponsors = await this.getSponsors();
      const target = sponsors.find((s) => s.id === sponsorId || s.slug === sponsorId);
      if (target) {
        target.clicks_count = (target.clicks_count || 0) + 1;
        setStored(STORAGE_KEYS.SPONSORS, sponsors);
      }

      if (isSupabaseReady()) {
        await supabase.from('sponsor_clicks').insert({
          sponsor_id: target?.id || sponsorId,
          user_id: userId || null,
          referrer: document.referrer || window.location.href,
        });
      }
    } catch (err) {
      console.warn('Click tracking error:', err);
    }
  },

  async trackBannerClick(bannerId: string, userId?: string): Promise<void> {
    try {
      const banners = await this.getBanners();
      const target = banners.find((b) => b.id === bannerId);
      if (target) {
        target.clicks_count = (target.clicks_count || 0) + 1;
        setStored(STORAGE_KEYS.BANNERS, banners);
      }

      if (isSupabaseReady()) {
        await supabase.from('banner_clicks').insert({
          banner_id: bannerId,
          user_id: userId || null,
          referrer: document.referrer || window.location.href,
        });
      }
    } catch (err) {
      console.warn('Banner click tracking error:', err);
    }
  },

  // --- Admin Logs (Database Authoritative) ---
  async getAdminLogs(): Promise<AdminLog[]> {
    if (isSupabaseReady()) {
      try {
        const { data, error } = await withTimeout(
          supabase
            .from('admin_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(100),
          8000
        );
        if (!error && Array.isArray(data)) {
          const mapped = data.map((d: any) => ({
            id: d.id,
            admin_username: d.username || 'Admin',
            action: d.action,
            entity_type: d.target_type || 'system',
            entity_id: d.target_id || undefined,
            details: d.details || undefined,
            created_at: d.created_at,
          })) as AdminLog[];
          setStored(STORAGE_KEYS.ADMIN_LOGS, mapped, true);
          return mapped;
        }
      } catch (err) {
        console.warn('Supabase getAdminLogs error:', err);
      }
    }
    return getStored<AdminLog[]>(STORAGE_KEYS.ADMIN_LOGS, []);
  },

  async logAdminAction(action: string, entity_type: string, entity_id?: string, details?: Record<string, unknown>, admin_username?: string): Promise<void> {
    const newLog: AdminLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      admin_username: admin_username || 'Admin',
      action,
      entity_type,
      entity_id,
      details,
      created_at: new Date().toISOString(),
    };

    const logs = getStored<AdminLog[]>(STORAGE_KEYS.ADMIN_LOGS, []);
    logs.unshift(newLog);
    setStored(STORAGE_KEYS.ADMIN_LOGS, logs.slice(0, 200));

    if (isSupabaseReady()) {
      try {
        await supabase.from('admin_logs').insert({
          id: newLog.id,
          username: newLog.admin_username,
          action: newLog.action,
          target_type: newLog.entity_type,
          target_id: newLog.entity_id || null,
          details: newLog.details || null,
          created_at: newLog.created_at,
        });
      } catch (err) {
        console.warn('Supabase admin_logs insert error:', err);
      }
    }
  },

  async clearAdminLogs(): Promise<void> {
    setStored(STORAGE_KEYS.ADMIN_LOGS, []);

    if (isSupabaseReady()) {
      try {
        await supabase.from('admin_logs').delete().neq('id', 'null_impossible_id');
      } catch (err) {
        console.warn('Supabase clearAdminLogs error:', err);
      }
    }

    await this.logAdminAction('Tüm Sistem Logları Temizlendi', 'system');
  },

  // --- Connection Diagnostics & Seed ---
  async testConnection(): Promise<{
    connected: boolean;
    type: 'supabase' | 'local';
    latencyMs: number;
    message: string;
    stats?: {
      sponsorsCount: number;
      profilesCount: number;
      giveawaysCount: number;
      settingsFound: boolean;
    };
  }> {
    const startTime = performance.now();
    if (isSupabaseReady()) {
      try {
        const { data, error } = await withTimeout(
          supabase
            .from('site_settings')
            .select('setting_key')
            .limit(1),
          4000
        );
        const latencyMs = Math.round(performance.now() - startTime);

        if (error) {
          return {
            connected: false,
            type: 'supabase',
            latencyMs,
            message: `Supabase bağlantı yanıtı: ${error.message} (Lütfen SQL tablosunu çalıştırdığınızdan ve RLS izinlerinin açık olduğundan emin olun).`,
          };
        }

        const sponsors = await this.getSponsors();
        const profiles = await this.getProfiles();
        const giveaways = await this.getGiveaways();

        return {
          connected: true,
          type: 'supabase',
          latencyMs,
          message: 'Supabase PostgreSQL bulut veritabanına başarıyla bağlanıldı ve tüm tablolar aktif şekilde okunup yazılabilmektedir.',
          stats: {
            sponsorsCount: sponsors.length,
            profilesCount: profiles.length,
            giveawaysCount: giveaways.length,
            settingsFound: !!data,
          },
        };
      } catch (err: any) {
        const latencyMs = Math.round(performance.now() - startTime);
        return {
          connected: false,
          type: 'supabase',
          latencyMs,
          message: `Bağlantı sırasında istisna: ${err?.message || 'Bilinmeyen hata'}`,
        };
      }
    } else {
      const sponsors = await this.getSponsors();
      const profiles = await this.getProfiles();
      const giveaways = await this.getGiveaways();
      const latencyMs = Math.max(1, Math.round(performance.now() - startTime));
      return {
        connected: false,
        type: 'local',
        latencyMs,
        message: 'Supabase URL ve Anon Key henüz yapılandırılmadı. Sistem yerel modda çalışıyor.',
        stats: {
          sponsorsCount: sponsors.length,
          profilesCount: profiles.length,
          giveawaysCount: giveaways.length,
          settingsFound: true,
        },
      };
    }
  },

  // --- Seed Initial Data to Supabase ---
  async seedSupabaseDatabase(): Promise<{ success: boolean; message: string; count: number }> {
    if (!isSupabaseReady()) {
      return { success: false, message: 'Supabase bağlantısı henüz yapılandırılmamış.', count: 0 };
    }

    try {
      let totalInserted = 0;

      // 1. Site Settings
      const currentSettings = await this.getSettings();
      await supabase.from('site_settings').upsert({
        setting_key: 'general',
        setting_value: currentSettings,
        updated_at: new Date().toISOString(),
      });
      totalInserted += 1;

      // 2. Sponsors
      const sponsors = await this.getSponsors();
      for (const sp of sponsors) {
        await supabase.from('sponsors').upsert({
          id: sp.id,
          name: sp.name,
          slug: sp.slug,
          logo_url: sp.logo_url,
          banner_url: sp.banner_url || null,
          bonus_text: sp.bonus_text || null,
          rating: sp.rating || 5.0,
          review_count: sp.review_count || 0,
          direct_url: sp.direct_url || (sp as any).website_url || null,
          short_desc: sp.short_desc || sp.short_description || null,
          full_review: sp.full_review || sp.description || null,
          features: sp.features || [],
          tags: sp.tags || [],
          is_active: sp.is_active !== undefined ? sp.is_active : (sp as any).active !== false,
          is_vip: sp.is_vip || false,
          is_popular: sp.is_popular || false,
          sort_order: sp.sort_order || 0,
          created_at: sp.created_at || new Date().toISOString(),
        });
        totalInserted += 1;
      }

      // 3. Hero Slides
      const slides = await this.getHeroSlides();
      for (const sl of slides) {
        await supabase.from('hero_slides').upsert({
          id: sl.id,
          title: sl.title,
          subtitle: sl.subtitle || null,
          badge_text: sl.badge_text || null,
          badge_color: sl.badge_color || null,
          button_text: sl.button_text || null,
          button_url: sl.button_url || null,
          background_image: sl.background_image || null,
          sponsor_id: sl.sponsor_id || null,
          is_active: sl.is_active !== false,
          sort_order: sl.sort_order || 0,
          created_at: sl.created_at || new Date().toISOString(),
        });
        totalInserted += 1;
      }

      // 4. Banners
      const banners = await this.getBanners();
      for (const bn of banners) {
        await supabase.from('banners').upsert({
          id: bn.id,
          title: bn.title,
          image_url: bn.image_url,
          target_url: bn.target_url,
          location: bn.location || 'home_top',
          is_active: bn.is_active !== false,
          sort_order: bn.sort_order || 0,
          clicks: bn.clicks || 0,
          impressions: bn.impressions || 0,
          created_at: bn.created_at || new Date().toISOString(),
        });
        totalInserted += 1;
      }

      // 5. Social Links
      const socials = await this.getSocialLinks();
      for (const sc of socials) {
        await supabase.from('social_links').upsert({
          id: sc.id,
          platform: sc.platform,
          title: sc.title,
          url: sc.url,
          icon: sc.icon || null,
          is_active: sc.is_active !== false,
          sort_order: sc.sort_order || 0,
          created_at: sc.created_at || new Date().toISOString(),
        });
        totalInserted += 1;
      }

      // 6. Wheel Rewards
      const rewards = await this.getWheelRewards();
      for (const rw of rewards) {
        await supabase.from('wheel_rewards').upsert({
          id: rw.id,
          name: rw.name,
          reward_type: rw.reward_type,
          reward_value: rw.reward_value,
          probability: rw.probability,
          icon: rw.icon,
          color: rw.color,
          bg_color: rw.bg_color,
          is_active: rw.is_active !== false,
          is_jackpot: rw.is_jackpot || false,
          coin_reward: rw.coin_reward || 0,
          sort_order: rw.sort_order || 0,
          created_at: rw.created_at || new Date().toISOString(),
        });
        totalInserted += 1;
      }

      // 7. Giveaways
      const giveaways = await this.getGiveaways();
      for (const gv of giveaways) {
        await supabase.from('giveaways').upsert({
          id: gv.id,
          title: gv.title,
          description: gv.description,
          image_url: gv.image_url,
          sponsor_id: gv.sponsor_id,
          prize: gv.prize,
          total_winners: gv.total_winners,
          entry_fee_coins: gv.entry_fee_coins,
          min_level: gv.min_level,
          end_date: gv.end_date,
          winners: gv.winners || [],
          is_active: gv.is_active !== false,
          is_featured: gv.is_featured || false,
          created_at: gv.created_at || new Date().toISOString(),
        });
        totalInserted += 1;
      }

      // 8. Store Products
      const products = await this.getStoreProducts();
      for (const pr of products) {
        await supabase.from('store_products').upsert({
          id: pr.id,
          title: pr.title,
          description: pr.description,
          image_url: pr.image_url,
          price_coins: pr.price_coins,
          stock: pr.stock,
          category: pr.category,
          is_active: pr.is_active !== false,
          is_popular: pr.is_popular || false,
          sort_order: pr.sort_order || 0,
          created_at: pr.created_at || new Date().toISOString(),
        });
        totalInserted += 1;
      }

      await invalidateServerCache();

      return {
        success: true,
        message: `Tüm başlangıç verileri (${totalInserted} kayıt) Supabase veritabanına başarıyla aktarıldı.`,
        count: totalInserted,
      };
    } catch (err: any) {
      console.error('Supabase seed error:', err);
      return {
        success: false,
        message: `Veri aktarımı sırasında hata oluştu: ${err?.message || 'Bilinmeyen hata'}`,
        count: 0,
      };
    }
  },
};
