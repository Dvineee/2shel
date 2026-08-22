import { createClient, SupabaseClient } from '@supabase/supabase-js';

const metaEnv = (import.meta as unknown as { env: Record<string, string | undefined> }).env || {};

const DEFAULT_URL = 'https://pkxcsjxqxzzfsoamyegk.supabase.co';
const DEFAULT_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBreGNzanhxeHp6ZnNvYW15ZWdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY5ODc0MzIsImV4cCI6MjEwMjU2MzQzMn0.1F4NEkWKVRIWlCN882mdUemOMr5Gm0WK7xWcMknIrC0';

export function getStoredSupabaseConfig() {
  const envUrl = (metaEnv.VITE_SUPABASE_URL || '').trim();
  const envKey = (metaEnv.VITE_SUPABASE_ANON_KEY || '').trim();

  const customUrl = typeof localStorage !== 'undefined' ? (localStorage.getItem('supabase_custom_url') || '').trim() : '';
  const customKey = typeof localStorage !== 'undefined' ? (localStorage.getItem('supabase_custom_anon_key') || '').trim() : '';

  let activeUrl = customUrl || envUrl || DEFAULT_URL;
  let activeKey = customKey || envKey || DEFAULT_ANON_KEY;

  if (
    !activeUrl ||
    activeUrl.includes('your-project') ||
    activeUrl.includes('placeholder') ||
    activeUrl.includes('example.supabase.co') ||
    !activeUrl.startsWith('http')
  ) {
    activeUrl = DEFAULT_URL;
  }

  if (
    !activeKey ||
    activeKey.includes('your-anon-key') ||
    activeKey.includes('dummy') ||
    activeKey.length < 20
  ) {
    activeKey = DEFAULT_ANON_KEY;
  }

  return {
    url: activeUrl,
    anonKey: activeKey,
    isConfigured: true,
    isCustom: Boolean(customUrl && customUrl !== DEFAULT_URL),
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

export const SUPABASE_RECREATE_SPONSORS_SQL = `-- =======================================================
-- SPONSOR TABLOSUNU SIFIRDAN TEMİZ KURMA SQL KODU
-- (Supabase Dashboard > SQL Editor alanına yapıştırıp RUN'a basınız)
-- =======================================================

-- 1. Varsa eski sponsors tablosunu güvenle kaldır
DROP TABLE IF EXISTS public.sponsors CASCADE;

-- 2. Sponsors tablosunu tüm modern kolonlarıyla ve otomatik ID ile oluştur
CREATE TABLE public.sponsors (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  banner_url TEXT,
  bonus_text TEXT,
  rating NUMERIC DEFAULT 5.0,
  review_count INT DEFAULT 0,
  website_url TEXT,
  direct_url TEXT,
  button_text TEXT DEFAULT 'SİTEYE GİT & KAZAN',
  short_description TEXT,
  short_desc TEXT,
  description TEXT,
  full_review TEXT,
  category TEXT DEFAULT 'main',
  featured BOOLEAN DEFAULT FALSE,
  is_vip BOOLEAN DEFAULT FALSE,
  is_popular BOOLEAN DEFAULT FALSE,
  verified BOOLEAN DEFAULT TRUE,
  active BOOLEAN DEFAULT TRUE,
  is_active BOOLEAN DEFAULT TRUE,
  has_detail_page BOOLEAN DEFAULT TRUE,
  sort_order INT DEFAULT 0,
  bonus_code TEXT,
  bonus_headline TEXT,
  badge_text TEXT,
  min_deposit TEXT DEFAULT '50 ₺',
  withdrawal_speed TEXT DEFAULT '3 - 15 Dakika',
  license TEXT DEFAULT 'Curacao eGaming',
  rtp_rate TEXT DEFAULT '%97.8',
  online_players TEXT DEFAULT '1420',
  live_support TEXT DEFAULT '7/24 Türkçe Canlı Destek',
  payment_methods JSONB DEFAULT '["Papara", "Havale / EFT", "Kripto (USDT)", "Payfix", "Kredi Kartı", "Mefete"]'::jsonb,
  stats JSONB DEFAULT '[{"id": "stat-1", "label": "İlk Yatırım", "value": "%100", "sort_order": 1}, {"id": "stat-2", "label": "Deneme Bonusu", "value": "250 TL", "sort_order": 2}, {"id": "stat-3", "label": "Kayıp Bonusu", "value": "%20", "sort_order": 3}]'::jsonb,
  features JSONB DEFAULT '[{"id": "feat-1", "text": "Anında Çekim İmkanı", "sort_order": 1}, {"id": "feat-2", "text": "7/24 Türkçe Canlı Destek", "sort_order": 2}, {"id": "feat-3", "text": "Lisanslı & Güvenilir Altyapı", "sort_order": 3}]'::jsonb,
  pros JSONB DEFAULT '["Anında Para Çekme Garantisi", "Yüksek Bahis Oranları & Zengin Slotlar", "7/24 Kesintisiz Canlı Destek"]'::jsonb,
  cons JSONB DEFAULT '["Hafta sonu yoğunluğunda canlı destek birkaç dakika gecikebilir"]'::jsonb,
  faq JSONB DEFAULT '[]'::jsonb,
  clicks_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. RLS (Row Level Security) Açma ve Anonim Okuma/Yazma İzni Verme
ALTER TABLE public.sponsors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Full Access Sponsors" ON public.sponsors;
CREATE POLICY "Public Full Access Sponsors" ON public.sponsors FOR ALL USING (true) WITH CHECK (true);
`;

export const SUPABASE_RECREATE_GIVEAWAYS_SQL = `-- =======================================================
-- ÇEKİLİŞLER VE KATILIMLAR TABLOSUNU SIFIRDAN TEMİZ KURMA SQL KODU
-- (Supabase Dashboard > SQL Editor alanına yapıştırıp RUN'a basınız)
-- =======================================================

-- 1. Varsa eski tabloları güvenle kaldır
DROP TABLE IF EXISTS public.giveaway_entries CASCADE;
DROP TABLE IF EXISTS public.giveaways CASCADE;
DROP TABLE IF EXISTS public.giveaway_templates CASCADE;

-- 2. Giveaways Tablosu
CREATE TABLE public.giveaways (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  sponsor_id TEXT,
  prize TEXT NOT NULL,
  prize_details TEXT,
  total_winners INT DEFAULT 1,
  winner_count INT DEFAULT 1,
  entry_fee_coins INT DEFAULT 0,
  min_level INT DEFAULT 1,
  end_date TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ,
  start_at TIMESTAMPTZ DEFAULT NOW(),
  winners JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT TRUE,
  active BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  is_completed BOOLEAN DEFAULT FALSE,
  winner_username TEXT,
  winner_id TEXT,
  winner_announced_at TIMESTAMPTZ,
  winner_note TEXT,
  entries_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Giveaway Entries Tablosu (Katılımlar)
CREATE TABLE public.giveaway_entries (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  giveaway_id TEXT NOT NULL REFERENCES public.giveaways(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  username TEXT NOT NULL,
  telegram_username TEXT,
  coins_spent INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Giveaway Templates Tablosu (Şablonlar)
CREATE TABLE public.giveaway_templates (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  prize_details TEXT NOT NULL,
  image_url TEXT,
  description TEXT,
  duration_days INT DEFAULT 7,
  badge_color TEXT DEFAULT 'violet',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. RLS Açma & Anonim / Herkese Açık İzinler
ALTER TABLE public.giveaways ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.giveaway_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.giveaway_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Full Access Giveaways" ON public.giveaways;
CREATE POLICY "Public Full Access Giveaways" ON public.giveaways FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public Full Access Giveaway Entries" ON public.giveaway_entries;
CREATE POLICY "Public Full Access Giveaway Entries" ON public.giveaway_entries FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public Full Access Giveaway Templates" ON public.giveaway_templates;
CREATE POLICY "Public Full Access Giveaway Templates" ON public.giveaway_templates FOR ALL USING (true) WITH CHECK (true);
`;

export const SUPABASE_SQL_SCHEMA = `-- ==========================================
-- SHELBYONLINE / SPONSORHUB SUPABASE FULL SQL SCHEMA
-- Bu kodu Supabase Dashboard > SQL Editor alanına yapıştırıp "RUN" butonuna basınız.
-- ==========================================

-- 1. Site Ayarları
CREATE TABLE IF NOT EXISTS public.site_settings (
  setting_key TEXT PRIMARY KEY,
  setting_value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Sponsorlar Tablosu (Tam Kapsamlı Şema)
CREATE TABLE IF NOT EXISTS public.sponsors (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  banner_url TEXT,
  bonus_text TEXT,
  rating NUMERIC DEFAULT 5.0,
  review_count INT DEFAULT 0,
  website_url TEXT,
  direct_url TEXT,
  button_text TEXT DEFAULT 'SİTEYE GİT & KAZAN',
  short_description TEXT,
  short_desc TEXT,
  description TEXT,
  full_review TEXT,
  category TEXT DEFAULT 'main',
  featured BOOLEAN DEFAULT FALSE,
  is_vip BOOLEAN DEFAULT FALSE,
  is_popular BOOLEAN DEFAULT FALSE,
  verified BOOLEAN DEFAULT TRUE,
  active BOOLEAN DEFAULT TRUE,
  is_active BOOLEAN DEFAULT TRUE,
  has_detail_page BOOLEAN DEFAULT TRUE,
  sort_order INT DEFAULT 0,
  bonus_code TEXT,
  bonus_headline TEXT,
  badge_text TEXT,
  min_deposit TEXT,
  withdrawal_speed TEXT,
  license TEXT,
  rtp_rate TEXT,
  online_players TEXT,
  live_support TEXT,
  payment_methods JSONB DEFAULT '[]'::jsonb,
  stats JSONB DEFAULT '[]'::jsonb,
  features JSONB DEFAULT '[]'::jsonb,
  pros JSONB DEFAULT '[]'::jsonb,
  cons JSONB DEFAULT '[]'::jsonb,
  faq JSONB DEFAULT '[]'::jsonb,
  clicks_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sponsorlar tablosuna eksik tüm sütunları güvenle ekleme (Hata vermez)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sponsors' AND column_name='website_url') THEN
    ALTER TABLE public.sponsors ADD COLUMN website_url TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sponsors' AND column_name='button_text') THEN
    ALTER TABLE public.sponsors ADD COLUMN button_text TEXT DEFAULT 'SİTEYE GİT & KAZAN';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sponsors' AND column_name='short_description') THEN
    ALTER TABLE public.sponsors ADD COLUMN short_description TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sponsors' AND column_name='description') THEN
    ALTER TABLE public.sponsors ADD COLUMN description TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sponsors' AND column_name='category') THEN
    ALTER TABLE public.sponsors ADD COLUMN category TEXT DEFAULT 'main';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sponsors' AND column_name='featured') THEN
    ALTER TABLE public.sponsors ADD COLUMN featured BOOLEAN DEFAULT FALSE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sponsors' AND column_name='verified') THEN
    ALTER TABLE public.sponsors ADD COLUMN verified BOOLEAN DEFAULT TRUE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sponsors' AND column_name='active') THEN
    ALTER TABLE public.sponsors ADD COLUMN active BOOLEAN DEFAULT TRUE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sponsors' AND column_name='is_active') THEN
    ALTER TABLE public.sponsors ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sponsors' AND column_name='is_vip') THEN
    ALTER TABLE public.sponsors ADD COLUMN is_vip BOOLEAN DEFAULT FALSE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sponsors' AND column_name='has_detail_page') THEN
    ALTER TABLE public.sponsors ADD COLUMN has_detail_page BOOLEAN DEFAULT TRUE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sponsors' AND column_name='bonus_code') THEN
    ALTER TABLE public.sponsors ADD COLUMN bonus_code TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sponsors' AND column_name='bonus_headline') THEN
    ALTER TABLE public.sponsors ADD COLUMN bonus_headline TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sponsors' AND column_name='badge_text') THEN
    ALTER TABLE public.sponsors ADD COLUMN badge_text TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sponsors' AND column_name='min_deposit') THEN
    ALTER TABLE public.sponsors ADD COLUMN min_deposit TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sponsors' AND column_name='withdrawal_speed') THEN
    ALTER TABLE public.sponsors ADD COLUMN withdrawal_speed TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sponsors' AND column_name='license') THEN
    ALTER TABLE public.sponsors ADD COLUMN license TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sponsors' AND column_name='rtp_rate') THEN
    ALTER TABLE public.sponsors ADD COLUMN rtp_rate TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sponsors' AND column_name='online_players') THEN
    ALTER TABLE public.sponsors ADD COLUMN online_players TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sponsors' AND column_name='live_support') THEN
    ALTER TABLE public.sponsors ADD COLUMN live_support TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sponsors' AND column_name='payment_methods') THEN
    ALTER TABLE public.sponsors ADD COLUMN payment_methods JSONB DEFAULT '[]'::jsonb;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sponsors' AND column_name='stats') THEN
    ALTER TABLE public.sponsors ADD COLUMN stats JSONB DEFAULT '[]'::jsonb;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sponsors' AND column_name='features') THEN
    ALTER TABLE public.sponsors ADD COLUMN features JSONB DEFAULT '[]'::jsonb;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sponsors' AND column_name='pros') THEN
    ALTER TABLE public.sponsors ADD COLUMN pros JSONB DEFAULT '[]'::jsonb;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sponsors' AND column_name='cons') THEN
    ALTER TABLE public.sponsors ADD COLUMN cons JSONB DEFAULT '[]'::jsonb;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sponsors' AND column_name='faq') THEN
    ALTER TABLE public.sponsors ADD COLUMN faq JSONB DEFAULT '[]'::jsonb;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sponsors' AND column_name='clicks_count') THEN
    ALTER TABLE public.sponsors ADD COLUMN clicks_count INT DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sponsors' AND column_name='updated_at') THEN
    ALTER TABLE public.sponsors ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

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

-- Çekiliş tablosuna eksik sütunları güvenle ekleme
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

-- 15. Telegram Giriş Güvenlik Kodları
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

-- 16. 7 Günlük Giriş Serisi
CREATE TABLE IF NOT EXISTS public.user_streaks (
  user_id TEXT PRIMARY KEY,
  current_streak INT DEFAULT 0,
  last_claimed_date TEXT,
  streak_history JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 17. Ziyaretçi, Cihaz & Giriş Logları (Tüm Zamanların Girişleri)
CREATE TABLE IF NOT EXISTS public.visitor_logs (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  visitor_id TEXT,
  user_id TEXT,
  username TEXT,
  is_authenticated BOOLEAN DEFAULT FALSE,
  device_type TEXT DEFAULT 'desktop',
  os TEXT,
  os_version TEXT,
  browser TEXT,
  browser_version TEXT,
  screen_resolution TEXT,
  ip_address TEXT,
  path TEXT DEFAULT '/',
  page_title TEXT,
  referrer TEXT,
  action_type TEXT DEFAULT 'page_view',
  action_name TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 18. Günlük Toplam Ziyaretçi & Aktivite Logları (Gün Gün Arşiv)
CREATE TABLE IF NOT EXISTS public.daily_visitor_logs (
  date TEXT PRIMARY KEY, -- 'YYYY-MM-DD'
  unique_visitors INT DEFAULT 0,
  total_page_views INT DEFAULT 0,
  total_events INT DEFAULT 0,
  mobile_count INT DEFAULT 0,
  desktop_count INT DEFAULT 0,
  tablet_count INT DEFAULT 0,
  bot_count INT DEFAULT 0,
  authenticated_users INT DEFAULT 0,
  top_page TEXT,
  top_page_views INT DEFAULT 0,
  peak_hour TEXT,
  details JSONB DEFAULT '{}'::jsonb,
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
ALTER TABLE public.visitor_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_visitor_logs ENABLE ROW LEVEL SECURITY;

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
