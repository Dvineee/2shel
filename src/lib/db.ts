import {
  Sponsor,
  HeroSlide,
  Banner,
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
  AdminLog,
  StreakDayConfig,
  UserStreakInfo,
} from '../types';
import {
  initialGiveawayTemplates,
  initialSiteSettings,
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

// Local storage helper
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
      window.dispatchEvent(new CustomEvent('sponsorhub_db_change', { detail: { key } }));
    }
  } catch (err) {
    console.error('Storage error:', err);
  }
}

// Fast timeout wrapper to prevent slow/hanging network requests
function withTimeout<T>(promise: PromiseLike<T>, ms = 2500): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Operation timed out after ${ms}ms`));
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

// Database Service API
export const db = {
  // --- Synchronous instant local cache retrieval ---
  getCachedData() {
    return {
      sponsors: getStored<Sponsor[]>(STORAGE_KEYS.SPONSORS, []),
      heroSlides: getStored<HeroSlide[]>(STORAGE_KEYS.HERO_SLIDES, []),
      banners: getStored<Banner[]>(STORAGE_KEYS.BANNERS, []),
      socialLinks: getStored<SocialLink[]>(STORAGE_KEYS.SOCIAL_LINKS, []),
      wheelRewards: getStored<WheelReward[]>(STORAGE_KEYS.WHEEL_REWARDS, []),
      giveaways: getStored<Giveaway[]>(STORAGE_KEYS.GIVEAWAYS, []),
      storeProducts: getStored<StoreProduct[]>(STORAGE_KEYS.STORE_PRODUCTS, []),
      settings: getStored<SiteSettings>(STORAGE_KEYS.SITE_SETTINGS, initialSiteSettings),
    };
  },

  // --- Preload / Hybrid Portal Data ---
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
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 3000);
      const res = await fetch('/api/portal/data', { signal: controller.signal });
      clearTimeout(timer);

      if (res.ok) {
        const json = await res.json();
        if (json.status === 'ok' && json.data) {
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
          } = json.data;

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
            mappedSponsors = sponsors.map((d: any) => ({
              id: d.id,
              name: d.name,
              slug: d.slug,
              logo_url: d.logo_url,
              banner_url: d.banner_url || '',
              bonus_text: d.bonus_text || '',
              description: d.full_review || d.description || '',
              short_description: d.short_desc || d.short_description || '',
              website_url: d.direct_url || d.website_url || 'https://example.com',
              button_text: d.button_text || 'DETAYLARI GÖR',
              rating: Number(d.rating || 4.8),
              featured: d.is_vip !== undefined ? Boolean(d.is_vip) : Boolean(d.featured),
              verified: d.is_active !== false,
              active: d.is_active !== undefined ? Boolean(d.is_active) : (d.active !== false),
              sort_order: d.sort_order || 0,
              stats: d.stats && Array.isArray(d.stats) && d.stats.length > 0 ? d.stats : [
                { id: `stat-1`, label: 'İlk Yatırım', value: '%100', sort_order: 1 },
                { id: `stat-2`, label: 'Deneme', value: '250 TL', sort_order: 2 },
                { id: `stat-3`, label: 'Kayıp', value: '%20', sort_order: 3 },
              ],
              features: d.features && Array.isArray(d.features) && d.features.length > 0 ? d.features : [
                { id: `feat-1`, text: 'Hızlı Çekim', sort_order: 1 },
                { id: `feat-2`, text: '7/24 Destek', sort_order: 2 },
              ],
            }));
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
          if (Array.isArray(banners)) {
            mappedBanners = banners.map((d: any) => ({
              id: d.id,
              name: d.title || d.name || 'Banner',
              image_url: d.image_url,
              target_url: d.target_url || '/',
              position: d.location === 'home_top' ? 'left' : (d.position || 'left'),
              active: d.is_active !== undefined ? Boolean(d.is_active) : (d.active !== false),
              sort_order: d.sort_order || 0,
              clicks_count: d.clicks || d.clicks_count || 0,
            }));
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
        }
      }
    } catch {
      // ignore
    }
    return null;
  },

  // --- Site Settings ---
  async getSettings(): Promise<SiteSettings> {
    const localStored = getStored<SiteSettings>(STORAGE_KEYS.SITE_SETTINGS, initialSiteSettings);

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
        console.warn('Supabase getSettings error, fallback to local', err);
      }
    }

    const stored = { ...initialSiteSettings, ...localStored };
    if (!stored.site_name || stored.site_name === 'SPONSORHUB' || stored.site_name === 'SponsorHub') {
      stored.site_name = 'SHELBYONLINE';
      stored.logo_text = 'SHELBYONLINE';
      stored.site_title = 'ShelbyOnline | Premium Sponsor & Kampanya Platformu';
      stored.footer_text = 'ShelbyOnline, doğrulanmış eğlence ve sponsorluk ağlarının en güncel bonuslarını sunan bağımsız bir topluluk portalıdır. 18 yaşından küçüklerin katılımı yasaktır.';
      setStored(STORAGE_KEYS.SITE_SETTINGS, stored, true);
    }
    return stored;
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
    await this.logAdminAction('Site Ayarları Güncellendi', 'settings', undefined, settings);
    return updated;
  },

  // --- Sponsors ---
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
          const mapped = data.map((d: any) => ({
            ...d,
            id: d.id,
            name: d.name,
            slug: d.slug,
            logo_url: d.logo_url,
            banner_url: d.banner_url || '',
            bonus_text: d.bonus_text || '',
            description: d.full_review || d.description || '',
            short_description: d.short_desc || d.short_description || '',
            website_url: d.direct_url || d.website_url || 'https://example.com',
            button_text: d.button_text || 'DETAYLARI GÖR',
            rating: Number(d.rating || 4.8),
            featured: d.is_vip !== undefined ? Boolean(d.is_vip) : Boolean(d.featured),
            verified: d.is_active !== false,
            active: d.is_active !== undefined ? Boolean(d.is_active) : (d.active !== false),
            sort_order: d.sort_order || 0,
            stats: d.stats && Array.isArray(d.stats) && d.stats.length > 0 ? d.stats : [
              { id: `stat-1`, label: 'İlk Yatırım', value: '%100', sort_order: 1 },
              { id: `stat-2`, label: 'Deneme', value: '250 TL', sort_order: 2 },
              { id: `stat-3`, label: 'Kayıp', value: '%20', sort_order: 3 },
            ],
            features: d.features && Array.isArray(d.features) && d.features.length > 0 ? d.features : [
              { id: `feat-1`, text: 'Hızlı Çekim', sort_order: 1 },
              { id: `feat-2`, text: '7/24 Destek', sort_order: 2 },
            ],
          })) as Sponsor[];
          setStored(STORAGE_KEYS.SPONSORS, mapped, true);
          return mapped;
        }
      } catch (err) {
        console.warn('Supabase getSponsors error, fallback to local', err);
      }
    }
    return getStored<Sponsor[]>(STORAGE_KEYS.SPONSORS, []).sort(
      (a, b) => a.sort_order - b.sort_order
    );
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

    if (sponsor.id) {
      // update
      const index = sponsors.findIndex((s) => s.id === sponsor.id);
      if (index !== -1) {
        saved = {
          ...sponsors[index],
          ...sponsor,
          updated_at: new Date().toISOString(),
        } as Sponsor;
        sponsors[index] = saved;
      } else {
        saved = { ...sponsor, id: sponsor.id || `sp-${Date.now()}` } as Sponsor;
        sponsors.push(saved);
      }
    } else {
      // create
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
        featured: Boolean(sponsor.featured),
        verified: sponsor.verified !== false,
        active: sponsor.active !== false,
        sort_order: sponsor.sort_order || sponsors.length + 1,
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

    setStored(STORAGE_KEYS.SPONSORS, sponsors);

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
          is_active: saved.active !== false,
          is_vip: Boolean(saved.featured),
          is_popular: Boolean((saved as any).is_popular),
          sort_order: saved.sort_order || 0,
          created_at: saved.created_at || new Date().toISOString(),
        });
      } catch (err) {
        console.warn('Supabase saveSponsor error:', err);
      }
    }

    await this.logAdminAction(
      sponsor.id ? 'Sponsor Güncellendi' : 'Yeni Sponsor Eklendi',
      'sponsor',
      saved.id,
      { name: saved.name, slug: saved.slug }
    );
    return saved;
  },

  async deleteSponsor(id: string): Promise<void> {
    const sponsors = await this.getSponsors();
    const target = sponsors.find((s) => s.id === id);
    const filtered = sponsors.filter((s) => s.id !== id);
    setStored(STORAGE_KEYS.SPONSORS, filtered);

    if (isSupabaseReady()) {
      try {
        await supabase.from('sponsors').delete().eq('id', id);
      } catch (err) {
        console.warn('Supabase deleteSponsor error:', err);
      }
    }

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

    // Add any missing
    sponsors.forEach((s) => {
      if (!orderedIds.includes(s.id)) {
        updated.push({ ...s, sort_order: updated.length + 1 });
      }
    });

    setStored(STORAGE_KEYS.SPONSORS, updated);

    if (isSupabaseReady()) {
      try {
        for (const sp of updated) {
          await supabase.from('sponsors').update({ sort_order: sp.sort_order }).eq('id', sp.id);
        }
      } catch (err) {
        console.warn('Supabase reorderSponsors error:', err);
      }
    }
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

    await this.logAdminAction(
      featured ? 'Sponsor Öne Çıkarıldı (VIP)' : 'Sponsor Öne Çıkarma Kaldırıldı',
      'sponsor',
      id,
      { name: sponsors[index].name, featured }
    );
    return sponsors[index];
  },

  // --- Hero Slides ---
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
        console.warn('Supabase getHeroSlides error, fallback to local', err);
      }
    }
    return getStored<HeroSlide[]>(STORAGE_KEYS.HERO_SLIDES, []).sort(
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

    await this.logAdminAction('Slide Silindi', 'slide', id);
  },

  // --- Banners ---
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
        if (!error && Array.isArray(data)) {
          const mapped = data.map((d: any) => ({
            ...d,
            id: d.id,
            name: d.title || d.name || 'Banner',
            image_url: d.image_url,
            target_url: d.target_url || '/',
            position: d.location === 'home_top' ? 'left' : (d.position || 'left'),
            active: d.is_active !== undefined ? Boolean(d.is_active) : (d.active !== false),
            sort_order: d.sort_order || 0,
            clicks_count: d.clicks || d.clicks_count || 0,
          })) as Banner[];
          setStored(STORAGE_KEYS.BANNERS, mapped, true);
          return mapped;
        }
      } catch (err) {
        console.warn('Supabase getBanners error, fallback to local', err);
      }
    }
    return getStored<Banner[]>(STORAGE_KEYS.BANNERS, []).sort(
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
          location: saved.position === 'left' ? 'home_top' : 'home_bottom',
          is_active: saved.active !== false,
          sort_order: saved.sort_order || 0,
          clicks: saved.clicks_count || 0,
          created_at: new Date().toISOString(),
        });
      } catch (err) {
        console.warn('Supabase saveBanner error:', err);
      }
    }

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

    await this.logAdminAction('Banner Silindi', 'banner', id);
  },

  // --- Social Links ---
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
        console.warn('Supabase getSocialLinks error, fallback to local', err);
      }
    }
    return getStored<SocialLink[]>(STORAGE_KEYS.SOCIAL_LINKS, []).sort(
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

    await this.logAdminAction('Sosyal Link Güncellendi', 'social_link', saved.id);
    return saved;
  },

  async setSocialLinks(newLinks: SocialLink[]): Promise<SocialLink[]> {
    setStored(STORAGE_KEYS.SOCIAL_LINKS, newLinks);
    if (isSupabaseReady()) {
      try {
        // Delete existing and insert fresh
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
  },

  // --- Wheel Rewards & Spins ---
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
        console.warn('Supabase getWheelRewards error, fallback to local', err);
      }
    }
    return getStored<WheelReward[]>(STORAGE_KEYS.WHEEL_REWARDS, []).sort(
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
  },

  async getWheelSpins(): Promise<WheelSpin[]> {
    if (isSupabaseReady()) {
      try {
        const { data, error } = await withTimeout(
          supabase
            .from('wheel_spins')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50),
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
        console.warn('Supabase getWheelSpins error, fallback to local', err);
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

    // Check if user already spun today
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

    // Save spin
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

    // Update user balance if coin
    if (selected.reward_type === 'coin' && selected.reward_value > 0) {
      await this.addCoins(userId, selected.reward_value);
    }

    return {
      success: true,
      reward: selected,
    };
  },

  // --- 7-Day Login Streak ---
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
          setStored(STORAGE_KEYS.USER_STREAKS, allStreaks);
        }
      } catch (err) {
        console.warn('Supabase getUserStreak error, fallback to local', err);
      }
    }

    const d = new Date();
    const todayKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    
    const y = new Date();
    y.setDate(y.getDate() - 1);
    const yesterdayKey = `${y.getFullYear()}-${String(y.getMonth() + 1).padStart(2, '0')}-${String(y.getDate()).padStart(2, '0')}`;

    const isClaimedToday = userStreak.last_claimed_date === todayKey;
    let currentStreak = userStreak.current_streak || 0;

    // If not claimed today and not claimed yesterday, streak broke back to 0 (next claim will be Day 1)
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

    // If streak was at 7 or reset to 0, start from 1. Otherwise increment.
    const nextStreak = (currentInfo.current_streak >= 7 || currentInfo.current_streak === 0) ? 1 : currentInfo.current_streak + 1;
    
    // Find reward for this day
    const reward = streakDays.find((r) => r.day === nextStreak) || streakDays[nextStreak - 1] || {
      day: nextStreak,
      reward_coins: 50 * nextStreak,
      label: `${50 * nextStreak} Coin`,
    };

    // Add coins
    const newBalance = await this.addCoins(userId, reward.reward_coins);

    // Save updated streak
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

    // Log admin / activity
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

  // --- Giveaways ---
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
          const allStoredEntries = getStored<GiveawayEntry[]>(STORAGE_KEYS.GIVEAWAY_ENTRIES, []);
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
        console.warn('Supabase getGiveaways error, fallback to local', err);
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

    // Save locally first
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
          const { error: baseErr } = await supabase.from('giveaways').upsert(basePayload);
          if (baseErr) {
            console.warn('Base giveaways upsert error:', baseErr);
          }
        }
      } catch (err) {
        console.warn('Supabase saveGiveaway error:', err);
      }
    }

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
  },

  // --- Giveaway Templates ---
  async getGiveawayTemplates(): Promise<GiveawayTemplate[]> {
    const local = getStored<GiveawayTemplate[]>(STORAGE_KEYS.GIVEAWAY_TEMPLATES, initialGiveawayTemplates);
    if (isSupabaseReady()) {
      try {
        const { data, error } = await withTimeout(
          supabase
            .from('giveaway_templates')
            .select('*')
            .order('created_at', { ascending: true }),
          3000
        );
        if (!error && Array.isArray(data) && data.length > 0) {
          setStored(STORAGE_KEYS.GIVEAWAY_TEMPLATES, data, true);
          return data as GiveawayTemplate[];
        }
      } catch (err) {
        console.warn('Supabase getGiveawayTemplates fallback to local:', err);
      }
    }
    return local;
  },

  async saveGiveawayTemplate(template: GiveawayTemplate): Promise<GiveawayTemplate> {
    const templates = getStored<GiveawayTemplate[]>(STORAGE_KEYS.GIVEAWAY_TEMPLATES, initialGiveawayTemplates);
    const targetId = template.id || `tpl-${Date.now()}`;
    const idx = templates.findIndex((t) => t.id === targetId);
    let saved: GiveawayTemplate;
    if (idx !== -1) {
      saved = { ...templates[idx], ...template, id: targetId };
      templates[idx] = saved;
    } else {
      saved = {
        ...template,
        id: targetId,
      };
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
    const templates = getStored<GiveawayTemplate[]>(STORAGE_KEYS.GIVEAWAY_TEMPLATES, initialGiveawayTemplates);
    const filtered = templates.filter((t) => t.id !== id);
    setStored(STORAGE_KEYS.GIVEAWAY_TEMPLATES, filtered);

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
        console.warn('Supabase getGiveawayEntries error, fallback to local', err);
      }
    }
    return getStored<GiveawayEntry[]>(STORAGE_KEYS.GIVEAWAY_ENTRIES, []);
  },

  async enterGiveaway(giveawayId: string, userId: string, username: string): Promise<{ success: boolean; message: string }> {
    const entries = getStored<GiveawayEntry[]>(STORAGE_KEYS.GIVEAWAY_ENTRIES, []);
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

    // Update count on giveaway in local storage immediately
    const giveaways = getStored<Giveaway[]>(STORAGE_KEYS.GIVEAWAYS, []);
    const target = giveaways.find((g) => g.id === giveawayId);
    if (target) {
      target.entries_count = entries.filter((e) => e.giveaway_id === giveawayId).length;
      setStored(STORAGE_KEYS.GIVEAWAYS, giveaways);
    }

    // Try server-side join endpoint for instant Supabase sync & cache invalidation
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
      }
    } catch {
      // Fallback direct Supabase insert
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
          console.warn('Supabase giveaway_entries fallback error:', err);
        }
      }
    }

    // Notify components of updated giveaways
    window.dispatchEvent(
      new CustomEvent('sponsorhub_db_change', {
        detail: { key: 'sponsorhub_giveaways_v1' },
      })
    );

    return { success: true, message: '🎉 Çekilişe başarıyla katıldınız! Bol şans.' };
  },

  // --- Store Products & Orders ---
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
        console.warn('Supabase getStoreProducts error, fallback to local', err);
      }
    }
    return getStored<StoreProduct[]>(STORAGE_KEYS.STORE_PRODUCTS, []).sort(
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
  },

  async getStoreOrders(): Promise<StoreOrder[]> {
    return getStored<StoreOrder[]>(STORAGE_KEYS.STORE_ORDERS, []);
  },

  async purchaseProduct(userId: string, username: string, productId: string, deliveryNote?: string): Promise<{ success: boolean; message: string }> {
    const profile = (await this.getProfiles()).find((p) => p.id === userId);
    if (!profile) return { success: false, message: 'Kullanıcı profili bulunamadı' };

    const products = await this.getStoreProducts();
    const product = products.find((p) => p.id === productId);
    if (!product || !product.active) return { success: false, message: 'Ürün bulunamadı veya satışta değil' };

    if (product.stock <= 0) return { success: false, message: 'Ürün tükendi' };
    if (profile.coin_balance < product.coin_price) {
      return {
        success: false,
        message: `Yetersiz bakiye! Gereken: ${product.coin_price} Coin, Mevcut: ${profile.coin_balance} Coin`,
      };
    }

    // Deduct coins
    await this.addCoins(userId, -product.coin_price);

    // Decrease stock
    product.stock -= 1;
    await this.saveStoreProduct(product);

    // Add order
    const orders = await this.getStoreOrders();
    orders.unshift({
      id: `ord-${Date.now()}`,
      user_id: userId,
      username,
      product_id: productId,
      product_name: product.name,
      coin_price: product.coin_price,
      status: 'completed',
      delivery_note: deliveryNote || 'Dijital kodunuz profilinize tanımlandı.',
      created_at: new Date().toISOString(),
    });
    setStored(STORAGE_KEYS.STORE_ORDERS, orders);

    return { success: true, message: `Tebrikler! ${product.name} siparişiniz oluşturuldu.` };
  },

  // --- Profiles & Auth ---
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
        console.warn('Supabase getProfiles error, fallback to local', err);
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

    // Also trigger server-side sync to guarantee consistency
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
      console.warn('Click tracking error (non-blocking):', err);
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

  // --- Admin Logs ---
  async getAdminLogs(): Promise<AdminLog[]> {
    return getStored<AdminLog[]>(STORAGE_KEYS.ADMIN_LOGS, []);
  },

  async logAdminAction(action: string, entity_type: string, entity_id?: string, details?: Record<string, unknown>, admin_username?: string): Promise<void> {
    const logs = await this.getAdminLogs();
    logs.unshift({
      id: `log-${Date.now()}`,
      admin_username: admin_username || 'Admin',
      action,
      entity_type,
      entity_id,
      details,
      created_at: new Date().toISOString(),
    });
    setStored(STORAGE_KEYS.ADMIN_LOGS, logs.slice(0, 200));
  },

  async clearAdminLogs(): Promise<void> {
    setStored(STORAGE_KEYS.ADMIN_LOGS, []);
    await this.logAdminAction('Tüm Sistem Logları Temizlendi', 'system');
  },

  // --- Connection Diagnostics ---
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
          3000
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
        message: 'Supabase URL ve Anon Key henüz yapılandırılmadı. Sistem yerel depolama modunda çalışıyor.',
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
