import { createClient, SupabaseClient } from '@supabase/supabase-js';

const metaEnv = (import.meta as unknown as { env: Record<string, string | undefined> }).env || {};

const DEFAULT_URL = 'https://pkxcsjxqxzzfsoamyegk.supabase.co';
const DEFAULT_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBreGNzanhxeHp6ZnNvYW15ZWdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY5ODc0MzIsImV4cCI6MjEwMjU2MzQzMn0.1F4NEkWKVRIWlCN882mdUemOMr5Gm0WK7xWcMknIrC0';

export function getStoredSupabaseConfig() {
  const envUrl = metaEnv.VITE_SUPABASE_URL || DEFAULT_URL;
  const envKey = metaEnv.VITE_SUPABASE_ANON_KEY || DEFAULT_ANON_KEY;

  const customUrl = typeof localStorage !== 'undefined' ? localStorage.getItem('supabase_custom_url') || '' : '';
  const customKey = typeof localStorage !== 'undefined' ? localStorage.getItem('supabase_custom_anon_key') || '' : '';

  const activeUrl = (customUrl.trim() || envUrl.trim()).trim();
  const activeKey = (customKey.trim() || envKey.trim()).trim();

  const isConfigured = Boolean(
    activeUrl &&
    activeKey &&
    activeUrl !== 'https://your-project.supabase.co' &&
    !activeUrl.includes('placeholder') &&
    activeKey !== 'your-anon-key'
  );

  return {
    url: activeUrl,
    anonKey: activeKey,
    isConfigured,
    isCustom: Boolean(customUrl.trim()),
  };
}

let currentClient: SupabaseClient = (() => {
  const config = getStoredSupabaseConfig();
  if (config.isConfigured) {
    try {
      return createClient(config.url, config.anonKey);
    } catch {
      return createClient('https://example.supabase.co', 'dummy-anon-key');
    }
  }
  return createClient('https://example.supabase.co', 'dummy-anon-key');
})();

export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (currentClient as any)[prop];
  },
});

export function saveSupabaseCredentials(url: string, anonKey: string) {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('supabase_custom_url', url.trim());
    localStorage.setItem('supabase_custom_anon_key', anonKey.trim());
    const config = getStoredSupabaseConfig();
    if (config.isConfigured) {
      currentClient = createClient(config.url, config.anonKey);
    }
  }
}

export function clearSupabaseCredentials() {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem('supabase_custom_url');
    localStorage.removeItem('supabase_custom_anon_key');
    const config = getStoredSupabaseConfig();
    if (config.isConfigured) {
      currentClient = createClient(config.url, config.anonKey);
    } else {
      currentClient = createClient('https://example.supabase.co', 'dummy-anon-key');
    }
  }
}

export const isSupabaseConfigured = getStoredSupabaseConfig().isConfigured;

