import { Sponsor, HeroSlide, Banner, SocialLink, WheelReward, StoreProduct, Giveaway, GiveawayTemplate, SiteSettings, Profile } from '../types';

export const initialSiteSettings: SiteSettings = {
  site_name: 'SHELBYONLINE',
  site_title: 'ShelbyOnline | Premium Sponsor & Kampanya Platformu',
  site_description: 'Doğrulanmış güvenilir sponsor platformları, özel yatırım ve deneme bonusları, günlük çark hediyeleri ve ödüllü topluluk çekilişleri.',
  logo_text: 'SHELBYONLINE',
  logo_tagline: 'PREMIUM SPONSOR & GAMING NETWORK',
  footer_text: 'ShelbyOnline, doğrulanmış eğlence ve sponsorluk ağlarının en güncel bonuslarını sunan bağımsız bir topluluk portalıdır. 18 yaşından küçüklerin katılımı yasaktır.',
  telegram_url: 'https://t.me/shelbyonline',
  telegram_channel_url: 'https://t.me/shelbyonline',
  telegram_chat_url: 'https://t.me/shelbyonline_chat',
  telegram_bot_username: 'ShelbyOnlineBot',
  telegram_bot_token: '8944054737:AAHD_G8mzXVQiYEQnqUDiLa6hSJyRdIyjeY',
  telegram_bot_url: 'https://t.me/ShelbyOnlineBot',
  telegram_login_enabled: true,
  twitter_url: 'https://x.com/shelbyonline',
  instagram_url: 'https://instagram.com/shelbyonline',
  support_email: 'destek@shelbyonline.com',
  maintenance_mode: false,
  registration_enabled: true,
  // Top Announcement Banner
  announcement_enabled: true,
  announcement_text: '🔥 Yeni Sezon Çekilişi Başladı! Telegram ile giriş yapıp +250 Hoş Geldin Coini anında kapın!',
  announcement_link: '/giveaways',
  announcement_badge: 'YENİ ETKİNLİK',
  // Economy & Coins
  welcome_coin_bonus: 250,
  daily_wheel_free_spins: 1,
  streak_bonus_enabled: true,
  streak_rewards: [
    { day: 1, reward_coins: 50, label: '50 Coin' },
    { day: 2, reward_coins: 100, label: '100 Coin' },
    { day: 3, reward_coins: 150, label: '150 Coin' },
    { day: 4, reward_coins: 200, label: '200 Coin' },
    { day: 5, reward_coins: 300, label: '300 Coin' },
    { day: 6, reward_coins: 500, label: '500 Coin' },
    { day: 7, reward_coins: 1000, label: '1000 VIP + Sandık', vip: true },
  ],
  // Page Control Toggles (true = aktif, false = pasif/bakımda)
  page_sponsors_enabled: true,
  page_wheel_enabled: true,
  page_giveaways_enabled: true,
  page_leaderboard_enabled: true,
  page_store_enabled: true,
  page_games_enabled: true,
  page_live_enabled: true,
  page_about_enabled: true,
  page_contact_enabled: true,
  // Maintenance text
  maintenance_title: 'Sayfa Geçici Olarak Bakımdadır',
  maintenance_description: 'Yöneticilerimiz bu sayfayı güncelliyor. Lütfen kısa bir süre sonra tekrar ziyaret ediniz.',
};

export const initialProfiles: Profile[] = [];

export const initialSponsors: Sponsor[] = [];

export const initialHeroSlides: HeroSlide[] = [];

export const initialBanners: Banner[] = [];

export const initialSocialLinks: SocialLink[] = [];

export const initialWheelRewards: WheelReward[] = [];

export const initialGiveaways: Giveaway[] = [];

export const initialStoreProducts: StoreProduct[] = [];

export const initialGiveawayTemplates: GiveawayTemplate[] = [
  {
    id: 'tpl-ps5',
    name: '🎮 PS5 Paketi',
    title: 'Haftalık PlayStation 5 & Nakit Çekilişi',
    prize_details: '1x Sony PS5 Slim + 50.000 TL Nakit Ödül',
    image_url: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=800&h=450&q=80',
    description: 'Topluluk üyelerimize özel dev çekiliş. Tek tıkla hemen katıl.',
    duration_days: 7,
    badge_color: 'violet',
  },
  {
    id: 'tpl-iphone',
    name: '📱 iPhone 16 Pro',
    title: 'iPhone 16 Pro Max Büyük Yaz Çekilişi',
    prize_details: '1x Apple iPhone 16 Pro Max 256GB Titanyum',
    image_url: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=800&h=450&q=80',
    description: 'En son model iPhone 16 Pro Max hediyesi. Şansını kaçırma.',
    duration_days: 7,
    badge_color: 'rose',
  },
  {
    id: 'tpl-cash',
    name: '💰 100.000 TL Nakit',
    title: '100.000 TL Topluluk Nakit Dağıtımı',
    prize_details: '100.000 TL Nakit Ödül (Banka Havalesi / Papara / Kripto)',
    image_url: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=800&h=450&q=80',
    description: 'Her hafta dev nakit ödüller topluluğumuza dağıtılıyor.',
    duration_days: 5,
    badge_color: 'amber',
  },
  {
    id: 'tpl-crypto',
    name: '💎 25.000 TL USDT',
    title: '25.000 TL Değerinde Kripto & USDT Ödülü',
    prize_details: '1.000 USDT (Tether) Anında Kripto Cüzdanınıza Teslim',
    image_url: 'https://images.unsplash.com/photo-1622979135225-d2ba269bc1df?auto=format&fit=crop&w=800&h=450&q=80',
    description: 'Kripto dünyasının en popüler çekilişi. Doğrulanmış cüzdanlara anında transfer.',
    duration_days: 3,
    badge_color: 'emerald',
  },
  {
    id: 'tpl-bonus',
    name: '🎰 1.000 Freespin + VIP',
    title: 'Mega Slot Paketi & VIP Nakit Çevrim Bonusu',
    prize_details: '1.000 Gates of Olympus Freespin + 10.000 TL Nakit Bonus',
    image_url: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&w=800&h=450&q=80',
    description: 'Sponsor sitelerimizde geçerli dev freespin ve bonus dağıtımı.',
    duration_days: 3,
    badge_color: 'cyan',
  },
];

