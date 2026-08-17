-- =========================================================
-- Row Level Security (RLS) Policies
-- =========================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsor_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsor_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hero_slides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wheel_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wheel_spins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.giveaways ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.giveaway_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsor_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banner_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to check role
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'editor')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'super_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. Profiles RLS
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON public.profiles
FOR UPDATE USING (auth.uid() = id);

-- 2. Sponsors & Subtables RLS
CREATE POLICY "Public can view active sponsors" ON public.sponsors
FOR SELECT USING (active = true OR public.is_admin());

CREATE POLICY "Admins can manage sponsors" ON public.sponsors
FOR ALL USING (public.is_admin());

CREATE POLICY "Public can view sponsor features" ON public.sponsor_features
FOR SELECT USING (true);

CREATE POLICY "Admins can manage sponsor features" ON public.sponsor_features
FOR ALL USING (public.is_admin());

CREATE POLICY "Public can view sponsor stats" ON public.sponsor_stats
FOR SELECT USING (true);

CREATE POLICY "Admins can manage sponsor stats" ON public.sponsor_stats
FOR ALL USING (public.is_admin());

-- 3. Hero Slides RLS
CREATE POLICY "Public can view active hero slides" ON public.hero_slides
FOR SELECT USING (active = true OR public.is_admin());

CREATE POLICY "Admins can manage hero slides" ON public.hero_slides
FOR ALL USING (public.is_admin());

-- 4. Banners RLS
CREATE POLICY "Public can view active banners" ON public.banners
FOR SELECT USING (active = true OR public.is_admin());

CREATE POLICY "Admins can manage banners" ON public.banners
FOR ALL USING (public.is_admin());

-- 5. Social Links RLS
CREATE POLICY "Public can view active social links" ON public.social_links
FOR SELECT USING (active = true OR public.is_admin());

CREATE POLICY "Admins can manage social links" ON public.social_links
FOR ALL USING (public.is_admin());

-- 6. Wheel Rewards & Spins RLS
CREATE POLICY "Public can view active wheel rewards" ON public.wheel_rewards
FOR SELECT USING (active = true OR public.is_admin());

CREATE POLICY "Admins can manage wheel rewards" ON public.wheel_rewards
FOR ALL USING (public.is_admin());

CREATE POLICY "Users can view their own wheel spins" ON public.wheel_spins
FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users can insert their own wheel spin" ON public.wheel_spins
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 7. Giveaways & Entries RLS
CREATE POLICY "Public can view giveaways" ON public.giveaways
FOR SELECT USING (true);

CREATE POLICY "Admins can manage giveaways" ON public.giveaways
FOR ALL USING (public.is_admin());

CREATE POLICY "Users can view entries" ON public.giveaway_entries
FOR SELECT USING (true);

CREATE POLICY "Users can insert own entry" ON public.giveaway_entries
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Public can view giveaway templates" ON public.giveaway_templates
FOR SELECT USING (true);

CREATE POLICY "Admins can manage giveaway templates" ON public.giveaway_templates
FOR ALL USING (public.is_admin());

-- 8. Store Products & Orders RLS
CREATE POLICY "Public can view store products" ON public.store_products
FOR SELECT USING (active = true OR public.is_admin());

CREATE POLICY "Admins can manage store products" ON public.store_products
FOR ALL USING (public.is_admin());

CREATE POLICY "Users can view own store orders" ON public.store_orders
FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users can insert own store order" ON public.store_orders
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update orders" ON public.store_orders
FOR UPDATE USING (public.is_admin());

-- 9. Click Tracking RLS
CREATE POLICY "Anyone can insert sponsor clicks" ON public.sponsor_clicks
FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view sponsor clicks" ON public.sponsor_clicks
FOR SELECT USING (public.is_admin());

CREATE POLICY "Anyone can insert banner clicks" ON public.banner_clicks
FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view banner clicks" ON public.banner_clicks
FOR SELECT USING (public.is_admin());

-- 10. Site Settings RLS
CREATE POLICY "Public can view site settings" ON public.site_settings
FOR SELECT USING (true);

CREATE POLICY "Admins can update site settings" ON public.site_settings
FOR ALL USING (public.is_admin());

-- 11. Admin Logs RLS
CREATE POLICY "Admins can view admin logs" ON public.admin_logs
FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can insert admin logs" ON public.admin_logs
FOR INSERT WITH CHECK (public.is_admin());
