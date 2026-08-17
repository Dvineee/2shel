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
  const initialCache = React.useMemo(() => db.getCachedData(), []);
  const [sponsors, setSponsors] = useState<Sponsor[]>(initialCache.sponsors);
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>(initialCache.heroSlides);
  const [banners, setBanners] = useState<Banner[]>(initialCache.banners);
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>(initialCache.socialLinks);
  const [wheelRewards, setWheelRewards] = useState<WheelReward[]>(initialCache.wheelRewards);
  const [giveaways, setGiveaways] = useState<Giveaway[]>(initialCache.giveaways);
  const [storeProducts, setStoreProducts] = useState<StoreProduct[]>(initialCache.storeProducts);
  const [settings, setSettings] = useState<SiteSettings>(initialCache.settings);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const isFetchingRef = React.useRef(false);

  const loadData = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    try {
      setError(null);
      const preloaded = await db.preloadAll();
      if (preloaded) {
        setSponsors(preloaded.sponsors);
        setHeroSlides(preloaded.heroSlides);
        setBanners(preloaded.banners);
        setSocialLinks(preloaded.socialLinks);
        setWheelRewards(preloaded.wheelRewards);
        setGiveaways(preloaded.giveaways);
        setStoreProducts(preloaded.storeProducts);
        setSettings(preloaded.settings);
      } else {
        const cached = db.getCachedData();
        setSponsors(cached.sponsors);
        setHeroSlides(cached.heroSlides);
        setBanners(cached.banners);
        setSocialLinks(cached.socialLinks);
        setWheelRewards(cached.wheelRewards);
        setGiveaways(cached.giveaways);
        setStoreProducts(cached.storeProducts);
        setSettings(cached.settings);
      }
    } catch (err) {
      console.error('Failed to load portal data:', err);
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
      }, 500);
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

  const activeSponsors = sponsors.filter((s) => s.active);
  const featuredSponsors = activeSponsors.filter((s) => s.featured);
  const activeBanners = banners.filter((b) => b.active);
  const leftBanners = activeBanners.filter((b) => b.position === 'left' || activeBanners.length === 1);
  const rightBanners = activeBanners.filter((b) => b.position === 'right' && activeBanners.length > 1);

  return (
    <DataContext.Provider
      value={{
        sponsors,
        activeSponsors,
        featuredSponsors,
        heroSlides: heroSlides.filter((s) => s.active),
        banners,
        leftBanners,
        rightBanners,
        socialLinks: socialLinks.filter((s) => s.active),
        wheelRewards,
        giveaways: giveaways.filter((g) => g.active !== false || g.is_completed),
        storeProducts: storeProducts.filter((p) => p.active),
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
