export type UserRole = 'user' | 'editor' | 'admin' | 'super_admin';

export interface TelegramAuthUser {
  id: number | string;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date?: number;
  hash?: string;
}

export interface Profile {
  id: string;
  username: string;
  email?: string;
  avatar_url: string;
  coin_balance: number;
  role: UserRole;
  active: boolean;
  telegram_id?: string;
  telegram_username?: string;
  telegram_first_name?: string;
  telegram_last_name?: string;
  telegram_photo_url?: string;
  telegram_auth_date?: number;
  is_telegram_verified?: boolean;
  created_at: string;
  updated_at: string;
}

export interface SponsorStat {
  id?: string;
  sponsor_id?: string;
  label: string;
  value: string;
  sort_order?: number;
}

export interface SponsorFeature {
  id?: string;
  sponsor_id?: string;
  text: string;
  sort_order?: number;
}

export type SponsorCategory = 'main' | 'vip' | 'trusted';

export interface SponsorFAQ {
  question: string;
  answer: string;
}

export interface Sponsor {
  id: string;
  name: string;
  slug: string;
  logo_url: string;
  banner_url?: string;
  description?: string;
  short_description?: string;
  custom_review?: string;
  website_url: string;
  button_text: string;
  rating?: number;
  featured: boolean;
  is_vip?: boolean;
  verified: boolean;
  active: boolean;
  is_active?: boolean;
  is_popular?: boolean;
  has_detail_page?: boolean;
  sort_order: number;
  category?: SponsorCategory;
  bonus_text?: string;
  bonus_code?: string;
  min_deposit?: string;
  withdrawal_speed?: string;
  license?: string;
  rtp_rate?: string;
  online_players?: number;
  payment_methods?: string[];
  live_support?: string;
  bonus_headline?: string;
  badge_text?: string;
  accent_color?: string;
  created_at?: string;
  updated_at?: string;
  stats?: SponsorStat[];
  features?: SponsorFeature[];
  pros?: string[];
  cons?: string[];
  faq?: SponsorFAQ[];
  clicks_count?: number;
}

export interface HeroSlide {
  id: string;
  title?: string;
  subtitle?: string;
  desktop_image: string;
  mobile_image?: string;
  button_text?: string;
  target_url: string;
  sort_order: number;
  active: boolean;
  start_at?: string;
  end_at?: string;
  created_at?: string;
}

export type BannerPosition = 'left' | 'right' | 'top' | 'bottom' | 'home_top' | 'home_bottom' | 'content';

export interface Banner {
  id: string;
  name: string;
  image_url: string;
  mobile_image_url?: string;
  target_url: string;
  position: BannerPosition;
  active: boolean;
  sort_order: number;
  start_at?: string;
  end_at?: string;
  created_at?: string;
  clicks_count?: number;
}

export interface SocialLink {
  id: string;
  platform: string;
  title: string;
  subtitle?: string;
  url: string;
  icon: string;
  active: boolean;
  sort_order: number;
}

export type WheelRewardType = 'coin' | 'special' | 'retry' | 'bonus' | 'code';

export interface WheelReward {
  id: string;
  title: string;
  reward_type: WheelRewardType;
  reward_value: number;
  color: string;
  probability: number;
  active: boolean;
  sort_order: number;
}

export interface WheelSpin {
  id: string;
  user_id: string;
  username?: string;
  reward_id?: string;
  reward_title: string;
  reward_value: number;
  created_at: string;
}

export interface StreakDayConfig {
  day: number;
  reward_coins: number;
  label: string;
  vip?: boolean;
}

export interface UserStreakInfo {
  current_streak: number;
  last_claimed_date: string | null;
  is_claimed_today: boolean;
  streak_history: { day: number; claimed_at: string; coins_awarded: number }[];
}

export interface Giveaway {
  id: string;
  title: string;
  description: string;
  image_url: string;
  prize_details: string;
  start_at: string;
  end_at: string;
  active: boolean;
  winner_count: number;
  created_at?: string;
  entries_count?: number;
  has_entered?: boolean;
  is_completed?: boolean;
  winner_username?: string;
  winner_id?: string;
  winner_announced_at?: string;
  winner_note?: string;
}

export interface GiveawayEntry {
  id: string;
  giveaway_id: string;
  user_id: string;
  username?: string;
  created_at: string;
}

export interface GiveawayTemplate {
  id: string;
  name: string;
  title: string;
  prize_details: string;
  image_url: string;
  description: string;
  duration_days: number;
  winner_count?: number;
  badge_color?: 'violet' | 'rose' | 'amber' | 'emerald' | 'blue' | 'cyan' | 'fuchsia';
}

export interface StoreProduct {
  id: string;
  name: string;
  description: string;
  image_url: string;
  coin_price: number;
  stock: number;
  category: string;
  active: boolean;
  sort_order: number;
  created_at?: string;
}

export type PayoutType = 'trx' | 'iban';

