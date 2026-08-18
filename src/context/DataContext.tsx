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
import { initialSiteSettings } from '../lib/initialData';
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
  storeProducts: StoreProduct[];
  settings: SiteSettings;
  loading: boolean;
  error: string | null;
  refreshAll: () => Promise<void>;
  updateSettings: (newSettings: Partial<SiteSettings>) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const cached = db.getCachedData();
  const [sponsors, setSponsors] = useState<Sponsor[]>(cached.sponsors || []);
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>(cached.heroSlides || []);
  const [banners, setBanners] = useState<Banner[]>(cached.banners || []);
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>(cached.socialLinks || []);
  const [wheelRewards, setWheelRewards] = useState<WheelReward[]>(cached.wheelRewards || []);
  const [giveaways, setGiveaways] = useState<Giveaway[]>(cached.giveaways || []);
  const [storeProducts, setStoreProducts] = useState<StoreProduct[]>(cached.storeProducts || []);
  const [settings, setSettings] = useState<SiteSettings>(cached.settings || initialSiteSettings);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const isFetchingRef = React.useRef(false);

  const loadData = useCallback(async (forceFresh = false) => {
    if (isFetchingRef.current && !forceFresh) return;
    isFetchingRef.current = true;
    try {
      setError(null);
      const preloaded = await db.preloadAll(forceFresh);
      if (preloaded) {
        if (preloaded.sponsors) setSponsors(preloaded.sponsors);
        if (preloaded.heroSlides) setHeroSlides(preloaded.heroSlides);
        if (preloaded.banners) setBanners(preloaded.banners);
        if (preloaded.socialLinks) setSocialLinks(preloaded.socialLinks);
        if (preloaded.wheelRewards) setWheelRewards(preloaded.wheelRewards);
        if (preloaded.giveaways) setGiveaways(preloaded.giveaways);
        if (preloaded.storeProducts) setStoreProducts(preloaded.storeProducts);
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
        setSponsors(s);
        setHeroSlides(h);
        setBanners(b);
        setSocialLinks(soc);
        setWheelRewards(w);
        setGiveaways(g);
        setStoreProducts(p);
        setSettings(set);
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
      if (currentCache.sponsors && currentCache.sponsors.length > 0) {
        setSponsors(sortSponsors(currentCache.sponsors));
      }
      if (currentCache.settings) {
        setSettings(currentCache.settings);
      }
      if (currentCache.banners && currentCache.banners.length > 0) {
        setBanners(currentCache.banners);
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

  const updateSettings = async (newSettings: Partial<SiteSettings>) => {
    const updated = await db.updateSettings(newSettings);
    setSettings(updated);
  };

  const sortedAllSponsors = sortSponsors(sponsors);
  const activeSponsors = sortSponsors(sortedAllSponsors.filter((s) => s.active !== false));
  const mainSponsors = activeSponsors.filter((s) => getSponsorCategory(s) === 'main');
  const vipSponsors = activeSponsors.filter((s) => getSponsorCategory(s) === 'vip');
  const trustedSponsors = activeSponsors.filter((s) => getSponsorCategory(s) === 'trusted');
  const featuredSponsors = activeSponsors.filter((s) => getSponsorCategory(s) === 'vip' || s.featured);
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
        giveaways: giveaways.filter((g) => g.active !== false || g.is_completed),
        storeProducts: storeProducts.filter((p) => p.active !== false),
        settings,
        loading,
        error,
        refreshAll: async () => {
          await loadData(true);
        },
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
