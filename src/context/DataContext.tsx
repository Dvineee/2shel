import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Sponsor,
  HeroSlide,
  Banner,
  SocialLink,
  WheelReward,
  Giveaway,
  StoreProduct,
  SiteSettings,
} from '../types';
import { db } from '../lib/db';
import {
  initialSiteSettings,
  initialSponsors,
  initialHeroSlides,
  initialBanners,
  initialSocialLinks,
  initialWheelRewards,
  initialGiveaways,
  initialStoreProducts,
} from '../lib/initialData';
import { sortSponsors, getSponsorCategory } from '../lib/sponsorUtils';

import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface DataContextType {
  sponsors: Sponsor[];
  activeSponsors: Sponsor[];
  mainSponsors: Sponsor[];
  vipSponsors: Sponsor[];
  trustedSponsors: Sponsor[];
  featuredSponsors: Sponsor[];
  heroSlides: HeroSlide[];
  banners: Banner[];
  topBanners: Banner[];
  bottomBanners: Banner[];
  leftBanners: Banner[];
  rightBanners: Banner[];
  socialLinks: SocialLink[];
  wheelRewards: WheelReward[];
  giveaways: Giveaway[];
  activeGiveaways: Giveaway[];
  storeProducts: StoreProduct[];
  settings: SiteSettings;
  loading: boolean;
  error: string | null;
  refreshAll: () => Promise<void>;
  refreshSponsorsOnly: () => Promise<void>;
  updateSponsorsDirectly: (newSponsors: Sponsor[]) => void;
  updateSettings: (newSettings: Partial<SiteSettings>) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const cached = db.getCachedData();
  const [sponsors, setSponsors] = useState<Sponsor[]>(() =>
    cached.sponsors && cached.sponsors.length > 0 ? cached.sponsors : initialSponsors
  );
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>(() =>
    cached.heroSlides && cached.heroSlides.length > 0 ? cached.heroSlides : initialHeroSlides
  );
  const [banners, setBanners] = useState<Banner[]>(() =>
    cached.banners && cached.banners.length > 0 ? cached.banners : initialBanners
  );
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>(() =>
    cached.socialLinks && cached.socialLinks.length > 0 ? cached.socialLinks : initialSocialLinks
  );
  const [wheelRewards, setWheelRewards] = useState<WheelReward[]>(() =>
    cached.wheelRewards && cached.wheelRewards.length > 0 ? cached.wheelRewards : initialWheelRewards
  );
  const [giveaways, setGiveaways] = useState<Giveaway[]>(() =>
    cached.giveaways && cached.giveaways.length > 0 ? cached.giveaways : initialGiveaways
  );
  const [storeProducts, setStoreProducts] = useState<StoreProduct[]>(() =>
    cached.storeProducts && cached.storeProducts.length > 0 ? cached.storeProducts : initialStoreProducts
  );
  const [settings, setSettings] = useState<SiteSettings>(() => cached.settings || initialSiteSettings);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const isFetchingRef = React.useRef(false);

  const loadData = useCallback(async (forceFresh = false) => {
    if (isFetchingRef.current && !forceFresh) return;
    isFetchingRef.current = true;
    try {
      setError(null);
      const preloaded = await db.preloadAll(forceFresh);
      if (preloaded) {
        if (preloaded.sponsors && preloaded.sponsors.length > 0) {
          setSponsors(preloaded.sponsors);
        }
        if (preloaded.heroSlides && preloaded.heroSlides.length > 0) {
          setHeroSlides(preloaded.heroSlides);
        }
        if (preloaded.banners && preloaded.banners.length > 0) {
          setBanners(preloaded.banners);
        }
        if (preloaded.socialLinks && preloaded.socialLinks.length > 0) {
          setSocialLinks(preloaded.socialLinks);
        }
        if (preloaded.wheelRewards && preloaded.wheelRewards.length > 0) {
          setWheelRewards(preloaded.wheelRewards);
        }
        if (preloaded.giveaways !== undefined) {
          setGiveaways(preloaded.giveaways);
        }
        if (preloaded.storeProducts !== undefined) {
          setStoreProducts(preloaded.storeProducts);
        }
        if (preloaded.settings) {
          setSettings(preloaded.settings);
        }
      } else {
        const [s, h, b, soc, w, g, p, set] = await Promise.all([
          db.getSponsors(),
          db.getHeroSlides(),
          db.getBanners(),
          db.getSocialLinks(),
          db.getWheelRewards(),
          db.getGiveaways(),
          db.getStoreProducts(),
          db.getSettings(),
        ]);
        if (s && s.length > 0) setSponsors(s);
        if (h && h.length > 0) setHeroSlides(h);
        if (b && b.length > 0) setBanners(b);
        if (soc && soc.length > 0) setSocialLinks(soc);
        if (w && w.length > 0) setWheelRewards(w);
        if (g !== undefined) setGiveaways(g);
        if (p !== undefined) setStoreProducts(p);
        if (set) setSettings(set);
      }
    } catch (err) {
      console.error('Failed to load portal data from Supabase:', err);
    } finally {
      isFetchingRef.current = false;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();

    // 1. Listen to changes across admin views - immediately apply local cache for 0ms lag
    let debounceTimer: any = null;
    const handler = () => {
      // Immediate local state synchronization from storage
      const currentCache = db.getCachedData();
      if (currentCache.sponsors) {
        setSponsors(sortSponsors(currentCache.sponsors));
      }
      if (currentCache.settings) {
        setSettings(currentCache.settings);
      }
      if (currentCache.banners) {
        setBanners(currentCache.banners);
      }
      if (currentCache.giveaways !== undefined) {
        setGiveaways(currentCache.giveaways);
      }
      if (currentCache.storeProducts !== undefined) {
        setStoreProducts(currentCache.storeProducts);
      }
      if (currentCache.socialLinks !== undefined) {
        setSocialLinks(currentCache.socialLinks);
      }
      if (currentCache.wheelRewards !== undefined) {
        setWheelRewards(currentCache.wheelRewards);
      }
      if (currentCache.heroSlides !== undefined) {
        setHeroSlides(currentCache.heroSlides);
      }

      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        loadData(true);
      }, 200);
    };
    window.addEventListener('sponsorhub_db_change', handler);

    // 2. Tab focus & visibility sync (sync immediately when returning to tab)
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadData();
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('focus', handler);

    // 3. Periodic Background Sync (every 12 seconds to keep all users in sync)
    const syncInterval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        loadData();
      }
    }, 12000);

    // 4. Supabase Realtime Postgres Changes Subscription
    let realtimeChannel: any = null;
    try {
      if (isSupabaseConfigured && supabase?.channel) {
        realtimeChannel = supabase
          .channel('public:portal_realtime_sync')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public' },
            () => {
              handler();
            }
          )
          .subscribe();
      }
    } catch (err) {
      console.warn('Realtime subscription not available, using periodic sync:', err);
    }

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      window.removeEventListener('sponsorhub_db_change', handler);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('focus', handler);
      clearInterval(syncInterval);
      if (realtimeChannel && supabase?.removeChannel) {
        supabase.removeChannel(realtimeChannel);
      }
    };
  }, [loadData]);

  // 5. Dynamically synchronize Browser Favicon & Title from site settings
  useEffect(() => {
    const iconUrl = settings.favicon_url || settings.logo_url;
    if (iconUrl) {
      let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = iconUrl;

      let appleLink = document.querySelector("link[rel='apple-touch-icon']") as HTMLLinkElement;
      if (!appleLink) {
        appleLink = document.createElement('link');
        appleLink.rel = 'apple-touch-icon';
        document.head.appendChild(appleLink);
      }
      appleLink.href = iconUrl;
    }

    if (settings.site_title) {
      document.title = settings.site_title;
    }
  }, [settings.favicon_url, settings.logo_url, settings.site_title]);

  const updateSponsorsDirectly = useCallback((newSponsors: Sponsor[]) => {
    setSponsors(sortSponsors(newSponsors));
  }, []);

  const refreshSponsorsOnly = useCallback(async () => {
    try {
      const fresh = await db.getSponsors();
      setSponsors(sortSponsors(fresh));
    } catch (e) {
      console.warn('refreshSponsorsOnly warning:', e);
    }
  }, []);

  const updateSettings = async (newSettings: Partial<SiteSettings>) => {
    const updated = await db.updateSettings(newSettings);
    setSettings(updated);
  };

  const sortedAllSponsors = sortSponsors(sponsors);
  const isItemActive = (item: any) => {
    if (!item) return false;
    if (item.is_active === false || item.is_active === 'false' || item.is_active === 0) return false;
    if (item.active === false || item.active === 'false' || item.active === 0) return false;
    return true;
  };
  const activeSponsors = sortSponsors(sortedAllSponsors.filter(isItemActive));
  const mainSponsors = activeSponsors.filter((s) => getSponsorCategory(s) === 'main');
  const vipSponsors = activeSponsors.filter((s) => getSponsorCategory(s) === 'vip');
  const trustedSponsors = activeSponsors.filter((s) => getSponsorCategory(s) === 'trusted');
  const featuredSponsors = activeSponsors.filter((s) => getSponsorCategory(s) === 'vip' || s.featured || s.is_vip);
  const activeBanners = banners.filter((b) => b.active !== false);

  const topBanners = activeBanners.filter(
    (b) => b.position === 'home_top' || b.position === 'top'
  );
  const bottomBanners = activeBanners.filter(
    (b) => b.position === 'home_bottom' || b.position === 'bottom'
  );
  const leftBanners = activeBanners.filter((b) => b.position === 'left');
  const rightBanners = activeBanners.filter((b) => b.position === 'right');

  return (
    <DataContext.Provider
      value={{
        sponsors: sortedAllSponsors,
        activeSponsors,
        mainSponsors,
        vipSponsors,
        trustedSponsors,
        featuredSponsors,
        heroSlides: heroSlides.filter((s) => s.active !== false),
        banners,
        topBanners,
        bottomBanners,
        leftBanners,
        rightBanners,
        socialLinks: socialLinks.filter((s) => s.active !== false),
        wheelRewards,
        giveaways,
        activeGiveaways: giveaways.filter((g) => g.active !== false || g.is_completed),
        storeProducts: storeProducts.filter((p) => p.active !== false),
        settings,
        loading,
        error,
        refreshAll: async () => {
          await loadData(true);
        },
        refreshSponsorsOnly,
        updateSponsorsDirectly,
        updateSettings,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within a DataProvider');
  return context;
};