export interface StoreOrder {
  id: string;
  user_id: string;
  username?: string;
  product_id: string;
  product_name?: string;
  coin_price: number;
  payout_type?: PayoutType;
  payout_address?: string;
  payout_holder_name?: string;
  payout_bank_name?: string;
  status: 'pending' | 'completed' | 'cancelled' | 'rejected';
  delivery_note?: string;
  admin_note?: string;
  created_at: string;
  updated_at?: string;
}

export interface PageControlItem {
  id: string;
  key: string;
  name: string;
  path: string;
  description: string;
  enabled: boolean;
  category: string;
  iconName: string;
  maintenance_message?: string;
}

export interface SiteSettings {
  site_name: string;
  site_title?: string;
  meta_description?: string;
  site_description?: string;
  og_title?: string;
  og_description?: string;
  og_image?: string;
  og_url?: string;
  og_site_name?: string;
  favicon_url?: string;
  twitter_card?: string;
  google_site_verification?: string;
  logo_text?: string;
  logo_tagline?: string;
  logo_url?: string;
  footer_text: string;
  copyright_text?: string;
  telegram_url?: string;
  telegram_channel_url?: string;
  telegram_chat_url?: string;
  telegram_bot_username?: string;
  telegram_bot_token?: string;
  telegram_bot_url?: string;
  telegram_login_enabled?: boolean;
  twitter_url?: string;
  instagram_url?: string;
  youtube_url?: string;
  support_email: string;
  maintenance_mode?: boolean;
  registration_enabled?: boolean;
  sidebar_logo?: string;
  // Top Announcement Banner
  announcement_enabled?: boolean;
  announcement_text?: string;
  announcement_link?: string;
  announcement_badge?: string;
  // Coin rewards & Economy
  welcome_coin_bonus?: number;
  daily_wheel_free_spins?: number;
  streak_bonus_enabled?: boolean;
  streak_rewards?: StreakDayConfig[];
  // Dynamic Page Control Toggles
  page_sponsors_enabled?: boolean;
  page_wheel_enabled?: boolean;
  page_giveaways_enabled?: boolean;
  page_leaderboard_enabled?: boolean;
  page_store_enabled?: boolean;
  page_games_enabled?: boolean;
  page_live_enabled?: boolean;
  page_about_enabled?: boolean;
  page_contact_enabled?: boolean;
  // Custom Maintenance Messages
  maintenance_title?: string;
  maintenance_description?: string;
}

export type SiteSetting = SiteSettings;

export interface AdminLog {
  id: string;
  admin_id?: string;
  admin_username?: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  details?: Record<string, unknown>;
  ip_address?: string;
  created_at: string;
}

export * from './mines';

export type DeviceCategory = 'mobile' | 'desktop' | 'tablet' | 'bot';

export interface VisitorLog {
  id: string;
  session_id: string;
  visitor_id: string;
  user_id?: string | null;
  username?: string | null;
  is_authenticated?: boolean;
  device_type: DeviceCategory;
  os: string;
  os_version?: string;
  browser: string;
  browser_version?: string;
  screen_resolution?: string;
  ip_address?: string;
  path: string;
  page_title?: string;
  referrer?: string;
  action_type: 'page_view' | 'login' | 'register' | 'sponsor_click' | 'banner_click' | 'wheel_spin' | 'giveaway_entry' | 'store_purchase' | 'mines_game' | 'game_play' | 'heartbeat' | 'other';
  action_name?: string;
  details?: Record<string, any>;
  duration_seconds?: number;
  is_online?: boolean;
  last_seen_at?: string;
  created_at: string;
}

export interface DailyVisitorLog {
  date: string; // YYYY-MM-DD
  unique_visitors: number;
  total_page_views: number;
  total_events: number;
  mobile_count: number;
  desktop_count: number;
  tablet_count: number;
  bot_count: number;
  authenticated_users: number;
  top_page?: string;
  top_page_views?: number;
  peak_hour?: string;
  updated_at?: string;
}

export interface VisitorStats {
  total_events: number;
  all_time_total_events?: number;
  time_range?: string;
  total_unique_visitors: number;
  total_page_views: number;
  live_active_visitors: number;
  today_unique_visitors?: number;
  today_page_views?: number;
  yesterday_unique_visitors?: number;
  daily_average_visitors?: number;
  peak_day?: { date: string; visitors: number };
  daily_history?: DailyVisitorLog[];
  device_breakdown: {
    mobile_count: number;
    mobile_percent: number;
    desktop_count: number;
    desktop_percent: number;
    tablet_count: number;
    tablet_percent: number;
    bot_count: number;
    bot_percent: number;
  };
  os_breakdown: { name: string; count: number; percent: number }[];
  browser_breakdown: { name: string; count: number; percent: number }[];
  top_pages: { path: string; count: number }[];
  action_breakdown: { action: string; count: number }[];
}

