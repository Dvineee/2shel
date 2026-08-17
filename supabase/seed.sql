-- =========================================================
-- Supabase Seed Data (Demo Content)
-- =========================================================

-- 1. Initial Site Settings
INSERT INTO public.site_settings (setting_key, setting_value)
VALUES 
('general', '{
  "site_name": "SPONSORHUB",
  "site_title": "Premium Sponsor & Kampanya Platformu",
  "site_description": "En güvenilir sponsorlar, özel yatırım ve deneme bonusları, günlük çark hediyeleri ve ödüllü çekilişler.",
  "logo_text": "SPONSORHUB",
  "logo_tagline": "PREMIUM GAMING NETWORK",
  "footer_text": "SponsorHub, en kaliteli ve doğrulanmış platformların en güncel bonuslarını ve promosyonlarını sunan bağımsız bir topluluk rehberidir. 18 yaşından küçüklerin katılımı yasaktır.",
  "telegram_url": "https://t.me/sponsorhub",
  "telegram_chat_url": "https://t.me/sponsorhub_chat",
  "twitter_url": "https://x.com/sponsorhub",
  "instagram_url": "https://instagram.com/sponsorhub",
  "support_email": "destek@sponsorhub.com",
  "maintenance_mode": false,
  "registration_enabled": true
}'::jsonb)
ON CONFLICT (setting_key) DO UPDATE 
SET setting_value = EXCLUDED.setting_value;

-- 2. Hero Slides
INSERT INTO public.hero_slides (title, subtitle, desktop_image, mobile_image, button_text, target_url, sort_order, active)
VALUES
('🏆 250.000 TL BÜYÜK YAZ TURNUVASI BAŞLADI!', 'NovaBet & WinZone iş birliğiyle haftalık 50.000 TL nakit havuzlu dev turnuvada yerini hemen al.', 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&w=1400&h=380&q=80', 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&w=600&h=300&q=80', 'HEMEN KATIL', '/giveaways', 1, true),
('💎 GÜNLÜK VIP ÇARK ÇEVİR & COIN KAZAN', 'Her gün platforma giriş yap, şans çarkını çevirip hediye coin ve özel promosyon kodlarını anında topla.', 'https://images.unsplash.com/photo-1511193311914-0346f16efe90?auto=format&fit=crop&w=1400&h=380&q=80', 'https://images.unsplash.com/photo-1511193311914-0346f16efe90?auto=format&fit=crop&w=600&h=300&q=80', 'ÇARKI ÇEVİR', '/wheel', 2, true),
('🚀 %300 HOŞ GELDİN + 500 FREESPIN', 'Doğrulanmış premium sponsorlarımızda ekstra çevrimsiz yatırım avantajı ve anında çekim garantisi.', 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1400&h=380&q=80', 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=600&h=300&q=80', 'SPONSORLARI İNCELE', '/sponsors', 3, true);

-- 3. Social / Telegram Buttons
INSERT INTO public.social_links (platform, title, subtitle, url, icon, active, sort_order)
VALUES
('telegram_chat', 'Telegram VIP Sohbet', '5.400+ Aktif Üye', 'https://t.me/sponsorhub_chat', 'MessageSquare', true, 1),
('telegram_channel', 'Telegram Resmi Duyuru', 'Anlık Bonuslar & Kodlar', 'https://t.me/sponsorhub_duyuru', 'Send', true, 2),
('twitter', 'Resmi X (Twitter)', 'Ödüllü Etkinlikler', 'https://x.com/sponsorhub', 'Twitter', true, 3);

