-- =========================================================
-- Premium Sponsor & Kampanya Platformu - Database Schema
-- Run in Supabase SQL Editor
-- =========================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username VARCHAR(64) UNIQUE NOT NULL,
    avatar_url TEXT DEFAULT 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&h=200&q=80',
    coin_balance INTEGER DEFAULT 100,
    role VARCHAR(32) DEFAULT 'user' CHECK (role IN ('user', 'editor', 'admin', 'super_admin')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Sponsors Table
CREATE TABLE IF NOT EXISTS public.sponsors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(128) NOT NULL,
    slug VARCHAR(128) UNIQUE NOT NULL,
    category VARCHAR(32) DEFAULT 'main',
    logo_url TEXT NOT NULL,
    banner_url TEXT,
    description TEXT,
    short_description TEXT,
    website_url TEXT NOT NULL,
    button_text VARCHAR(64) DEFAULT 'DETAYLARI GÖR',
    rating NUMERIC(3, 1) DEFAULT 4.8,
    featured BOOLEAN DEFAULT FALSE,
    is_vip BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    bonus_code VARCHAR(64),
    badge_text VARCHAR(64),
    min_deposit VARCHAR(64),
    withdrawal_speed VARCHAR(64),
    license VARCHAR(128),
    rtp_rate VARCHAR(32),
    online_players VARCHAR(32),
    stats JSONB DEFAULT '[]'::jsonb,
    features JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for Fast Sorting & Queries
CREATE INDEX IF NOT EXISTS idx_sponsors_sort_order ON public.sponsors(sort_order ASC);
CREATE INDEX IF NOT EXISTS idx_sponsors_category ON public.sponsors(category);
CREATE INDEX IF NOT EXISTS idx_sponsors_is_active ON public.sponsors(is_active);

-- 3. Hero Slides Table
CREATE TABLE IF NOT EXISTS public.hero_slides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255),
    subtitle TEXT,
    desktop_image TEXT NOT NULL,
    mobile_image TEXT,
    button_text VARCHAR(64) DEFAULT 'Hemen Katıl',
    target_url TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    start_at TIMESTAMPTZ DEFAULT NOW(),
    end_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hero_slides_sort_order ON public.hero_slides(sort_order ASC);

-- 4. Banners Table
CREATE TABLE IF NOT EXISTS public.banners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(128) NOT NULL,
    image_url TEXT NOT NULL,
    mobile_image_url TEXT,
    target_url TEXT NOT NULL,
    position VARCHAR(32) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    start_at TIMESTAMPTZ DEFAULT NOW(),
    end_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_banners_position ON public.banners(position);

-- 5. Social / Community Links
CREATE TABLE IF NOT EXISTS public.social_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    platform VARCHAR(64) NOT NULL,
    title VARCHAR(128) NOT NULL,
    subtitle VARCHAR(128),
    url TEXT NOT NULL,
    icon VARCHAR(64) DEFAULT 'Send',
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0
);

-- 6. Wheel Rewards Table
CREATE TABLE IF NOT EXISTS public.wheel_rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(128) NOT NULL,
    reward_type VARCHAR(64) NOT NULL DEFAULT 'coin',
    reward_value INTEGER DEFAULT 0,
    color VARCHAR(32) DEFAULT '#7C3AED',
    probability NUMERIC(5, 2) DEFAULT 10.0,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0
);

-- 7. Wheel Spins Table (History)
CREATE TABLE IF NOT EXISTS public.wheel_spins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    reward_id UUID REFERENCES public.wheel_rewards(id) ON DELETE SET NULL,
    reward_title VARCHAR(128),
    reward_value INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Giveaways Table
CREATE TABLE IF NOT EXISTS public.giveaways (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    image_url TEXT NOT NULL,
    prize_details TEXT,
    start_at TIMESTAMPTZ DEFAULT NOW(),
    end_at TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    winner_count INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Giveaway Entries Table
CREATE TABLE IF NOT EXISTS public.giveaway_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    giveaway_id UUID NOT NULL REFERENCES public.giveaways(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(giveaway_id, user_id)
);

-- 10. Site Settings Table
CREATE TABLE IF NOT EXISTS public.site_settings (
    setting_key VARCHAR(64) PRIMARY KEY,
    setting_value JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Admin Logs Table
CREATE TABLE IF NOT EXISTS public.admin_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action VARCHAR(128) NOT NULL,
    module VARCHAR(64),
    target_id VARCHAR(128),
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Store Products Table
CREATE TABLE IF NOT EXISTS public.store_products (
    id VARCHAR(128) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    image_url TEXT,
    price_coins INTEGER NOT NULL DEFAULT 100,
    stock INTEGER NOT NULL DEFAULT 50,
    category VARCHAR(64) DEFAULT 'gift_card',
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Store Orders Table (TRX & IBAN Support)
CREATE TABLE IF NOT EXISTS public.store_orders (
    id VARCHAR(128) PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    product_id VARCHAR(128),
    product_title VARCHAR(255),
    price_coins INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(32) DEFAULT 'pending',
    delivery_info JSONB DEFAULT '{}'::jsonb,
    admin_note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_store_orders_user ON public.store_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_store_orders_status ON public.store_orders(status);

