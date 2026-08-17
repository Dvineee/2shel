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
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Sponsors Table
CREATE TABLE IF NOT EXISTS public.sponsors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(128) NOT NULL,
    slug VARCHAR(128) UNIQUE NOT NULL,
    logo_url TEXT NOT NULL,
    banner_url TEXT,
    description TEXT,
    short_description TEXT,
    website_url TEXT NOT NULL,
    button_text VARCHAR(64) DEFAULT 'DETAYLARI GÖR',
    rating NUMERIC(3, 1) DEFAULT 4.8,
    featured BOOLEAN DEFAULT FALSE,
    verified BOOLEAN DEFAULT TRUE,
    active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Sponsor Features
CREATE TABLE IF NOT EXISTS public.sponsor_features (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sponsor_id UUID NOT NULL REFERENCES public.sponsors(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0
);

-- 4. Sponsor Dynamic Stats
CREATE TABLE IF NOT EXISTS public.sponsor_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sponsor_id UUID NOT NULL REFERENCES public.sponsors(id) ON DELETE CASCADE,
    label VARCHAR(64) NOT NULL,
    value VARCHAR(64) NOT NULL,
    sort_order INTEGER DEFAULT 0
);

-- 5. Hero Slides Table
CREATE TABLE IF NOT EXISTS public.hero_slides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255),
    subtitle TEXT,
    desktop_image TEXT NOT NULL,
    mobile_image TEXT,
    button_text VARCHAR(64) DEFAULT 'Hemen Katıl',
    target_url TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT TRUE,
    start_at TIMESTAMPTZ DEFAULT NOW(),
    end_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Banners Table (Left, Right, Top, Content)
CREATE TABLE IF NOT EXISTS public.banners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(128) NOT NULL,
    image_url TEXT NOT NULL,
    mobile_image_url TEXT,
    target_url TEXT NOT NULL,
    position VARCHAR(32) NOT NULL CHECK (position IN ('left', 'right', 'top', 'content')),
    active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    start_at TIMESTAMPTZ DEFAULT NOW(),
    end_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Social / Community Links
CREATE TABLE IF NOT EXISTS public.social_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    platform VARCHAR(64) NOT NULL,
    title VARCHAR(128) NOT NULL,
    subtitle VARCHAR(128),
    url TEXT NOT NULL,
    icon VARCHAR(64) DEFAULT 'Send',
    active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0
);

-- 8. Wheel Rewards Table
CREATE TABLE IF NOT EXISTS public.wheel_rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(128) NOT NULL,
    reward_type VARCHAR(64) NOT NULL DEFAULT 'coin' CHECK (reward_type IN ('coin', 'special', 'retry', 'bonus')),
    reward_value INTEGER DEFAULT 0,
    color VARCHAR(32) DEFAULT '#7C3AED',
    probability NUMERIC(5, 2) DEFAULT 10.0,
    active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0
);

-- 9. Wheel Spins Table (History)
CREATE TABLE IF NOT EXISTS public.wheel_spins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    reward_id UUID REFERENCES public.wheel_rewards(id) ON DELETE SET NULL,
    reward_title VARCHAR(128),
    reward_value INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Giveaways Table
CREATE TABLE IF NOT EXISTS public.giveaways (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    image_url TEXT NOT NULL,
    prize_details TEXT,
    start_at TIMESTAMPTZ DEFAULT NOW(),
    end_at TIMESTAMPTZ NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    winner_count INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Giveaway Entries Table
CREATE TABLE IF NOT EXISTS public.giveaway_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    giveaway_id UUID NOT NULL REFERENCES public.giveaways(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(giveaway_id, user_id)
);

-- 11.1 Giveaway Templates Table
CREATE TABLE IF NOT EXISTS public.giveaway_templates (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    title VARCHAR(255) NOT NULL,
    prize_details TEXT NOT NULL,
    image_url TEXT NOT NULL,
    description TEXT,
    duration_days INTEGER DEFAULT 7,
    badge_color VARCHAR(32) DEFAULT 'violet',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Store Products Table
CREATE TABLE IF NOT EXISTS public.store_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    image_url TEXT NOT NULL,
    coin_price INTEGER NOT NULL,
    stock INTEGER DEFAULT 100,
    category VARCHAR(64) DEFAULT 'general',
    active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Store Orders Table
CREATE TABLE IF NOT EXISTS public.store_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.store_products(id) ON DELETE CASCADE,
    coin_price INTEGER NOT NULL,
    status VARCHAR(32) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
    delivery_note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. Sponsor Clicks Tracking Table
CREATE TABLE IF NOT EXISTS public.sponsor_clicks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sponsor_id UUID NOT NULL REFERENCES public.sponsors(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    session_id VARCHAR(128),
    referrer TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. Banner Clicks Tracking Table
CREATE TABLE IF NOT EXISTS public.banner_clicks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    banner_id UUID NOT NULL REFERENCES public.banners(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    session_id VARCHAR(128),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. Site Settings Table (Key-Value)
CREATE TABLE IF NOT EXISTS public.site_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key VARCHAR(128) UNIQUE NOT NULL,
    setting_value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 17. Admin Audit Logs
CREATE TABLE IF NOT EXISTS public.admin_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action VARCHAR(128) NOT NULL,
    entity_type VARCHAR(64) NOT NULL,
    entity_id UUID,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
