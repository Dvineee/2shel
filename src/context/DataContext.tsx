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

interface DataContextType {
  sponsors: Sponsor[];
  activeSponsors: Sponsor[];
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

  const loadData = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    try {
      setError(null);
      const preloaded = await db.preloadAll();
      if (preloaded) {
        setSponsors(preloaded.sponsors || []);
        setHeroSlides(preloaded.heroSlides || []);
        setBanners(preloaded.banners || []);
        setSocialLinks(preloaded.socialLinks || []);
        setWheelRewards(preloaded.wheelRewards || []);
        setGiveaways(preloaded.giveaways || []);
        setStoreProducts(preloaded.storeProducts || []);
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

    // Listen to changes across views with debounce
    let debounceTimer: any = null;
    const handler = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        loadData();
      }, 300);
    };
    window.addEventListener('sponsorhub_db_change', handler);
    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      window.removeEventListener('sponsorhub_db_change', handler);
    };
  }, [loadData]);

  const updateSettings = async (newSettings: Partial<SiteSettings>) => {
    const updated = await db.updateSettings(newSettings);
    setSettings(updated);
  };

  const activeSponsors = sponsors.filter((s) => s.active !== false);
  const featuredSponsors = activeSponsors.filter((s) => s.featured);
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
        sponsors,
        activeSponsors,
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
        refreshAll: loadData,
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