export const SUPABASE_SQL_SCHEMA = `-- ==========================================
-- SHELBYONLINE / SPONSORHUB SUPABASE SQL SCHEMA
-- Bu kodu Supabase Dashboard > SQL Editor alanına yapıştırıp "RUN" butonuna basınız.
-- ==========================================

-- 1. Site Ayarları
CREATE TABLE IF NOT EXISTS public.site_settings (
  setting_key TEXT PRIMARY KEY,
  setting_value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Sponsorlar
CREATE TABLE IF NOT EXISTS public.sponsors (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  logo_url TEXT,
  banner_url TEXT,
  bonus_text TEXT,
  rating NUMERIC DEFAULT 5.0,
  review_count INT DEFAULT 0,
  direct_url TEXT,
  short_desc TEXT,
  full_review TEXT,
  features JSONB DEFAULT '[]'::jsonb,
  tags JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT TRUE,
  is_vip BOOLEAN DEFAULT FALSE,
  is_popular BOOLEAN DEFAULT FALSE,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Sponsor İstatistikleri
CREATE TABLE IF NOT EXISTS public.sponsor_stats (
  sponsor_id TEXT PRIMARY KEY REFERENCES public.sponsors(id) ON DELETE CASCADE,
  clicks INT DEFAULT 0,
  direct_clicks INT DEFAULT 0,
  conversions INT DEFAULT 0,
  last_clicked_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Banner Reklamlar
CREATE TABLE IF NOT EXISTS public.banners (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  image_url TEXT NOT NULL,
  target_url TEXT NOT NULL,
  location TEXT DEFAULT 'home_top',
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INT DEFAULT 0,
  clicks INT DEFAULT 0,
  impressions INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Hero Slaytları
CREATE TABLE IF NOT EXISTS public.hero_slides (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  badge_text TEXT,
  badge_color TEXT,
  button_text TEXT,
  button_url TEXT,
  background_image TEXT,
  sponsor_id TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Sosyal Medya Linkleri
CREATE TABLE IF NOT EXISTS public.social_links (
  id TEXT PRIMARY KEY,
  platform TEXT NOT NULL,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  icon TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Çark Ödülleri
CREATE TABLE IF NOT EXISTS public.wheel_rewards (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  reward_type TEXT DEFAULT 'coin',
  reward_value TEXT DEFAULT '100',
  probability NUMERIC DEFAULT 10,
  icon TEXT DEFAULT 'Gift',
  color TEXT DEFAULT '#f59e0b',
  bg_color TEXT DEFAULT 'rgba(245,158,11,0.2)',
  is_active BOOLEAN DEFAULT TRUE,
  is_jackpot BOOLEAN DEFAULT FALSE,
  coin_reward INT DEFAULT 100,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Çark Çevirme Geçmişi
CREATE TABLE IF NOT EXISTS public.wheel_spins (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  reward_id TEXT NOT NULL,
  reward_name TEXT NOT NULL,
  reward_type TEXT,
  reward_value TEXT,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Çekilişler
CREATE TABLE IF NOT EXISTS public.giveaways (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  sponsor_id TEXT,
  prize TEXT NOT NULL,
  total_winners INT DEFAULT 1,
  entry_fee_coins INT DEFAULT 0,
  min_level INT DEFAULT 1,
  end_date TIMESTAMPTZ NOT NULL,
  winners JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  is_completed BOOLEAN DEFAULT FALSE,
  winner_username TEXT,
  winner_id TEXT,
  winner_announced_at TIMESTAMPTZ,
  winner_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Çekiliş tablosuna eksik sütunları güvenle ekleme (Varsa hata vermez)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='giveaways' AND column_name='is_completed') THEN
    ALTER TABLE public.giveaways ADD COLUMN is_completed BOOLEAN DEFAULT FALSE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='giveaways' AND column_name='winner_username') THEN
    ALTER TABLE public.giveaways ADD COLUMN winner_username TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='giveaways' AND column_name='winner_id') THEN
    ALTER TABLE public.giveaways ADD COLUMN winner_id TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='giveaways' AND column_name='winner_announced_at') THEN
    ALTER TABLE public.giveaways ADD COLUMN winner_announced_at TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='giveaways' AND column_name='winner_note') THEN
    ALTER TABLE public.giveaways ADD COLUMN winner_note TEXT;
  END IF;
END $$;

-- 10. Çekiliş Katılımları
CREATE TABLE IF NOT EXISTS public.giveaway_entries (
  id TEXT PRIMARY KEY,
  giveaway_id TEXT NOT NULL REFERENCES public.giveaways(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  username TEXT NOT NULL,
  telegram_username TEXT,
  coins_spent INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10.1 Çekiliş Hızlı Şablonları
CREATE TABLE IF NOT EXISTS public.giveaway_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  prize_details TEXT NOT NULL,
  image_url TEXT,
  description TEXT,
  duration_days INT DEFAULT 7,
  badge_color TEXT DEFAULT 'violet',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Mağaza Ürünleri
CREATE TABLE IF NOT EXISTS public.store_products (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  price_coins INT NOT NULL DEFAULT 100,
  stock INT DEFAULT 100,
  category TEXT DEFAULT 'bonus',
  is_active BOOLEAN DEFAULT TRUE,
  is_popular BOOLEAN DEFAULT FALSE,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Mağaza Siparişleri
CREATE TABLE IF NOT EXISTS public.store_orders (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  product_title TEXT NOT NULL,
  price_coins INT NOT NULL,
  status TEXT DEFAULT 'pending',
  delivery_info TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Kullanıcı Profilleri
CREATE TABLE IF NOT EXISTS public.profiles (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL,
  telegram_username TEXT,
  telegram_id TEXT,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  coins INT DEFAULT 100,
  level INT DEFAULT 1,
  xp INT DEFAULT 0,
  role TEXT DEFAULT 'user',
  daily_spin_available BOOLEAN DEFAULT TRUE,
  last_spin_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. Admin Denetim Logları
CREATE TABLE IF NOT EXISTS public.admin_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  username TEXT,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. Telegram Giriş Güvenlik Kodları (5 Dakikalık Tek Kullanımlık Kodlar)
CREATE TABLE IF NOT EXISTS public.telegram_auth_codes (
  code TEXT PRIMARY KEY,
  telegram_id TEXT NOT NULL,
  telegram_username TEXT,
  telegram_first_name TEXT,
  telegram_last_name TEXT,
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  is_used BOOLEAN DEFAULT FALSE
);

-- 16. 7 Günlük Giriş Serisi & Kullanıcı Seri Takibi
CREATE TABLE IF NOT EXISTS public.user_streaks (
  user_id TEXT PRIMARY KEY,
  current_streak INT DEFAULT 0,
  last_claimed_date TEXT,
  streak_history JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS (Row Level Security) Açma & Anonim Okuma/Yazma İzinleri (Public App)
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsor_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hero_slides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wheel_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wheel_spins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.giveaways ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.giveaway_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.giveaway_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telegram_auth_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;

-- Anonim/Public Erişim Politikaları
DO $$ 
DECLARE 
  tbl TEXT;
BEGIN
  FOR tbl IN SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Public Full Access" ON public.%I', tbl);
    EXECUTE format('CREATE POLICY "Public Full Access" ON public.%I FOR ALL USING (true) WITH CHECK (true)', tbl);
  END LOOP;
END $$;
`;