-- 4. Banners (Left, Right, Content)
INSERT INTO public.banners (name, image_url, mobile_image_url, target_url, position, active, sort_order)
VALUES
('NovaBet Sol Dikey Banner', 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=160&h=600&q=80', NULL, '/site/novabet', 'left', true, 1),
('RoyalPlay Sağ Dikey Banner', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=160&h=600&q=80', NULL, '/site/royalplay', 'right', true, 1);

-- 5. Wheel Rewards
INSERT INTO public.wheel_rewards (title, reward_type, reward_value, color, probability, active, sort_order)
VALUES
('20 Coin', 'coin', 20, '#7C3AED', 30.0, true, 1),
('50 Coin', 'coin', 50, '#9333EA', 25.0, true, 2),
('100 Coin', 'coin', 100, '#A855F7', 15.0, true, 3),
('250 Coin', 'coin', 250, '#EAB308', 8.0, true, 4),
('500 VIP Coin', 'coin', 500, '#F59E0B', 4.0, true, 5),
('Tekrar Dene', 'retry', 0, '#64748B', 10.0, true, 6),
('Özel Bonus', 'bonus', 50, '#EC4899', 8.0, true, 7);

-- 6. Store Products
INSERT INTO public.store_products (name, description, image_url, coin_price, stock, category, active, sort_order)
VALUES
('100 TL Steam Cüzdan Kodu', 'Tüm Steam oyunlarında geçerli anında teslim dijital pin.', 'https://images.unsplash.com/photo-1612287233261-267039757657?auto=format&fit=crop&w=400&h=300&q=80', 350, 45, 'digital', true, 1),
('250 TL Trendyol Hediye Kartı', 'Giyim, elektronik ve alışverişlerinizde geçerli indirim çeki.', 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=400&h=300&q=80', 750, 30, 'gift_card', true, 2),
('PlayStation Network 250 TL', 'PS Store mağazasında geçerli bakiye kodu.', 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?auto=format&fit=crop&w=400&h=300&q=80', 800, 20, 'digital', true, 3),
('VIP Telegram Rozeti (30 Gün)', 'Toplulukta özel VIP rütbesi ve günlük ekstra 2x çark çevirme hakkı.', 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=400&h=300&q=80', 500, 999, 'membership', true, 4);

-- 7. Giveaways
INSERT INTO public.giveaways (title, description, image_url, prize_details, start_at, end_at, active, winner_count)
VALUES
('iPhone 16 Pro Max Büyük Çekilişi', 'Haftalık topluluk çekilişimize katıl, 1 şanslı üyemiz son model iPhone 16 Pro Max kazansın!', 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=600&h=360&q=80', '1x Apple iPhone 16 Pro Max 256GB', NOW(), NOW() + INTERVAL '7 days', true, 1),
('50.000 TL Nakit Dağıtım Çekilişi', 'Tam 10 şanslı üyemize kişi başı 5.000 TL nakit para ödülü! Tek tıkla hemen katıl.', 'https://images.unsplash.com/photo-1580519542036-c47de6196ba5?auto=format&fit=crop&w=600&h=360&q=80', '10x 5.000 TL Nakit Havale / Papara', NOW(), NOW() + INTERVAL '3 days', true, 10),
('PlayStation 5 Pro + 2 Kol Paketi', 'SponsorHub topluluğuna özel yeni nesil oyun konsolu hediye ediyoruz.', 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=600&h=360&q=80', '1x Sony PlayStation 5 Pro Konsol', NOW(), NOW() + INTERVAL '12 days', true, 1);

-- 8. Giveaway Templates
INSERT INTO public.giveaway_templates (id, name, title, prize_details, image_url, description, duration_days, badge_color)
VALUES
('tpl-ps5', '🎮 PS5 Paketi', 'Haftalık PlayStation 5 & Nakit Çekilişi', '1x Sony PS5 Slim + 50.000 TL Nakit Ödül', 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=800&h=450&q=80', 'Topluluk üyelerimize özel dev çekiliş. Tek tıkla hemen katıl.', 7, 'violet'),
('tpl-iphone', '📱 iPhone 16 Pro', 'iPhone 16 Pro Max Büyük Yaz Çekilişi', '1x Apple iPhone 16 Pro Max 256GB Titanyum', 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=800&h=450&q=80', 'En son model iPhone 16 Pro Max hediyesi. Şansını kaçırma.', 7, 'rose'),
('tpl-cash', '💰 100.000 TL Nakit', '100.000 TL Topluluk Nakit Dağıtımı', '100.000 TL Nakit Ödül (Banka Havalesi / Papara / Kripto)', 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=800&h=450&q=80', 'Her hafta dev nakit ödüller topluluğumuza dağıtılıyor.', 5, 'amber'),
('tpl-crypto', '💎 25.000 TL USDT', '25.000 TL Değerinde Kripto & USDT Ödülü', '1.000 USDT (Tether) Anında Kripto Cüzdanınıza Teslim', 'https://images.unsplash.com/photo-1622979135225-d2ba269bc1df?auto=format&fit=crop&w=800&h=450&q=80', 'Kripto dünyasının en popüler çekilişi. Doğrulanmış cüzdanlara anında transfer.', 3, 'emerald'),
('tpl-bonus', '🎰 1.000 Freespin + VIP', 'Mega Slot Paketi & VIP Nakit Çevrim Bonusu', '1.000 Gates of Olympus Freespin + 10.000 TL Nakit Bonus', 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&w=800&h=450&q=80', 'Sponsor sitelerimizde geçerli dev freespin ve bonus dağıtımı.', 3, 'cyan')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  title = EXCLUDED.title,
  prize_details = EXCLUDED.prize_details,
  image_url = EXCLUDED.image_url,
  description = EXCLUDED.description,
  duration_days = EXCLUDED.duration_days,
  badge_color = EXCLUDED.badge_color;
