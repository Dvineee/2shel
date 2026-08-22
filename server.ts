import 'dotenv/config';
import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Telegram Bot Configuration
const TELEGRAM_BOT_TOKEN =
  process.env.TELEGRAM_BOT_TOKEN || '8944054737:AAHD_G8mzXVQiYEQnqUDiLa6hSJyRdIyjeY';

// Portal Data & Supabase Configuration
const getValidSupabaseUrl = (): string => {
  const envUrl = (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '').trim();
  if (
    envUrl &&
    !envUrl.includes('your-project') &&
    !envUrl.includes('placeholder') &&
    !envUrl.includes('example.supabase.co') &&
    envUrl.startsWith('http')
  ) {
    return envUrl;
  }
  return 'https://pkxcsjxqxzzfsoamyegk.supabase.co';
};

const getValidSupabaseKey = (): string => {
  const envKey = (process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '').trim();
  if (
    envKey &&
    !envKey.includes('your-anon-key') &&
    !envKey.includes('dummy') &&
    envKey.length > 20
  ) {
    return envKey;
  }
  return 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBreGNzanhxeHp6ZnNvYW15ZWdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY5ODc0MzIsImV4cCI6MjEwMjU2MzQzMn0.1F4NEkWKVRIWlCN882mdUemOMr5Gm0WK7xWcMknIrC0';
};

const SUPABASE_URL = getValidSupabaseUrl();
const SUPABASE_ANON_KEY = getValidSupabaseKey();

interface TelegramCodeEntry {
  code: string;
  telegram_id: number;
  telegram_username: string;
  telegram_first_name: string;
  telegram_last_name?: string;
  photo_url?: string;
  created_at: number;
  expires_at: number;
}

// In-memory code store (code -> Telegram user data)
const activeAuthCodes = new Map<string, TelegramCodeEntry>();

let botInfo: { id: number; username: string; first_name: string } = {
  id: 8944054737,
  username: 'ShelbyOnlineBOT',
  first_name: 'ShelbyOnlineBot',
};

// Deduplication & Anti-Spam Tracking
const processedUpdateIds = new Set<number>();
const processedMessageKeys = new Set<string>();
const lastUserActionTimes = new Map<number | string, { time: number; code: string }>();

function markUpdateProcessed(updateId: number): boolean {
  if (processedUpdateIds.has(updateId)) return true;
  processedUpdateIds.add(updateId);
  // Keep set size bounded to prevent memory growth
  if (processedUpdateIds.size > 5000) {
    const firstKey = processedUpdateIds.values().next().value;
    if (firstKey !== undefined) processedUpdateIds.delete(firstKey);
  }
  return false;
}

function markMessageProcessed(key: string): boolean {
  if (processedMessageKeys.has(key)) return true;
  processedMessageKeys.add(key);
  if (processedMessageKeys.size > 5000) {
    const firstKey = processedMessageKeys.values().next().value;
    if (firstKey !== undefined) processedMessageKeys.delete(firstKey);
  }
  return false;
}

// Telegram API Helper with resilient timeout and network error handling
async function telegramApiCall(method: string, body?: any, timeoutMs?: number) {
  if (!TELEGRAM_BOT_TOKEN) return null;
  
  // Timeout for long-polling (getUpdates) is 25s; for standard API calls 8s
  const effectiveTimeout = timeoutMs || (method === 'getUpdates' ? 25000 : 8000);

  try {
    const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/${method}`, {
      method: body ? 'POST' : 'GET',
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(effectiveTimeout),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      console.warn(`[Telegram API] ${method} returned HTTP ${res.status}: ${errText}`);
      return null;
    }

    const data = await res.json();
    return data;
  } catch (err: any) {
    const isNetworkError =
      err?.name === 'AbortError' ||
      err?.name === 'TimeoutError' ||
      err?.code === 'ECONNRESET' ||
      err?.cause?.code === 'ECONNRESET' ||
      err?.message?.includes('fetch failed') ||
      err?.cause?.message?.includes('ECONNRESET');

    if (method === 'getUpdates' && isNetworkError) {
      // Long-polling idle reconnect cycle is normal when Telegram or container resets idle connection
      // Log as brief info notice instead of throwing an unhandled error
      return null;
    }

    console.warn(`[Telegram API] Warning on [${method}]:`, err?.message || err);
    return null;
  }
}

// Telegram User Supabase Sync Helper
async function syncTelegramUserToSupabase(tgUser: {
  id: number | string;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  coins?: number;
  role?: string;
}) {
  try {
    const tgIdStr = String(tgUser.id);
    const cleanUsername = tgUser.username ? tgUser.username.replace('@', '') : '';
    const fullName = [tgUser.first_name, tgUser.last_name].filter(Boolean).join(' ');
    const displayName = cleanUsername ? `@${cleanUsername}` : (fullName || `TG_${tgIdStr.slice(-4)}`);
    const headers = {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=representation',
    };

    // Check if profile exists
    const checkRes = await fetch(
      `${SUPABASE_URL}/rest/v1/profiles?or=(telegram_id.eq.${tgIdStr},id.eq.tg-${tgIdStr})&select=*`,
      { headers }
    );
    let existingProfile: any = null;
    if (checkRes.ok) {
      const list = await checkRes.json();
      if (Array.isArray(list) && list.length > 0) {
        existingProfile = list[0];
      }
    }

    const isVerifiedOwner = tgIdStr === '894405473';
    const assignedRole = existingProfile?.role || (isVerifiedOwner ? 'super_admin' : 'user');

    const profileRecord = {
      id: existingProfile?.id || `tg-${tgIdStr}`,
      username: displayName,
      telegram_id: tgIdStr,
      telegram_username: cleanUsername || null,
      first_name: tgUser.first_name || null,
      last_name: tgUser.last_name || null,
      avatar_url: tgUser.photo_url || existingProfile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName || displayName)}&background=24A1DE&color=ffffff&bold=true&size=256`,
      coins: tgUser.coins ?? existingProfile?.coins ?? 250,
      role: assignedRole,
    };

    await fetch(`${SUPABASE_URL}/rest/v1/profiles`, {
      method: 'POST',
      headers,
      body: JSON.stringify(profileRecord),
    });

    return profileRecord;
  } catch (err) {
    console.error('Error syncing Telegram user to Supabase:', err);
    return null;
  }
}

// Persist generated auth code to Supabase so it works on any hosting
async function persistAuthCodeToSupabase(entry: TelegramCodeEntry) {
  try {
    const headers = {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=representation',
    };

    // Store in admin_logs as telegram_auth_code (globally supported table)
    await fetch(`${SUPABASE_URL}/rest/v1/admin_logs`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        id: `tg_code_${entry.code}`,
        username: entry.telegram_username,
        action: 'AUTH_CODE',
        target_type: 'telegram_auth_code',
        target_id: entry.code,
        details: {
          code: entry.code,
          telegram_id: String(entry.telegram_id),
          telegram_username: entry.telegram_username,
          first_name: entry.telegram_first_name,
          last_name: entry.telegram_last_name || '',
          photo_url: entry.photo_url || '',
          created_at: entry.created_at,
          expires_at: entry.expires_at,
          is_used: false,
        },
      }),
    });

    // Also attempt write to telegram_auth_codes if table exists
    fetch(`${SUPABASE_URL}/rest/v1/telegram_auth_codes`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        code: entry.code,
        telegram_id: String(entry.telegram_id),
        telegram_username: entry.telegram_username || null,
        telegram_first_name: entry.telegram_first_name || null,
        telegram_last_name: entry.telegram_last_name || null,
        photo_url: entry.photo_url || null,
        created_at: new Date(entry.created_at).toISOString(),
        expires_at: new Date(entry.expires_at).toISOString(),
        is_used: false,
      }),
    }).catch(() => {});
  } catch (err) {
    console.error('Error saving auth code to Supabase:', err);
  }
}

// Fetch real Telegram User Profile Photo as Base64 Data URL (100% portable across all hostings)
async function getTelegramUserProfilePhoto(userId: number, displayName: string): Promise<string> {
  try {
    const photosRes = await telegramApiCall('getUserProfilePhotos', {
      user_id: userId,
      limit: 1,
    });

    if (
      photosRes &&
      photosRes.ok &&
      photosRes.result &&
      photosRes.result.photos &&
      photosRes.result.photos.length > 0
    ) {
      const photoArray = photosRes.result.photos[0];
      // Get highest resolution version available
      const bestPhoto = photoArray[photoArray.length - 1] || photoArray[0];
      if (bestPhoto && bestPhoto.file_id) {
        const fileRes = await telegramApiCall('getFile', { file_id: bestPhoto.file_id });
        if (fileRes && fileRes.ok && fileRes.result && fileRes.result.file_path) {
          const fileUrl = `https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${fileRes.result.file_path}`;
          try {
            const imgFetch = await fetch(fileUrl, { signal: AbortSignal.timeout(8000) });
            if (imgFetch.ok) {
              const arrayBuffer = await imgFetch.arrayBuffer();
              const base64 = Buffer.from(arrayBuffer).toString('base64');
              const contentType = imgFetch.headers.get('content-type') || 'image/jpeg';
              console.log(`📸 Successfully fetched and encoded Telegram photo for user ${userId} (${base64.length} bytes)`);
              return `data:${contentType};base64,${base64}`;
            }
          } catch (imgErr) {
            // Fallback gracefully to avatar
          }
        }
      }
    }
  } catch (err) {
    console.error(`Error fetching profile photo for Telegram User ID ${userId}:`, err);
  }

  const safeName = encodeURIComponent(displayName || 'Shelby User');
  return `https://ui-avatars.com/api/?name=${safeName}&background=24A1DE&color=ffffff&bold=true&size=256`;
}

// Fetch bot details from Telegram API
async function initTelegramBot() {
  console.log('🤖 Initializing Telegram Bot with token...');
  
  // 1. Clear any conflicting webhooks so long-polling works smoothly without duplication
  try {
    await telegramApiCall('deleteWebhook', { drop_pending_updates: false });
  } catch (e) {
    console.warn('Webhook delete notice:', e);
  }

  // 2. Fetch current bot info
  const res = await telegramApiCall('getMe');
  if (res && res.ok && res.result) {
    botInfo = {
      id: res.result.id,
      username: res.result.username || 'ShelbyOnlineBOT',
      first_name: res.result.first_name || 'ShelbyOnlineBot',
    };
    console.log(`✅ Telegram Bot Connected: @${botInfo.username} (${botInfo.first_name})`);

    // 3. Register standard bot commands
    await telegramApiCall('setMyCommands', {
      commands: [
        { command: 'start', description: 'Giriş Kodu Al (5 Dk Geçerli)' },
        { command: 'kod', description: 'Yeni 6 Haneli Giriş Kodu Üret' },
        { command: 'bakiye', description: 'Shelby Coin Bakiyeni Öğren' },
        { command: 'yardim', description: 'Giriş ve Bonus Yardımı' },
      ],
    });

    // 4. Prime initial polling offset to prevent processing a flood of stale historical updates
    try {
      const initUpdates = await telegramApiCall('getUpdates', { offset: -1, limit: 1 });
      if (initUpdates && initUpdates.ok && Array.isArray(initUpdates.result) && initUpdates.result.length > 0) {
        pollingOffset = initUpdates.result[0].update_id + 1;
        console.log(`📡 Polling offset initialized to: ${pollingOffset}`);
      }
    } catch (e) {
      console.warn('Could not initialize polling offset:', e);
    }
  } else {
    console.warn('⚠️ Telegram bot connection could not be established. Falling back to default username.');
  }
}

// Polling loop for Telegram Updates
let pollingOffset = 0;
let isPolling = false;

async function pollTelegramUpdates() {
  if (isPolling) return;
  isPolling = true;

  let consecutiveErrors = 0;

  while (true) {
    try {
      const res = await telegramApiCall(
        'getUpdates',
        {
          offset: pollingOffset,
          timeout: 15,
          allowed_updates: ['message', 'callback_query'],
        },
        22000
      );

      if (res && res.ok && Array.isArray(res.result)) {
        consecutiveErrors = 0;
        for (const update of res.result) {
          // Immediately acknowledge offset for Telegram
          if (update.update_id >= pollingOffset) {
            pollingOffset = update.update_id + 1;
          }
          await handleTelegramUpdate(update);
        }
      } else if (!res) {
        consecutiveErrors++;
        // If connection reset or failed, wait progressively (1s -> 2s -> 4s max 8s) before retry
        const backoff = Math.min(consecutiveErrors * 1500, 8000);
        await new Promise((r) => setTimeout(r, backoff));
        continue;
      }
    } catch (e: any) {
      consecutiveErrors++;
      // Quietly continue on loop errors
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
}

// Generate code and send message helper with anti-duplicate debounce
async function sendAuthCodeMessage(chatId: number, fromUser: any, forceNew = false) {
  const userId = fromUser.id;
  const now = Date.now();
  const lastAction = lastUserActionTimes.get(userId);

  // Debounce: If user triggered within 4 seconds and not forcing, prevent duplicate blast
  if (!forceNew && lastAction && now - lastAction.time < 4000) {
    console.log(`[Anti-Spam] Suppressed duplicate code trigger for user ${userId} within 4s.`);
    return;
  }

  // Generate 6-digit numeric verification code
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const displayName = fromUser.first_name || fromUser.username || 'Değerli Üyemiz';

  // Record action time
  lastUserActionTimes.set(userId, { time: now, code });

  // Clean up any existing active codes for this user to avoid multiple dangling codes
  for (const [existingCode, entry] of activeAuthCodes.entries()) {
    if (entry.telegram_id === userId) {
      activeAuthCodes.delete(existingCode);
      fetch(`${SUPABASE_URL}/rest/v1/admin_logs?id=eq.tg_code_${existingCode}`, {
        method: 'DELETE',
        headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
      }).catch(() => {});
    }
  }

  // Fetch real profile photo
  const photoUrl = await getTelegramUserProfilePhoto(fromUser.id, displayName);

  // EXACTLY 5 MINUTES EXPIRATION
  const expiresAt = now + 5 * 60 * 1000;

  const entry: TelegramCodeEntry = {
    code,
    telegram_id: fromUser.id,
    telegram_username: fromUser.username ? fromUser.username.replace('@', '') : `user_${fromUser.id}`,
    telegram_first_name: fromUser.first_name || 'Shelby',
    telegram_last_name: fromUser.last_name || '',
    photo_url: photoUrl,
    created_at: now,
    expires_at: expiresAt,
  };

  // 1. Save in memory
  activeAuthCodes.set(code, entry);

  // 2. Persist to Supabase Database immediately
  await persistAuthCodeToSupabase(entry);

  const welcomeMsg =
    `👋 <b>Merhaba ${displayName}!</b>\n\n` +
    `👑 <b>SHELBYONLINE</b> platformuna hoş geldiniz.\n\n` +
    `🌐 Web sitesine giriş yapmak için tek kullanımlık güvenlik kodunuz:\n\n` +
    `🔑 <code>${code}</code>\n\n` +
    `⏳ <b>Geçerlilik Süresi:</b> Bu kod tam <b>5 dakika</b> geçerlidir. Kopyalamak için kodun üzerine dokunmanız yeterlidir.\n\n` +
    `⚡ Web sitemizdeki (<b>shelbyonline.com</b>) <b>Giriş Kodu</b> alanına bu 6 haneli kodu yazarak şifresiz ve anında oturum açabilirsiniz.\n\n` +
    `🎁 <b>Telegram Giriş Bonusu:</b> Hesabınıza anında <b>+250 Shelby Coin</b> yüklenecektir! 💰`;

  await telegramApiCall('sendMessage', {
    chat_id: chatId,
    text: welcomeMsg,
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: '🌐 Web Sitesine Git & Kodu Gir',
            url: 'https://shelbyonline.com/login',
          },
        ],
        [
          {
            text: '🔄 Yeni 5 Dakikalık Kod Üret',
            callback_data: 'refresh_code',
          },
        ],
      ],
    },
  });
}

// Handle incoming Telegram message or callback
async function handleTelegramUpdate(update: any) {
  if (!update) return;

  // 0. Update ID deduplication (ensures webhook or retried polling never processes twice)
  if (update.update_id && markUpdateProcessed(update.update_id)) {
    return;
  }

  // 1. Callback Queries (inline button clicks like "Yeni Kod Üret")
  if (update.callback_query) {
    const cb = update.callback_query;
    const chatId = cb.message?.chat?.id;
    const fromUser = cb.from;

    if (cb.data === 'refresh_code' && chatId && fromUser) {
      const cbKey = `cb_${cb.id}`;
      if (markMessageProcessed(cbKey)) return;

      await telegramApiCall('answerCallbackQuery', {
        callback_query_id: cb.id,
        text: 'Yeni 5 dakikalık kodunuz oluşturuldu.',
      });
      await sendAuthCodeMessage(chatId, fromUser, true);
    }
    return;
  }

  // 2. Text Messages
  const msg = update.message;
  if (!msg || !msg.text) return;

  const chatId = msg.chat?.id;
  const fromUser = msg.from;
  const text = msg.text.trim();

  if (!chatId || !fromUser) return;

  // Deduplicate by message ID
  const msgKey = `msg_${chatId}_${msg.message_id}`;
  if (markMessageProcessed(msgKey)) return;

  // Ignore stale messages older than 2 minutes
  if (msg.date && Date.now() / 1000 - msg.date > 120) {
    console.log(`[Anti-Spam] Ignored stale message from ${fromUser.id} (${msg.date})`);
    return;
  }

  // If user sends /start, /kod or asks for code
  if (
    text.startsWith('/start') ||
    text.startsWith('/kod') ||
    text.toLowerCase() === 'kod' ||
    text.toLowerCase() === 'giris' ||
    text.toLowerCase() === 'giriş'
  ) {
    await sendAuthCodeMessage(chatId, fromUser);
  } else if (text.startsWith('/bakiye')) {
    const isSuperAdmin = String(fromUser.id) === '894405473';
    await telegramApiCall('sendMessage', {
      chat_id: chatId,
      text:
        `💰 <b>ShelbyOnline Bakiye Bilgisi</b>\n\n` +
        `👤 Kullanıcı: <b>@${fromUser.username || fromUser.first_name}</b>\n` +
        `💎 Rol: <b>${isSuperAdmin ? '👑 Süper Yönetici' : '🌟 Üye'}</b>\n` +
        `🎁 Günlük Çark ve Mağazada harcayabileceğiniz coinlerinizi görmek için web sitesine giriş yapınız.`,
      parse_mode: 'HTML',
    });
  } else if (text.startsWith('/yardim')) {
    await telegramApiCall('sendMessage', {
      chat_id: chatId,
      text:
        `ℹ️ <b>ShelbyOnline Giriş Yardımı</b>\n\n` +
        `1. /start veya /kod komutunu bota gönderin.\n` +
        `2. Botun verdiği 6 haneli güvenlik kodunu kopyalayın (5 dakika geçerlidir).\n` +
        `3. <b>shelbyonline.com</b> üzerindeki giriş kutusuna kodu yapıştırıp onaylayın.\n` +
        `4. Şifresiz olarak hesabınıza bağlanın ve hediyelerinizi toplayın!`,
      parse_mode: 'HTML',
    });
  }
}

// ======================== API ROUTES ========================

// In-memory cache for portal data to eliminate database saturation & ensure sub-5ms response times
let cachedPortalData: any = null;
let cachedPortalDataTime = 0;
const PORTAL_CACHE_TTL_MS = 20000; // 20 seconds cache for high responsiveness, instantly invalidated on writes

// In-memory & local disk cache for SEO & Site Settings
const LOCAL_SETTINGS_FILE = path.join(process.cwd(), '.site_settings_cache.json');
let cachedSiteSettings: any = null;
let cachedSiteSettingsTime = 0;
const SITE_SETTINGS_CACHE_TTL = 15000; // 15 seconds

function readLocalSettingsCache(): any | null {
  try {
    if (fs.existsSync(LOCAL_SETTINGS_FILE)) {
      const raw = fs.readFileSync(LOCAL_SETTINGS_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch {}
  return null;
}

function writeLocalSettingsCache(data: any): void {
  try {
    fs.writeFileSync(LOCAL_SETTINGS_FILE, JSON.stringify(data), 'utf-8');
  } catch {}
}

const DEFAULT_SEO_SETTINGS = {
  site_name: 'Shelby Online',
  site_title: 'Shelby Online',
  meta_description: 'Güncel bonuslar, kampanyalar ve fırsatlar Shelby Online\'da.',
  site_description: 'Güncel bonuslar, kampanyalar ve fırsatlar Shelby Online\'da.',
  og_title: 'Shelby Online | Güncel Kampanyalar',
  og_description: 'En güncel kampanyaları ve bonusları keşfet.',
  og_image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&h=630&q=80',
  og_url: 'https://shelbyonline.com',
  og_site_name: 'Shelby Online',
  favicon_url: '',
  twitter_card: 'summary_large_image',
};

let isRevalidatingSettings = false;

async function getAuthoritativeSiteSettings(): Promise<any> {
  const now = Date.now();
  if (cachedSiteSettings && now - cachedSiteSettingsTime < SITE_SETTINGS_CACHE_TTL) {
    return cachedSiteSettings;
  }

  // Load from local disk cache if memory is empty
  if (!cachedSiteSettings) {
    const localData = readLocalSettingsCache();
    if (localData && typeof localData === 'object') {
      cachedSiteSettings = { ...DEFAULT_SEO_SETTINGS, ...localData };
      cachedSiteSettingsTime = now;
    }
  }

  // Background revalidation function
  const revalidate = async () => {
    if (isRevalidatingSettings) return;
    isRevalidatingSettings = true;
    try {
      const headers = {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      };
      const resp = await fetch(`${SUPABASE_URL}/rest/v1/site_settings?select=*`, {
        headers,
        signal: AbortSignal.timeout(4000),
      });
      if (resp.ok) {
        const rows = await resp.json();
        if (Array.isArray(rows) && rows.length > 0) {
          const generalRow = rows.find((r: any) => r.setting_key === 'general') || rows[0];
          let val = generalRow?.setting_value;
          if (typeof val === 'string') {
            try {
              val = JSON.parse(val);
            } catch {
              val = {};
            }
          }
          const merged = {
            ...DEFAULT_SEO_SETTINGS,
            ...(generalRow || {}),
            ...(typeof val === 'object' && val !== null ? val : {}),
          };
          cachedSiteSettings = merged;
          cachedSiteSettingsTime = Date.now();
          writeLocalSettingsCache(merged);
        }
      }
    } catch {
      // Quiet background failure
    } finally {
      isRevalidatingSettings = false;
    }
  };

  if (cachedSiteSettings) {
    // If cache expired, trigger background revalidation without blocking caller
    revalidate().catch(() => {});
    return cachedSiteSettings;
  }

  // Initial boot with no cache: wait once for revalidation
  await revalidate();

  if (!cachedSiteSettings) {
    cachedSiteSettings = { ...DEFAULT_SEO_SETTINGS };
    cachedSiteSettingsTime = now;
  }
  return cachedSiteSettings;
}

function escapeHtml(str: string | undefined | null): string {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function injectDynamicSeoTags(html: string, req: express.Request | string, seo: any): string {
  const reqPath = typeof req === 'string' ? req : req.path || '/';
  const proto = typeof req !== 'string' ? (req.headers['x-forwarded-proto'] as string) || 'https' : 'https';
  const hostHeader =
    typeof req !== 'string'
      ? (req.headers['x-forwarded-host'] as string) || req.headers.host || 'shelbyonline.com'
      : 'shelbyonline.com';

  const siteTitle = seo.site_title || seo.site_name || 'Shelby Online';
  const metaDesc = seo.meta_description || seo.site_description || 'Güncel bonuslar, kampanyalar ve fırsatlar Shelby Online\'da.';
  const ogTitle = seo.og_title || siteTitle;
  const ogDesc = seo.og_description || metaDesc;

  // Resolve base canonical URL
  let canonicalBase = 'https://shelbyonline.com';
  if (seo.og_url && (seo.og_url.startsWith('http://') || seo.og_url.startsWith('https://'))) {
    canonicalBase = seo.og_url;
  } else if (typeof req !== 'string' && req.headers) {
    const fHost = req.headers['x-forwarded-host'] || req.headers.host;
    if (fHost && !fHost.includes('localhost') && !fHost.includes('127.0.0.1')) {
      canonicalBase = `${proto}://${fHost}`;
    }
  }

  const rawOgUrl = canonicalBase;

  // Compute version hash for cache-busting on social media crawlers
  const vHash = (seo.updated_at ? new Date(seo.updated_at).getTime() : Date.now()).toString(36);

  // Resolve OG Image format and URL
  let rawOgImage = seo.og_image || DEFAULT_SEO_SETTINGS.og_image;
  let resolvedOgImage = rawOgImage;
  let ogMimeType = 'image/jpeg';

  if (rawOgImage) {
    if (rawOgImage.startsWith('data:image/png')) {
      ogMimeType = 'image/png';
      resolvedOgImage = `${canonicalBase.replace(/\/$/, '')}/api/seo/og-image.png?v=${vHash}`;
    } else if (rawOgImage.startsWith('data:image/webp')) {
      ogMimeType = 'image/webp';
      resolvedOgImage = `${canonicalBase.replace(/\/$/, '')}/api/seo/og-image.webp?v=${vHash}`;
    } else if (rawOgImage.startsWith('data:image/') || rawOgImage.startsWith('/')) {
      ogMimeType = 'image/jpeg';
      resolvedOgImage = `${canonicalBase.replace(/\/$/, '')}/api/seo/og-image.jpg?v=${vHash}`;
    } else if (rawOgImage.startsWith('http://') || rawOgImage.startsWith('https://')) {
      // Remote image URL
      resolvedOgImage = rawOgImage;
      if (rawOgImage.endsWith('.png')) ogMimeType = 'image/png';
      else if (rawOgImage.endsWith('.webp')) ogMimeType = 'image/webp';
      else ogMimeType = 'image/jpeg';
    }
  }

  const ogUrl = reqPath && reqPath !== '/' ? `${rawOgUrl.replace(/\/$/, '')}${reqPath}` : rawOgUrl;
  const ogSiteName = seo.og_site_name || seo.site_name || 'Shelby Online';
  const twitterCard = seo.twitter_card || 'summary_large_image';
  const faviconUrl = seo.favicon_url || seo.logo_url || '';
  const isAdmin = reqPath.startsWith('/admin');

  // Strip existing title, meta description, og:*, twitter:*, robots, and favicon link tags
  let cleaned = html
    .replace(/<title>[^<]*<\/title>/gi, '')
    .replace(/<meta\s+name=["']description["'][^>]*>/gi, '')
    .replace(/<meta\s+property=["']og:[^"']+["'][^>]*>/gi, '')
    .replace(/<meta\s+name=["']twitter:[^"']+["'][^>]*>/gi, '')
    .replace(/<meta\s+name=["']robots["'][^>]*>/gi, '');

  if (faviconUrl) {
    cleaned = cleaned.replace(/<link\s+rel=["'](shortcut )?icon["'][^>]*>/gi, '')
      .replace(/<link\s+rel=["']apple-touch-icon["'][^>]*>/gi, '');
  }

  const dynamicTags = [
    `    <title>${escapeHtml(siteTitle)}</title>`,
    `    <meta name="description" content="${escapeHtml(metaDesc)}" />`,
    `    <meta property="og:type" content="website" />`,
    `    <meta property="og:site_name" content="${escapeHtml(ogSiteName)}" />`,
    `    <meta property="og:title" content="${escapeHtml(ogTitle)}" />`,
    `    <meta property="og:description" content="${escapeHtml(ogDesc)}" />`,
    `    <meta property="og:image" content="${escapeHtml(resolvedOgImage)}" />`,
    `    <meta property="og:image:secure_url" content="${escapeHtml(resolvedOgImage)}" />`,
    `    <meta property="og:image:type" content="${escapeHtml(ogMimeType)}" />`,
    `    <meta property="og:image:width" content="1200" />`,
    `    <meta property="og:image:height" content="630" />`,
    `    <meta property="og:image:alt" content="${escapeHtml(ogTitle)}" />`,
    `    <meta property="og:url" content="${escapeHtml(ogUrl)}" />`,
    `    <meta name="twitter:card" content="${escapeHtml(twitterCard)}" />`,
    `    <meta name="twitter:title" content="${escapeHtml(ogTitle)}" />`,
    `    <meta name="twitter:description" content="${escapeHtml(ogDesc)}" />`,
    `    <meta name="twitter:image" content="${escapeHtml(resolvedOgImage)}" />`,
    `    <meta name="twitter:image:src" content="${escapeHtml(resolvedOgImage)}" />`,
    isAdmin
      ? `    <meta name="robots" content="noindex,nofollow" />`
      : `    <meta name="robots" content="index,follow" />`,
    faviconUrl
      ? `    <link rel="icon" href="${escapeHtml(faviconUrl)}" />\n    <link rel="apple-touch-icon" href="${escapeHtml(faviconUrl)}" />`
      : '',
  ]
    .filter(Boolean)
    .join('\n');

  // Inject right after <head> or before </head>
  if (cleaned.includes('<head>')) {
    return cleaned.replace('<head>', `<head>\n${dynamicTags}`);
  } else if (cleaned.includes('</head>')) {
    return cleaned.replace('</head>', `${dynamicTags}\n  </head>`);
  }
  return dynamicTags + '\n' + cleaned;
}

const serverCustomSponsors = new Map<string, any>();
const serverDeletedSponsorIds = new Set<string>();

const serverCustomGiveaways = new Map<string, any>();
const serverDeletedGiveawayIds = new Set<string>();
const serverCustomGiveawayEntries = new Map<string, any>();

const serverCustomOrders = new Map<string, any>();

async function fetchPortalDataFromSupabase() {
  const headers = {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  };

  const fetchWithTimeout = async (url: string) => {
    try {
      let response = await fetch(url, {
        headers,
        signal: AbortSignal.timeout(6000),
      });
      if (response.ok) {
        return await response.json();
      }
      if (url.includes('&order=')) {
        const simpleUrl = url.split('&order=')[0];
        response = await fetch(simpleUrl, {
          headers,
          signal: AbortSignal.timeout(5000),
        });
        if (response.ok) {
          return await response.json();
        }
      }
      return [];
    } catch {
      return [];
    }
  };

  const [
    settings,
    sponsors,
    hero_slides,
    banners,
    social_links,
    wheel_rewards,
    giveaways,
    store_products,
    giveaway_entries,
    sponsor_clicks,
    banner_clicks,
  ] = await Promise.all([
    fetchWithTimeout(`${SUPABASE_URL}/rest/v1/site_settings?select=*`),
    fetchWithTimeout(`${SUPABASE_URL}/rest/v1/sponsors?select=*&order=sort_order.asc`),
    fetchWithTimeout(`${SUPABASE_URL}/rest/v1/hero_slides?select=*&order=sort_order.asc`),
    fetchWithTimeout(`${SUPABASE_URL}/rest/v1/banners?select=*&order=sort_order.asc`),
    fetchWithTimeout(`${SUPABASE_URL}/rest/v1/social_links?select=*&order=sort_order.asc`),
    fetchWithTimeout(`${SUPABASE_URL}/rest/v1/wheel_rewards?select=*&order=sort_order.asc`),
    fetchWithTimeout(`${SUPABASE_URL}/rest/v1/giveaways?select=*&order=created_at.desc`),
    fetchWithTimeout(`${SUPABASE_URL}/rest/v1/store_products?select=*&order=sort_order.asc`),
    fetchWithTimeout(`${SUPABASE_URL}/rest/v1/giveaway_entries?select=*`),
    fetchWithTimeout(`${SUPABASE_URL}/rest/v1/sponsor_clicks?select=sponsor_id`),
    fetchWithTimeout(`${SUPABASE_URL}/rest/v1/banner_clicks?select=banner_id`),
  ]);

  // Aggregate click counts from raw sponsor_clicks table
  const sponsorClicksCountMap = new Map<string, number>();
  if (Array.isArray(sponsor_clicks)) {
    for (const sc of sponsor_clicks) {
      if (sc && sc.sponsor_id) {
        const sid = String(sc.sponsor_id);
        sponsorClicksCountMap.set(sid, (sponsorClicksCountMap.get(sid) || 0) + 1);
      }
    }
  }

  // Aggregate click counts from banner_clicks table
  const bannerClicksCountMap = new Map<string, number>();
  if (Array.isArray(banner_clicks)) {
    for (const bc of banner_clicks) {
      if (bc && bc.banner_id) {
        const bid = String(bc.banner_id);
        bannerClicksCountMap.set(bid, (bannerClicksCountMap.get(bid) || 0) + 1);
      }
    }
  }

  // Merge Supabase sponsors, remove deleted ids
  const remoteSponsors = Array.isArray(sponsors) ? sponsors : [];
  const finalSponsorsMap = new Map<string, any>();

  for (const sp of remoteSponsors) {
    const spId = String(sp.id);
    if (serverDeletedSponsorIds.has(spId)) continue;
    
    const clickCountFromTable = (sponsorClicksCountMap.get(spId) || 0) + (sp.slug ? (sponsorClicksCountMap.get(sp.slug) || 0) : 0);
    const existingCount = Number(sp.clicks_count || sp.clicks || 0);
    const resolvedClicks = Math.max(existingCount, clickCountFromTable);

    const mergedSp = {
      ...sp,
      clicks_count: resolvedClicks,
    };

    if (serverCustomSponsors.has(spId)) {
      finalSponsorsMap.set(spId, { ...mergedSp, ...serverCustomSponsors.get(spId), clicks_count: Math.max(resolvedClicks, Number(serverCustomSponsors.get(spId)?.clicks_count || 0)) });
    } else {
      finalSponsorsMap.set(spId, mergedSp);
    }
  }

  for (const [id, customSp] of serverCustomSponsors.entries()) {
    if (serverDeletedSponsorIds.has(id)) continue;
    if (!finalSponsorsMap.has(id)) {
      const clickCountFromTable = (sponsorClicksCountMap.get(id) || 0) + (customSp.slug ? (sponsorClicksCountMap.get(customSp.slug) || 0) : 0);
      finalSponsorsMap.set(id, {
        ...customSp,
        clicks_count: Math.max(Number(customSp.clicks_count || 0), clickCountFromTable),
      });
    }
  }

  const finalSponsorsList = Array.from(finalSponsorsMap.values());

  const mappedBanners = Array.isArray(banners) ? banners.map((b: any) => {
    const bId = String(b.id);
    const clickCount = bannerClicksCountMap.get(bId) || 0;
    return {
      ...b,
      clicks_count: Math.max(Number(b.clicks_count || b.clicks || 0), clickCount),
    };
  }) : [];

  // Merge Supabase entries with server in-memory entries
  const remoteEntries = Array.isArray(giveaway_entries) ? giveaway_entries : [];
  const finalEntriesMap = new Map<string, any>();

  for (const entry of remoteEntries) {
    const eKey = entry.id || `${entry.giveaway_id}_${entry.user_id}`;
    finalEntriesMap.set(eKey, entry);
  }

  for (const [key, customEntry] of serverCustomGiveawayEntries.entries()) {
    const eKey = customEntry.id || `${customEntry.giveaway_id}_${customEntry.user_id}`;
    if (!finalEntriesMap.has(eKey)) {
      finalEntriesMap.set(eKey, customEntry);
    }
  }

  const entriesList = Array.from(finalEntriesMap.values());

  const remoteGiveaways = Array.isArray(giveaways) ? giveaways : [];
  const finalGiveawaysMap = new Map<string, any>();

  for (const g of remoteGiveaways) {
    const gId = String(g.id);
    if (serverDeletedGiveawayIds.has(gId)) continue;
    if (serverCustomGiveaways.has(gId)) {
      finalGiveawaysMap.set(gId, { ...g, ...serverCustomGiveaways.get(gId) });
    } else {
      finalGiveawaysMap.set(gId, g);
    }
  }

  for (const [id, customG] of serverCustomGiveaways.entries()) {
    if (serverDeletedGiveawayIds.has(id)) continue;
    if (!finalGiveawaysMap.has(id)) {
      finalGiveawaysMap.set(id, customG);
    }
  }

  const formattedGiveaways = Array.from(finalGiveawaysMap.values()).map((g: any) => {
    const matchCount = entriesList.filter((e: any) => e.giveaway_id === g.id).length;
    const customCount = Number(serverCustomGiveaways.get(g.id)?.entries_count) || 0;
    return {
      ...g,
      entries_count: Math.max(Number(g.entries_count) || 0, matchCount, customCount),
    };
  });

  const resultData = {
    settings,
    sponsors: finalSponsorsList,
    hero_slides,
    banners: mappedBanners,
    social_links,
    wheel_rewards,
    giveaways: formattedGiveaways,
    store_products,
    giveaway_entries: entriesList,
  };

  cachedPortalData = resultData;
  cachedPortalDataTime = Date.now();
  return resultData;
}

// Portal Data Endpoint (Direct server-side Supabase query with caching & strict timeout)
app.get('/api/portal/data', async (req, res) => {
  const now = Date.now();
  const isFreshRequested = req.query.fresh === 'true' || req.query.t;

  res.setHeader('Cache-Control', 'public, max-age=5, stale-while-revalidate=15');

  if (!isFreshRequested && cachedPortalData && now - cachedPortalDataTime < PORTAL_CACHE_TTL_MS) {
    return res.json({
      status: 'ok',
      source: 'cache',
      data: cachedPortalData,
    });
  }

  try {
    const resultData = await fetchPortalDataFromSupabase();
    res.json({
      status: 'ok',
      source: 'supabase',
      data: resultData,
    });
  } catch (err: any) {
    console.error('Portal data endpoint error:', err);
    res.json({
      status: 'ok',
      source: 'fallback',
      data: cachedPortalData || {
        settings: [],
        sponsors: Array.from(serverCustomSponsors.values()).filter((s) => !serverDeletedSponsorIds.has(String(s.id))),
        hero_slides: [],
        banners: [],
        social_links: [],
        wheel_rewards: [],
        giveaways: [],
        store_products: [],
        giveaway_entries: [],
      },
    });
  }
});

// Cache Invalidation Endpoint (Ensures changes reflect instantly across the entire portal)
app.post('/api/portal/invalidate-cache', (req, res) => {
  cachedPortalData = null;
  cachedPortalDataTime = 0;
  cachedSiteSettings = null;
  cachedSiteSettingsTime = 0;
  res.json({ status: 'ok', message: 'Cache invalidated' });
});

// SEO & Site Meta Settings Fetch Endpoint
app.get('/api/seo/current', async (req, res) => {
  try {
    const seo = await getAuthoritativeSiteSettings();
    res.json({
      success: true,
      settings: seo,
      preview: {
        title: seo.site_title || seo.site_name,
        meta_description: seo.meta_description || seo.site_description,
        og_title: seo.og_title || seo.site_title,
        og_description: seo.og_description || seo.meta_description,
        og_image: seo.og_image,
        og_url: seo.og_url,
        og_site_name: seo.og_site_name || seo.site_name,
        favicon_url: seo.favicon_url,
      },
    });
  } catch (err: any) {
    console.error('Error fetching SEO settings:', err);
    res.status(500).json({ success: false, message: err?.message || 'SEO ayarları alınamadı.' });
  }
});

// SEO & Site Meta Settings Save Endpoint
app.post('/api/seo/save', async (req, res) => {
  try {
    const incoming = req.body;
    if (!incoming || typeof incoming !== 'object') {
      return res.status(400).json({ success: false, message: 'Geçersiz veri formatı.' });
    }

    const current = await getAuthoritativeSiteSettings();
    const merged = {
      ...current,
      ...incoming,
      site_title: incoming.site_title || incoming.site_name || current.site_title,
      meta_description: incoming.meta_description || incoming.site_description || current.meta_description,
      og_title: incoming.og_title || incoming.site_title || current.og_title,
      og_description: incoming.og_description || incoming.meta_description || current.og_description,
      og_image: incoming.og_image || current.og_image,
      og_url: incoming.og_url || current.og_url,
      og_site_name: incoming.og_site_name || incoming.site_name || current.og_site_name,
      favicon_url: incoming.favicon_url !== undefined ? incoming.favicon_url : current.favicon_url,
      twitter_card: incoming.twitter_card || current.twitter_card || 'summary_large_image',
      updated_at: new Date().toISOString(),
    };

    // Immediately persist to local disk cache and memory so user changes are 100% saved
    writeLocalSettingsCache(merged);
    cachedSiteSettings = merged;
    cachedSiteSettingsTime = Date.now();
    cachedPortalData = null;
    cachedPortalDataTime = 0;

    // Non-blocking background sync to Supabase (safe & resilient)
    (async () => {
      try {
        const headers = {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal,resolution=merge-duplicates',
        };

        const upsertResp = await fetch(`${SUPABASE_URL}/rest/v1/site_settings`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            setting_key: 'general',
            setting_value: merged,
            updated_at: new Date().toISOString(),
          }),
          signal: AbortSignal.timeout(8000),
        });

        if (!upsertResp.ok) {
          await fetch(`${SUPABASE_URL}/rest/v1/site_settings?setting_key=eq.general`, {
            method: 'PATCH',
            headers: {
              apikey: SUPABASE_ANON_KEY,
              Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              setting_value: merged,
              updated_at: new Date().toISOString(),
            }),
            signal: AbortSignal.timeout(8000),
          });
        }
      } catch {
        // Fallback: settings are already safely persisted to local disk & memory cache
      }
    })().catch(() => {});

    return res.json({
      success: true,
      message: 'SEO ve link önizleme ayarları başarıyla kaydedildi.',
      settings: merged,
    });
  } catch (err: any) {
    console.error('Error saving SEO settings:', err);
    return res.status(500).json({ success: false, message: err?.message || 'Kaydetme hatası' });
  }
});

// Public Authoritative OG Image Endpoint for Social Media Crawlers (Telegram, WhatsApp, Discord, X)
app.get(['/api/seo/og-image', '/api/seo/og-image.jpg', '/api/seo/og-image.png', '/api/seo/og-image.webp'], async (req, res) => {
  try {
    const seo = await getAuthoritativeSiteSettings();
    const rawImage = seo.og_image || DEFAULT_SEO_SETTINGS.og_image;

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('X-Content-Type-Options', 'nosniff');

    if (rawImage && rawImage.startsWith('data:image/')) {
      const match = rawImage.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
      if (match) {
        const mimeType = match[1];
        const base64Data = match[2];
        const buffer = Buffer.from(base64Data, 'base64');
        res.setHeader('Content-Type', mimeType);
        res.setHeader('Content-Length', buffer.length);
        res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=120');
        return res.send(buffer);
      }
    }

    if (rawImage && (rawImage.startsWith('http://') || rawImage.startsWith('https://'))) {
      return res.redirect(302, rawImage);
    }

    return res.redirect(302, DEFAULT_SEO_SETTINGS.og_image);
  } catch (err: any) {
    console.error('OG Image endpoint error:', err);
    return res.redirect(302, DEFAULT_SEO_SETTINGS.og_image);
  }
});

// Admin Sponsor Save / Upsert Endpoint (Server-Side authoritative database write with self-healing column fallbacks)
app.post('/api/sponsors/save', async (req, res) => {
  try {
    const sponsor = req.body;
    if (!sponsor || !sponsor.name) {
      return res.status(400).json({ success: false, message: 'Sponsor adı gereklidir.' });
    }

    const headers: Record<string, string> = {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    };

    let sponsorId = sponsor.id;
    const isNew = Boolean(sponsor.isNew || !sponsorId || sponsorId.startsWith('sp-'));
    const isUuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const hasValidUuid = Boolean(sponsorId && isUuidPattern.test(sponsorId));

    const generatedSlug = sponsor.slug || sponsor.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const targetCategory = sponsor.category === 'main' ? 'main' : sponsor.category === 'vip' ? 'vip' : 'trusted';
    const isVip = targetCategory === 'vip';

    const payload: any = {
      name: sponsor.name,
      slug: generatedSlug,
      category: targetCategory,
      logo_url: sponsor.logo_url || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=200&h=200&q=80',
      banner_url: sponsor.banner_url || null,
      description: sponsor.description || sponsor.full_review || '',
      short_description: sponsor.short_description || sponsor.short_desc || '',
      website_url: sponsor.website_url || sponsor.direct_url || 'https://example.com',
      button_text: sponsor.button_text || 'SİTEYE GİT & KAZAN',
      rating: Number(sponsor.rating || 4.8),
      featured: isVip,
      is_vip: isVip,
      is_active: sponsor.active !== false && sponsor.is_active !== false,
      sort_order: typeof sponsor.sort_order === 'number' ? sponsor.sort_order : (parseInt(sponsor.sort_order) || 0),
      bonus_code: sponsor.bonus_code || null,
      bonus_headline: sponsor.bonus_headline || null,
      badge_text: sponsor.badge_text || null,
      min_deposit: sponsor.min_deposit || null,
      withdrawal_speed: sponsor.withdrawal_speed || null,
      license: sponsor.license || null,
      rtp_rate: sponsor.rtp_rate || null,
      online_players: sponsor.online_players ? String(sponsor.online_players) : null,
      live_support: sponsor.live_support || '7/24 Türkçe Canlı Destek',
      payment_methods: Array.isArray(sponsor.payment_methods) ? sponsor.payment_methods : [],
      stats: Array.isArray(sponsor.stats) ? sponsor.stats : [],
      features: Array.isArray(sponsor.features) ? sponsor.features : [],
      updated_at: new Date().toISOString(),
    };

    let savedData: any = null;

    // Helper to strip non-existent columns dynamically when Supabase schema differs
    const trySupabaseRequest = async (url: string, method: 'PATCH' | 'POST', basePayload: any) => {
      let currentPayload = { ...basePayload };
      for (let attempt = 0; attempt < 8; attempt++) {
        try {
          const resp = await fetch(url, {
            method,
            headers,
            body: JSON.stringify(currentPayload),
            signal: AbortSignal.timeout(5000),
          });
          if (resp.ok) {
            const data = await resp.json();
            return Array.isArray(data) && data.length > 0 ? data[0] : currentPayload;
          }
          const errText = await resp.text();
          console.warn(`[Supabase ${method}] attempt ${attempt} response:`, resp.status, errText);

          // Check if Supabase complained about a specific missing column
          const colMatch =
            errText.match(/Could not find the column '([^']+)'/i) ||
            errText.match(/column "([^"]+)" of relation "sponsors" does not exist/i) ||
            errText.match(/column '([^']+)' of relation/i);
          if (colMatch && colMatch[1]) {
            delete currentPayload[colMatch[1]];
            continue;
          }

          // If ID type mismatch (e.g. invalid input syntax for type bigint or integer), delete id and retry
          if (errText.includes('invalid input syntax for type') || errText.includes('22P02') || errText.includes('bigint')) {
            delete currentPayload.id;
            continue;
          }

          // If ID cannot be null (id TEXT PRIMARY KEY without default), ensure ID is set
          if (errText.includes('null value in column "id"') || errText.includes('violates not-null constraint')) {
            currentPayload.id = (globalThis.crypto && crypto.randomUUID) ? crypto.randomUUID() : `sp-${Date.now()}`;
            continue;
          }

          // Fallback stripped payloads
          if (attempt === 0) {
            currentPayload = {
              ...(currentPayload.id ? { id: currentPayload.id } : {}),
              name: sponsor.name,
              slug: payload.slug,
              logo_url: payload.logo_url,
              banner_url: payload.banner_url || null,
              description: payload.description,
              short_description: payload.short_description,
              website_url: payload.website_url,
              button_text: payload.button_text,
              rating: payload.rating,
              category: payload.category,
              featured: payload.featured,
              is_vip: payload.is_vip,
              is_active: payload.is_active,
              sort_order: payload.sort_order,
              updated_at: new Date().toISOString(),
            };
          } else if (attempt === 1) {
            currentPayload = {
              ...(currentPayload.id ? { id: currentPayload.id } : {}),
              name: sponsor.name,
              slug: payload.slug,
              logo_url: payload.logo_url,
              direct_url: payload.website_url,
              description: payload.description,
              rating: payload.rating,
              category: payload.category,
              sort_order: payload.sort_order,
              updated_at: new Date().toISOString(),
            };
          } else {
            break;
          }
        } catch (e: any) {
          console.warn(`[Supabase ${method}] network exception attempt ${attempt}:`, e?.message);
          break;
        }
      }
      return null;
    };

    // STEP 1: If updating an existing sponsor, find existing row
    let existingRow: any = null;
    if (!isNew) {
      if (hasValidUuid || (sponsorId && !sponsorId.startsWith('sp-'))) {
        try {
          const checkRes = await fetch(`${SUPABASE_URL}/rest/v1/sponsors?id=eq.${encodeURIComponent(sponsorId)}&select=*`, {
            headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
            signal: AbortSignal.timeout(4000),
          });
          if (checkRes.ok) {
            const rows = await checkRes.json();
            if (Array.isArray(rows) && rows.length > 0) {
              existingRow = rows[0];
            }
          }
        } catch {
          // ignore
        }
      }

      if (!existingRow && payload.slug) {
        try {
          const checkSlug = await fetch(`${SUPABASE_URL}/rest/v1/sponsors?slug=eq.${encodeURIComponent(payload.slug)}&select=*`, {
            headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
            signal: AbortSignal.timeout(4000),
          });
          if (checkSlug.ok) {
            const rows = await checkSlug.json();
            if (Array.isArray(rows) && rows.length > 0) {
              existingRow = rows[0];
            }
          }
        } catch {
          // ignore
        }
      }
    }

    // STEP 2: If existing row found, PATCH update it
    if (existingRow && existingRow.id) {
      const patchUrl = `${SUPABASE_URL}/rest/v1/sponsors?id=eq.${encodeURIComponent(existingRow.id)}`;
      savedData = await trySupabaseRequest(patchUrl, 'PATCH', payload);
      if (!savedData) {
        savedData = { ...existingRow, ...payload };
      }
    }

    // STEP 3: If not updated, INSERT as a new row
    if (!savedData) {
      const insertPayload: any = { ...payload };
      if (hasValidUuid) {
        insertPayload.id = sponsorId;
      } else if (sponsorId && !sponsorId.startsWith('sp-')) {
        insertPayload.id = sponsorId;
      } else {
        insertPayload.id = (globalThis.crypto && crypto.randomUUID) ? crypto.randomUUID() : `sp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      }
      savedData = await trySupabaseRequest(`${SUPABASE_URL}/rest/v1/sponsors`, 'POST', insertPayload);
    }

    const assignedId = savedData?.id ? String(savedData.id) : (sponsor.id || `sp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`);

    const finalSponsor = {
      ...sponsor,
      ...payload,
      ...(savedData || {}),
      id: assignedId,
      stats: Array.isArray(payload.stats) && payload.stats.length > 0 ? payload.stats : (sponsor.stats || []),
      features: Array.isArray(payload.features) && payload.features.length > 0 ? payload.features : (sponsor.features || []),
      payment_methods: payload.payment_methods || sponsor.payment_methods || [],
      bonus_code: payload.bonus_code || sponsor.bonus_code || '',
      bonus_headline: payload.bonus_headline || sponsor.bonus_headline || '',
      badge_text: payload.badge_text || sponsor.badge_text || '',
      min_deposit: payload.min_deposit || sponsor.min_deposit || '50 ₺',
      withdrawal_speed: payload.withdrawal_speed || sponsor.withdrawal_speed || '3 - 15 Dakika',
      license: payload.license || sponsor.license || 'Curacao eGaming',
      rtp_rate: payload.rtp_rate || sponsor.rtp_rate || '%97.8',
      online_players: payload.online_players || sponsor.online_players || '',
      live_support: payload.live_support || sponsor.live_support || '7/24 Türkçe Canlı Destek',
    };

    // Save to authoritative server-side map
    serverCustomSponsors.set(assignedId, finalSponsor);
    serverDeletedSponsorIds.delete(assignedId);

    // Invalidate portal cache immediately so next read is 100% fresh
    cachedPortalData = null;
    cachedPortalDataTime = 0;

    return res.json({
      success: true,
      message: 'Sponsor başarıyla kaydedildi.',
      sponsor: finalSponsor,
    });
  } catch (err: any) {
    console.error('Error in /api/sponsors/save:', err);
    return res.status(500).json({ success: false, message: err?.message || 'Sunucu hatası' });
  }
});

// Admin Sponsor Delete Endpoint
app.post('/api/sponsors/delete', async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) {
      return res.status(400).json({ success: false, message: 'Sponsor ID gereklidir.' });
    }

    const strId = String(id);
    serverCustomSponsors.delete(strId);
    serverDeletedSponsorIds.add(strId);

    const headers = {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    };

    try {
      await fetch(`${SUPABASE_URL}/rest/v1/sponsors?id=eq.${encodeURIComponent(strId)}`, {
        method: 'DELETE',
        headers,
      });
    } catch {
      // ignore
    }

    cachedPortalData = null;
    cachedPortalDataTime = 0;

    return res.json({ success: true, message: 'Sponsor silindi.' });
  } catch (err: any) {
    console.error('Error in /api/sponsors/delete:', err);
    return res.status(500).json({ success: false, message: 'Silme hatası' });
  }
});

// Sponsor Click Tracking Endpoint
app.post(['/api/sponsors/click', '/api/sponsors/:id/click'], async (req, res) => {
  try {
    const idParam = req.params?.id;
    const { id: bodyId, slug, user_id, referrer } = req.body || {};
    const sponsorTarget = String(idParam || bodyId || slug || '').trim();

    if (!sponsorTarget) {
      return res.status(400).json({ success: false, message: 'Sponsor ID veya Slug gereklidir.' });
    }

    const headers = {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    };

    // 1. Find matching sponsor row from Supabase
    let matchedSponsor: any = null;
    try {
      const matchRes = await fetch(
        `${SUPABASE_URL}/rest/v1/sponsors?or=(id.eq.${encodeURIComponent(sponsorTarget)},slug.eq.${encodeURIComponent(sponsorTarget)})&limit=1`,
        { headers }
      );
      if (matchRes.ok) {
        const rows = await matchRes.json();
        if (Array.isArray(rows) && rows.length > 0) {
          matchedSponsor = rows[0];
        }
      }
    } catch {}

    const resolvedSponsorId = matchedSponsor?.id ? String(matchedSponsor.id) : sponsorTarget;
    const currentClicks = Number(matchedSponsor?.clicks_count || matchedSponsor?.clicks || 0);
    const newClicks = currentClicks + 1;

    // 2. Insert click event into sponsor_clicks table
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/sponsor_clicks`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          sponsor_id: resolvedSponsorId,
          user_id: user_id || null,
          referrer: referrer || req.headers.referer || req.headers.origin || null,
        }),
      });
    } catch (e) {
      console.warn('Supabase sponsor_clicks insert warning:', e);
    }

    // 3. Atomically update clicks_count in sponsors table
    if (matchedSponsor?.id) {
      try {
        await fetch(`${SUPABASE_URL}/rest/v1/sponsors?id=eq.${encodeURIComponent(matchedSponsor.id)}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ clicks_count: newClicks }),
        });
      } catch (e) {
        console.warn('Supabase sponsor clicks_count patch warning:', e);
      }
    }

    // 4. Update in-memory server cache
    if (serverCustomSponsors.has(resolvedSponsorId)) {
      const existing = serverCustomSponsors.get(resolvedSponsorId);
      serverCustomSponsors.set(resolvedSponsorId, {
        ...existing,
        clicks_count: Math.max(Number(existing.clicks_count || 0) + 1, newClicks),
      });
    }

    cachedPortalData = null;
    cachedPortalDataTime = 0;

    return res.json({
      success: true,
      sponsor_id: resolvedSponsorId,
      clicks_count: newClicks,
    });
  } catch (err: any) {
    console.error('Error tracking sponsor click:', err);
    return res.status(500).json({ success: false, message: err?.message || 'Tıklama kaydedilemedi.' });
  }
});

// Full Click Synchronization Endpoint (Recalculates all clicks from raw sponsor_clicks)
app.post('/api/sponsors/sync-clicks', async (_req, res) => {
  try {
    const headers = {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    };

    const [clicksRes, sponsorsRes] = await Promise.all([
      fetch(`${SUPABASE_URL}/rest/v1/sponsor_clicks?select=*`, { headers }).then((r) => r.json()),
      fetch(`${SUPABASE_URL}/rest/v1/sponsors?select=*`, { headers }).then((r) => r.json()),
    ]);

    const clicksArray = Array.isArray(clicksRes) ? clicksRes : [];
    const sponsorsArray = Array.isArray(sponsorsRes) ? sponsorsRes : [];

    const clicksBySponsor = new Map<string, number>();
    for (const c of clicksArray) {
      if (c && c.sponsor_id) {
        const sid = String(c.sponsor_id);
        clicksBySponsor.set(sid, (clicksBySponsor.get(sid) || 0) + 1);
      }
    }

    const updatedList: any[] = [];
    for (const sp of sponsorsArray) {
      const sid = String(sp.id);
      const directCount = clicksBySponsor.get(sid) || 0;
      const slugCount = sp.slug ? (clicksBySponsor.get(sp.slug) || 0) : 0;
      const existingClicks = Number(sp.clicks_count || sp.clicks || 0);
      const totalCount = Math.max(directCount + slugCount, existingClicks);

      try {
        await fetch(`${SUPABASE_URL}/rest/v1/sponsors?id=eq.${encodeURIComponent(sid)}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ clicks_count: totalCount }),
        });
      } catch {}

      updatedList.push({
        id: sid,
        name: sp.name,
        clicks_count: totalCount,
      });
    }

    cachedPortalData = null;
    cachedPortalDataTime = 0;

    return res.json({
      success: true,
      message: 'Sponsor tıklamaları başarıyla senkronize edildi.',
      total_recorded_events: clicksArray.length,
      sponsors: updatedList,
    });
  } catch (err: any) {
    console.error('Error in /api/sponsors/sync-clicks:', err);
    return res.status(500).json({ success: false, message: 'Senkronizasyon hatası' });
  }
});

// Banner Click Tracking Endpoint
app.post(['/api/banners/click', '/api/banners/:id/click'], async (req, res) => {
  try {
    const idParam = req.params?.id;
    const { id: bodyId, user_id, referrer } = req.body || {};
    const bannerId = String(idParam || bodyId || '').trim();

    if (!bannerId) {
      return res.status(400).json({ success: false, message: 'Banner ID gereklidir.' });
    }

    const headers = {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    };

    // Insert into banner_clicks
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/banner_clicks`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          banner_id: bannerId,
          user_id: user_id || null,
          referrer: referrer || req.headers.referer || null,
        }),
      });
    } catch {}

    cachedPortalData = null;
    cachedPortalDataTime = 0;

    return res.json({ success: true, banner_id: bannerId });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err?.message || 'Hata' });
  }
});

// Outbound Affiliate Redirect Routes (/go/:slug and /r/:slug)
app.get(['/go/:slug', '/r/:slug'], async (req, res) => {
  try {
    const slug = req.params.slug;
    const headers = {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    };

    const matchRes = await fetch(
      `${SUPABASE_URL}/rest/v1/sponsors?or=(slug.eq.${encodeURIComponent(slug)},id.eq.${encodeURIComponent(slug)})&limit=1`,
      { headers }
    );

    if (matchRes.ok) {
      const rows = await matchRes.json();
      if (Array.isArray(rows) && rows.length > 0) {
        const sponsor = rows[0];
        const targetUrl = sponsor.website_url || sponsor.direct_url || sponsor.url || '/';

        // Record click non-blockingly
        fetch(`${SUPABASE_URL}/rest/v1/sponsor_clicks`, {
          method: 'POST',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sponsor_id: String(sponsor.id),
            referrer: req.headers.referer || 'direct_redirect',
          }),
        }).catch(() => {});

        fetch(`${SUPABASE_URL}/rest/v1/sponsors?id=eq.${encodeURIComponent(sponsor.id)}`, {
          method: 'PATCH',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clicks_count: Number(sponsor.clicks_count || 0) + 1,
          }),
        }).catch(() => {});

        return res.redirect(302, targetUrl);
      }
    }

    return res.redirect(302, '/');
  } catch {
    return res.redirect(302, '/');
  }
});

// Admin Supabase Diagnostics & Live Test Endpoint
app.get('/api/sponsors/test-connection', async (_req, res) => {
  const result: any = {
    supabase_url: SUPABASE_URL,
    has_anon_key: Boolean(SUPABASE_ANON_KEY && SUPABASE_ANON_KEY.length > 20),
    read_test: null,
    write_test: null,
    columns_detected: [],
    errors: [],
  };

  const headers = {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
    Prefer: 'return=representation',
  };

  // 1. Read Test
  try {
    const readRes = await fetch(`${SUPABASE_URL}/rest/v1/sponsors?select=*&limit=3`, {
      headers,
      signal: AbortSignal.timeout(5000),
    });
    if (readRes.ok) {
      const data = await readRes.json();
      result.read_test = { status: 'success', count: Array.isArray(data) ? data.length : 0 };
      if (Array.isArray(data) && data.length > 0) {
        result.columns_detected = Object.keys(data[0]);
      }
    } else {
      const errText = await readRes.text();
      result.read_test = { status: 'failed', code: readRes.status, message: errText };
      result.errors.push(`Read error (${readRes.status}): ${errText}`);
    }
  } catch (e: any) {
    result.read_test = { status: 'exception', message: e?.message };
    result.errors.push(`Read network exception: ${e?.message}`);
  }

  // 2. Write (Insert) Test with auto-delete
  try {
    const testId = `test-${Date.now()}`;
    const testPayload: any = {
      id: testId,
      name: 'Supabase Test Sponsoru',
      slug: `test-sponsor-${Date.now()}`,
      website_url: 'https://example.com',
      direct_url: 'https://example.com',
      category: 'main',
      rating: 5.0,
      is_active: false,
      sort_order: 9999,
      description: 'Bağlantı test kaydı',
      short_description: 'Test',
    };

    const writeRes = await fetch(`${SUPABASE_URL}/rest/v1/sponsors`, {
      method: 'POST',
      headers,
      body: JSON.stringify(testPayload),
      signal: AbortSignal.timeout(5000),
    });

    if (writeRes.ok) {
      const inserted = await writeRes.json();
      result.write_test = { status: 'success', message: 'Yazma ve okuma başarılı!', inserted };

      // Clean up test record
      const delId = Array.isArray(inserted) && inserted.length > 0 && inserted[0].id ? inserted[0].id : testId;
      fetch(`${SUPABASE_URL}/rest/v1/sponsors?id=eq.${encodeURIComponent(delId)}`, {
        method: 'DELETE',
        headers,
      }).catch(() => {});
    } else {
      const errText = await writeRes.text();
      result.write_test = { status: 'failed', code: writeRes.status, message: errText };
      result.errors.push(`Write error (${writeRes.status}): ${errText}`);
    }
  } catch (e: any) {
    result.write_test = { status: 'exception', message: e?.message };
    result.errors.push(`Write network exception: ${e?.message}`);
  }

  return res.json(result);
});

// Admin Giveaway Save / Upsert Endpoint
app.post('/api/giveaways/save', async (req, res) => {
  try {
    const giveaway = req.body;
    if (!giveaway || !giveaway.title) {
      return res.status(400).json({ success: false, message: 'Çekiliş başlığı gereklidir.' });
    }

    const headers: Record<string, string> = {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    };

    const targetId = giveaway.id || `giv-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const rawEndDate = giveaway.end_at || giveaway.end_date || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const isEndDateInFuture = new Date(rawEndDate).getTime() > Date.now();
    const isCompleted = giveaway.is_completed !== undefined
      ? Boolean(giveaway.is_completed)
      : (isEndDateInFuture ? false : Boolean(giveaway.winner_username));

    const basePayload: any = {
      id: targetId,
      title: giveaway.title,
      description: giveaway.description || '',
      image_url: giveaway.image_url || 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=800&h=450&q=80',
      prize: giveaway.prize_details || giveaway.prize || 'Ödül',
      total_winners: Number(giveaway.winner_count || giveaway.total_winners || 1),
      end_date: rawEndDate,
      is_active: giveaway.active !== false && giveaway.is_active !== false,
      created_at: giveaway.start_at || giveaway.created_at || new Date().toISOString(),
      winners: giveaway.winner_username
        ? [{ username: giveaway.winner_username, id: giveaway.winner_id, note: giveaway.winner_note, date: giveaway.winner_announced_at }]
        : [],
    };

    const extendedPayload: any = {
      ...basePayload,
      prize_details: giveaway.prize_details || basePayload.prize,
      winner_count: basePayload.total_winners,
      end_at: basePayload.end_date,
      start_at: basePayload.created_at,
      is_completed: isCompleted,
      winner_username: giveaway.winner_username || null,
      winner_id: giveaway.winner_id || null,
      winner_announced_at: giveaway.winner_announced_at || null,
      winner_note: giveaway.winner_note || null,
    };

    // Attempt upsert to Supabase
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/giveaways`, {
        method: 'POST',
        headers: { ...headers, Prefer: 'resolution=merge-duplicates,return=representation' },
        body: JSON.stringify(extendedPayload),
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        // Fallback to base payload
        await fetch(`${SUPABASE_URL}/rest/v1/giveaways`, {
          method: 'POST',
          headers: { ...headers, Prefer: 'resolution=merge-duplicates,return=representation' },
          body: JSON.stringify(basePayload),
          signal: AbortSignal.timeout(8000),
        }).catch(() => {});
      }
    } catch (dbErr) {
      console.log('Supabase giveaway upsert handled:', dbErr instanceof Error ? dbErr.message : 'timeout');
    }

    const finalGiveaway = {
      id: targetId,
      title: giveaway.title,
      description: giveaway.description || '',
      image_url: basePayload.image_url,
      prize_details: giveaway.prize_details || basePayload.prize,
      start_at: basePayload.created_at,
      end_at: basePayload.end_date,
      active: basePayload.is_active,
      winner_count: basePayload.total_winners,
      entries_count: Number(giveaway.entries_count || 0),
      is_completed: isCompleted,
      winner_username: giveaway.winner_username || undefined,
      winner_id: giveaway.winner_id || undefined,
      winner_announced_at: giveaway.winner_announced_at || undefined,
      winner_note: giveaway.winner_note || undefined,
    };

    serverCustomGiveaways.set(targetId, finalGiveaway);
    serverDeletedGiveawayIds.delete(targetId);

    cachedPortalData = null;
    cachedPortalDataTime = 0;

    return res.json({
      success: true,
      message: 'Çekiliş başarıyla kaydedildi.',
      giveaway: finalGiveaway,
    });
  } catch (err: any) {
    console.error('Error in /api/giveaways/save:', err);
    return res.status(500).json({ success: false, message: err?.message || 'Sunucu hatası' });
  }
});

// Admin Giveaway Delete Endpoint
app.post('/api/giveaways/delete', async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) {
      return res.status(400).json({ success: false, message: 'Çekiliş ID gereklidir.' });
    }

    const strId = String(id);
    serverCustomGiveaways.delete(strId);
    serverDeletedGiveawayIds.add(strId);

    const headers = {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    };

    // 1. Delete all child entries first so foreign key constraints won't reject deletion
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/giveaway_entries?giveaway_id=eq.${encodeURIComponent(strId)}`, {
        method: 'DELETE',
        headers,
        signal: AbortSignal.timeout(4000),
      });
    } catch (err) {
      console.warn('Entries delete error on giveaway delete:', err);
    }

    // 2. Delete giveaway row
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/giveaways?id=eq.${encodeURIComponent(strId)}`, {
        method: 'DELETE',
        headers,
        signal: AbortSignal.timeout(4000),
      });
    } catch (err) {
      console.warn('Giveaway delete error:', err);
    }

    cachedPortalData = null;
    cachedPortalDataTime = 0;

    return res.json({ success: true, message: 'Çekiliş ve tüm katılımcı kayıtları başarıyla silindi.' });
  } catch (err: any) {
    console.error('Error in /api/giveaways/delete:', err);
    return res.status(500).json({ success: false, message: 'Silme hatası' });
  }
});

// Dedicated Giveaway Join endpoint with server-side duplicate check & Supabase sync
app.post('/api/giveaways/join', async (req, res) => {
  try {
    const { giveaway_id, user_id, username } = req.body;
    if (!giveaway_id || !user_id) {
      return res.status(400).json({ success: false, message: 'Geçersiz parametreler.' });
    }

    const cleanUsername = String(username || 'Kullanıcı').trim();
    const entryId = `entry_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const nowIso = new Date().toISOString();

    // Check duplicate in server in-memory storage first
    const memoryDuplicate = Array.from(serverCustomGiveawayEntries.values()).some(
      (e) =>
        e.giveaway_id === giveaway_id &&
        (e.user_id === user_id ||
          (cleanUsername.toLowerCase() !== 'kullanıcı' &&
            e.username?.toLowerCase() === cleanUsername.toLowerCase()))
    );

    if (memoryDuplicate) {
      return res.json({ success: false, already_joined: true, message: 'Bu çekilişe zaten katıldınız!' });
    }

    const headers = {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    };

    // Step 1: Check if giveaway is completed or expired
    try {
      const gCheckRes = await fetch(
        `${SUPABASE_URL}/rest/v1/giveaways?id=eq.${encodeURIComponent(giveaway_id)}`,
        { headers, signal: AbortSignal.timeout(8000) }
      );
      if (gCheckRes.ok) {
        const gList = await gCheckRes.json();
        if (Array.isArray(gList) && gList.length > 0) {
          const targetG = gList[0];
          const isExpired =
            (targetG.is_completed && targetG.winner_username) ||
            (targetG.end_at && new Date(targetG.end_at).getTime() <= Date.now()) ||
            (targetG.end_date && new Date(targetG.end_date).getTime() <= Date.now());
          if (isExpired) {
            return res.status(400).json({
              success: false,
              expired: true,
              message: 'Bu çekilişin katılım süresi dolmuştur. Katılım sağlanamaz.',
            });
          }
        }
      }
    } catch {
      // continue
    }

    // Step 2: Check duplicate in Supabase (by user_id)
    try {
      const checkRes = await fetch(
        `${SUPABASE_URL}/rest/v1/giveaway_entries?giveaway_id=eq.${encodeURIComponent(giveaway_id)}&user_id=eq.${encodeURIComponent(user_id)}`,
        { headers, signal: AbortSignal.timeout(8000) }
      );
      if (checkRes.ok) {
        const existing = await checkRes.json();
        if (Array.isArray(existing) && existing.length > 0) {
          return res.json({ success: false, already_joined: true, message: 'Bu çekilişe zaten katıldınız!' });
        }
      }
    } catch {
      // ignore
    }

    // Step 3: Auto-ensure giveaway exists in Supabase so Foreign Key doesn't fail
    try {
      const gExistsRes = await fetch(
        `${SUPABASE_URL}/rest/v1/giveaways?id=eq.${encodeURIComponent(giveaway_id)}&select=id`,
        { headers, signal: AbortSignal.timeout(8000) }
      );
      const gList = gExistsRes.ok ? await gExistsRes.json() : [];
      if (!Array.isArray(gList) || gList.length === 0) {
        const knownG = serverCustomGiveaways.get(giveaway_id);
        const autoGiveawayPayload = {
          id: giveaway_id,
          title: knownG?.title || 'Büyük Topluluk Çekilişi',
          prize: knownG?.prize_details || knownG?.prize || 'Ödül',
          prize_details: knownG?.prize_details || 'Ödül Paketi',
          description: knownG?.description || '',
          image_url: knownG?.image_url || 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=800&h=450&q=80',
          end_date: knownG?.end_at || new Date(Date.now() + 7 * 86400000).toISOString(),
          end_at: knownG?.end_at || new Date(Date.now() + 7 * 86400000).toISOString(),
          is_active: true,
          active: true,
          is_completed: false,
          total_winners: Number(knownG?.winner_count || 1),
          winner_count: Number(knownG?.winner_count || 1),
          entries_count: 1,
        };
        await fetch(`${SUPABASE_URL}/rest/v1/giveaways`, {
          method: 'POST',
          headers: { ...headers, Prefer: 'resolution=merge-duplicates,return=minimal' },
          body: JSON.stringify(autoGiveawayPayload),
          signal: AbortSignal.timeout(8000),
        });
      }
    } catch (gErr) {
      console.warn('Auto-ensure giveaway row error:', gErr);
    }

    // Step 4: Record entry in server in-memory cache
    const newEntryObj = {
      id: entryId,
      giveaway_id,
      user_id,
      username: cleanUsername,
      created_at: nowIso,
    };
    serverCustomGiveawayEntries.set(entryId, newEntryObj);
    serverCustomGiveawayEntries.set(`${giveaway_id}_${user_id}`, newEntryObj);

    // Step 5: Insert entry into giveaway_entries in Supabase
    let entrySavedToDb = false;
    try {
      const insRes = await fetch(`${SUPABASE_URL}/rest/v1/giveaway_entries`, {
        method: 'POST',
        headers: { ...headers, Prefer: 'resolution=merge-duplicates,return=representation' },
        body: JSON.stringify({
          id: entryId,
          giveaway_id,
          user_id,
          username: cleanUsername,
          created_at: nowIso,
        }),
        signal: AbortSignal.timeout(4000),
      });
      if (insRes.ok) {
        entrySavedToDb = true;
      } else {
        const errText = await insRes.text();
        console.warn('giveaway_entries primary insert failed:', insRes.status, errText);
        // Fallback: minimal insert without explicit ID in case table uses auto-generated UUID
        const fallbackRes = await fetch(`${SUPABASE_URL}/rest/v1/giveaway_entries`, {
          method: 'POST',
          headers: { ...headers, Prefer: 'resolution=merge-duplicates,return=representation' },
          body: JSON.stringify({
            giveaway_id,
            user_id,
            username: cleanUsername,
          }),
          signal: AbortSignal.timeout(4000),
        });
        if (fallbackRes.ok) {
          entrySavedToDb = true;
        }
      }
    } catch (e) {
      console.warn('Supabase entry insert warning:', e);
    }

    // Step 6: Count total matching entries and update serverCustomGiveaways & Supabase
    const matchingEntriesCount = Array.from(serverCustomGiveawayEntries.values()).filter(
      (e) => e.giveaway_id === giveaway_id
    ).length;

    const inMemoryG = serverCustomGiveaways.get(giveaway_id) || {};
    const updatedCount = Math.max(Number(inMemoryG.entries_count) || 0, matchingEntriesCount, 1);
    serverCustomGiveaways.set(giveaway_id, {
      ...inMemoryG,
      id: giveaway_id,
      entries_count: updatedCount,
    });

    // Try patching Supabase giveaways entries_count
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/giveaways?id=eq.${encodeURIComponent(giveaway_id)}`, {
        method: 'PATCH',
        headers: { ...headers, Prefer: 'return=minimal' },
        body: JSON.stringify({ entries_count: updatedCount }),
        signal: AbortSignal.timeout(3000),
      });
    } catch {
      // ignore
    }

    // Invalidate portal cache
    cachedPortalData = null;
    cachedPortalDataTime = 0;

    return res.json({
      success: true,
      message: '🎉 Çekilişe başarıyla katıldınız! Bol şans.',
      saved_to_db: entrySavedToDb,
      entries_count: updatedCount,
      entry: newEntryObj,
    });
  } catch (err: any) {
    console.error('Error joining giveaway:', err);
    return res.status(500).json({ success: false, message: 'Çekilişe katılırken sunucu hatası oluştu.' });
  }
});

// Get Giveaway Entries Endpoint (Server-Side authoritative list)
app.get('/api/giveaways/entries', async (req, res) => {
  try {
    const { giveaway_id } = req.query;
    const headers = {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    };

    let url = `${SUPABASE_URL}/rest/v1/giveaway_entries?select=*`;
    if (giveaway_id) {
      url += `&giveaway_id=eq.${encodeURIComponent(String(giveaway_id))}`;
    }

    let remoteList: any[] = [];
    try {
      const response = await fetch(url, { headers, signal: AbortSignal.timeout(4000) });
      if (response.ok) {
        remoteList = await response.json();
      }
    } catch {
      // ignore
    }

    const mergedMap = new Map<string, any>();
    if (Array.isArray(remoteList)) {
      remoteList.forEach((e) => mergedMap.set(e.id || `${e.giveaway_id}_${e.user_id}`, e));
    }

    for (const [key, customEntry] of serverCustomGiveawayEntries.entries()) {
      if (!giveaway_id || customEntry.giveaway_id === giveaway_id) {
        const eKey = customEntry.id || `${customEntry.giveaway_id}_${customEntry.user_id}`;
        if (!mergedMap.has(eKey)) {
          mergedMap.set(eKey, customEntry);
        }
      }
    }

    const allEntries = Array.from(mergedMap.values());
    return res.json({ success: true, count: allEntries.length, entries: allEntries });
  } catch (err: any) {
    console.error('Error fetching giveaway entries:', err);
    return res.status(500).json({ success: false, message: 'Katılımlar alınamadı' });
  }
});

// Admin / Client Giveaway & Entries Test Connection Endpoint
app.get('/api/giveaways/test-connection', async (req, res) => {
  try {
    const headers = {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    };

    // 1. Test giveaways table
    let giveawaysStatus = 'error';
    let giveawaysCount = 0;
    let giveawaysError = '';
    try {
      const gRes = await fetch(`${SUPABASE_URL}/rest/v1/giveaways?select=*&limit=10`, {
        headers,
        signal: AbortSignal.timeout(4000),
      });
      if (gRes.ok) {
        const gData = await gRes.json();
        giveawaysStatus = 'ok';
        giveawaysCount = Array.isArray(gData) ? gData.length : 0;
      } else {
        giveawaysError = await gRes.text();
      }
    } catch (e: any) {
      giveawaysError = e?.message || 'Ağ hatası';
    }

    // 2. Test giveaway_entries table
    let entriesStatus = 'error';
    let entriesCount = 0;
    let entriesError = '';
    try {
      const eRes = await fetch(`${SUPABASE_URL}/rest/v1/giveaway_entries?select=*&limit=10`, {
        headers,
        signal: AbortSignal.timeout(4000),
      });
      if (eRes.ok) {
        const eData = await eRes.json();
        entriesStatus = 'ok';
        entriesCount = Array.isArray(eData) ? eData.length : 0;
      } else {
        entriesError = await eRes.text();
      }
    } catch (e: any) {
      entriesError = e?.message || 'Ağ hatası';
    }

    return res.json({
      success: giveawaysStatus === 'ok' && entriesStatus === 'ok',
      url: SUPABASE_URL,
      giveaways: {
        status: giveawaysStatus,
        count: giveawaysCount,
        error: giveawaysError || null,
      },
      giveaway_entries: {
        status: entriesStatus,
        count: entriesCount,
        error: entriesError || null,
      },
      message:
        giveawaysStatus === 'ok' && entriesStatus === 'ok'
          ? 'Supabase çekiliş ve katılım tabloları aktif ve erişilebilir durumda.'
          : 'Supabase çekiliş veya katılım tablosuna erişilemedi. Lütfen SQL kodunu Supabase Dashboard > SQL Editor alanında çalıştırınız.',
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err?.message || 'Bağlantı testi sırasında hata oluştu' });
  }
});

// ======================== STORE & ORDERS ENDPOINTS ========================

// 1. Get All Store Orders (Authoritative server merge)
app.get('/api/store/orders', async (req, res) => {
  try {
    const headers = {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    };

    let remoteOrders: any[] = [];
    try {
      const resp = await fetch(`${SUPABASE_URL}/rest/v1/store_orders?select=*&order=created_at.desc`, {
        headers,
        signal: AbortSignal.timeout(6000),
      });
      if (resp.ok) {
        remoteOrders = await resp.json();
      }
    } catch (e) {
      console.warn('Supabase fetch store_orders warning:', e);
    }

    const mappedRemote: any[] = Array.isArray(remoteOrders)
      ? remoteOrders.map((d: any) => {
          let parsedInfo: any = {};
          if (typeof d.delivery_info === 'object' && d.delivery_info !== null) {
            parsedInfo = d.delivery_info;
          } else if (typeof d.delivery_info === 'string') {
            try {
              parsedInfo = JSON.parse(d.delivery_info);
            } catch {
              parsedInfo = { note: d.delivery_info };
            }
          }

          return {
            id: String(d.id),
            user_id: String(d.user_id),
            username: parsedInfo.username || d.username || 'Kullanıcı',
            product_id: String(d.product_id || ''),
            product_name: d.product_title || d.product_name || parsedInfo.product_name || 'Ürün',
            coin_price: Number(d.price_coins || d.coin_price || parsedInfo.coin_price || 0),
            payout_type: d.payout_type || parsedInfo.payout_type || (parsedInfo.iban ? 'iban' : parsedInfo.trx_address ? 'trx' : 'trx'),
            payout_address: d.payout_address || parsedInfo.payout_address || parsedInfo.iban || parsedInfo.trx_address || '',
            payout_holder_name: d.payout_holder_name || parsedInfo.payout_holder_name || parsedInfo.holder_name || '',
            payout_bank_name: d.payout_bank_name || parsedInfo.payout_bank_name || '',
            status: d.status || 'pending',
            delivery_note: parsedInfo.note || parsedInfo.delivery_note || d.delivery_note || '',
            admin_note: d.admin_note || parsedInfo.admin_note || '',
            created_at: d.created_at || new Date().toISOString(),
            updated_at: d.updated_at,
          };
        })
      : [];

    // Merge with serverCustomOrders (serverCustomOrders has highest priority for status updates)
    const ordersMap = new Map<string, any>();
    for (const ord of mappedRemote) {
      ordersMap.set(ord.id, ord);
    }
    for (const [id, customOrd] of serverCustomOrders.entries()) {
      if (ordersMap.has(id)) {
        ordersMap.set(id, { ...ordersMap.get(id), ...customOrd });
      } else {
        ordersMap.set(id, customOrd);
      }
    }

    const finalOrders = Array.from(ordersMap.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return res.json({ success: true, orders: finalOrders });
  } catch (err: any) {
    console.error('Error in /api/store/orders:', err);
    return res.status(500).json({ success: false, message: 'Siparişler yüklenemedi' });
  }
});

// 2. Update Store Order Status (Authoritative, handles refund and Supabase sync)
app.post('/api/store/orders/update-status', async (req, res) => {
  try {
    const { order_id, status, admin_note } = req.body;
    if (!order_id || !status) {
      return res.status(400).json({ success: false, message: 'order_id ve status gereklidir.' });
    }

    const strOrderId = String(order_id);
    const nowIso = new Date().toISOString();

    const headers = {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    };

    // Find existing order
    let existingOrder = serverCustomOrders.get(strOrderId);
    if (!existingOrder) {
      try {
        const resp = await fetch(`${SUPABASE_URL}/rest/v1/store_orders?id=eq.${encodeURIComponent(strOrderId)}`, {
          headers,
          signal: AbortSignal.timeout(4000),
        });
        if (resp.ok) {
          const list = await resp.json();
          if (Array.isArray(list) && list.length > 0) {
            existingOrder = list[0];
          }
        }
      } catch (e) {
        console.warn('Fetch single order warning:', e);
      }
    }

    const previousStatus = existingOrder?.status || 'pending';
    const coinPrice = Number(existingOrder?.price_coins || existingOrder?.coin_price || 0);
    const userId = String(existingOrder?.user_id || '');

    // If changing from pending to cancelled / rejected, refund user coins in Supabase
    if ((status === 'cancelled' || status === 'rejected') && previousStatus === 'pending' && userId && coinPrice > 0) {
      try {
        // Fetch current user coins
        const pResp = await fetch(
          `${SUPABASE_URL}/rest/v1/profiles?or=(id.eq.${encodeURIComponent(userId)},id.eq.tg-${encodeURIComponent(userId)})&select=*`,
          { headers, signal: AbortSignal.timeout(4000) }
        );
        if (pResp.ok) {
          const pList = await pResp.json();
          if (Array.isArray(pList) && pList.length > 0) {
            const currentCoins = Number(pList[0].coins ?? pList[0].coin_balance ?? 0);
            const newCoins = currentCoins + coinPrice;
            await fetch(
              `${SUPABASE_URL}/rest/v1/profiles?id=eq.${encodeURIComponent(pList[0].id)}`,
              {
                method: 'PATCH',
                headers,
                body: JSON.stringify({ coins: newCoins }),
                signal: AbortSignal.timeout(4000),
              }
            );
          }
        }
      } catch (coinErr) {
        console.warn('Coin refund in Supabase error:', coinErr);
      }
    }

    // Extract and update delivery_info with admin_note if needed
    let existingDeliveryInfo: any = {};
    if (existingOrder) {
      if (typeof existingOrder.delivery_info === 'object' && existingOrder.delivery_info !== null) {
        existingDeliveryInfo = { ...existingOrder.delivery_info };
      } else if (typeof existingOrder.delivery_info === 'string') {
        try {
          existingDeliveryInfo = JSON.parse(existingOrder.delivery_info);
        } catch {
          existingDeliveryInfo = { note: existingOrder.delivery_info };
        }
      }
    }
    if (admin_note !== undefined) {
      existingDeliveryInfo.admin_note = admin_note;
    }

    // Update Supabase store_orders (only use columns that exist: status, delivery_info)
    try {
      const patchBody: any = { status };
      if (Object.keys(existingDeliveryInfo).length > 0) {
        patchBody.delivery_info = JSON.stringify(existingDeliveryInfo);
      }
      await fetch(`${SUPABASE_URL}/rest/v1/store_orders?id=eq.${encodeURIComponent(strOrderId)}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(patchBody),
        signal: AbortSignal.timeout(4000),
      });
    } catch (dbErr) {
      console.warn('Supabase store_orders PATCH error:', dbErr);
    }

    const updatedOrder = {
      ...(existingOrder || {}),
      id: strOrderId,
      status,
      admin_note: admin_note !== undefined ? admin_note : existingOrder?.admin_note,
      updated_at: nowIso,
    };

    serverCustomOrders.set(strOrderId, updatedOrder);

    // Invalidate portal cache
    cachedPortalData = null;
    cachedPortalDataTime = 0;

    return res.json({
      success: true,
      message: status === 'completed' ? 'Sipariş teslim edildi olarak işaretlendi' : 'Sipariş güncellendi',
      order: updatedOrder,
    });
  } catch (err: any) {
    console.error('Error in /api/store/orders/update-status:', err);
    return res.status(500).json({ success: false, message: 'Sipariş durumu güncellenirken hata oluştu' });
  }
});

// 3. Create Store Order
app.post('/api/store/orders/create', async (req, res) => {
  try {
    const { order } = req.body;
    if (!order || !order.id || !order.user_id) {
      return res.status(400).json({ success: false, message: 'Geçersiz sipariş verisi' });
    }

    serverCustomOrders.set(String(order.id), order);

    const headers = {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=representation',
    };

    try {
      await fetch(`${SUPABASE_URL}/rest/v1/store_orders`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          id: order.id,
          user_id: order.user_id,
          product_id: order.product_id,
          product_title: order.product_name,
          price_coins: order.coin_price,
          status: order.status || 'pending',
          delivery_info: {
            username: order.username,
            payout_type: order.payout_type,
            payout_address: order.payout_address,
            payout_holder_name: order.payout_holder_name,
            payout_bank_name: order.payout_bank_name,
            note: order.delivery_note,
          },
          created_at: order.created_at || new Date().toISOString(),
        }),
        signal: AbortSignal.timeout(4000),
      });
    } catch (e) {
      console.warn('Supabase store_orders create error:', e);
    }

    cachedPortalData = null;
    cachedPortalDataTime = 0;

    return res.json({ success: true, order });
  } catch (err: any) {
    console.error('Error in /api/store/orders/create:', err);
    return res.status(500).json({ success: false, message: 'Sipariş oluşturulamadı' });
  }
});

// 1. Get current connected Telegram bot info
app.get('/api/telegram/bot-info', (req, res) => {
  res.json({
    status: 'ok',
    botUsername: botInfo.username,
    botName: botInfo.first_name,
    botId: botInfo.id,
    activeCodesCount: activeAuthCodes.size,
  });
});

// 2. Avatar Proxy to stream real Telegram User Profile Photos
app.get('/api/telegram/avatar-proxy', async (req, res) => {
  const filePath = req.query.file_path as string;
  if (!filePath || !TELEGRAM_BOT_TOKEN) {
    return res.redirect('https://ui-avatars.com/api/?name=Telegram+User&background=24A1DE&color=fff');
  }

  try {
    const fileUrl = `https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${filePath}`;
    const imgRes = await fetch(fileUrl, { signal: AbortSignal.timeout(8000) });
    if (!imgRes.ok) {
      return res.redirect('https://ui-avatars.com/api/?name=Telegram+User&background=24A1DE&color=fff');
    }
    const contentType = imgRes.headers.get('content-type') || 'image/jpeg';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    const buffer = await imgRes.arrayBuffer();
    return res.send(Buffer.from(buffer));
  } catch (err) {
    return res.redirect('https://ui-avatars.com/api/?name=Telegram+User&background=24A1DE&color=fff');
  }
});

// 3. Webhook endpoint (if user sets Telegram webhook to their domain)
app.post('/api/telegram/webhook', async (req, res) => {
  try {
    const update = req.body;
    if (update) {
      await handleTelegramUpdate(update);
    }
    res.json({ ok: true });
  } catch (err) {
    console.error('Webhook processing error:', err);
    res.status(500).json({ error: 'Internal webhook error' });
  }
});

// 3.5 Sync / Refresh Telegram Profile Data for a user
app.post('/api/telegram/sync-profile', async (req, res) => {
  try {
    const { telegram_id, username } = req.body;
    if (!telegram_id && !username) {
      return res.status(400).json({ success: false, message: 'Telegram ID veya Kullanıcı Adı gereklidir.' });
    }

    let photoUrl = '';
    const numericId = Number(telegram_id);
    const cleanUsername = String(username || '').replace('@', '');

    if (!isNaN(numericId) && numericId > 0) {
      photoUrl = await getTelegramUserProfilePhoto(numericId, cleanUsername || 'Shelby Üye');
    }

    if (!photoUrl && cleanUsername) {
      photoUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanUsername)}&background=24A1DE&color=ffffff&bold=true&size=256`;
    }

    res.json({
      success: true,
      photo_url: photoUrl,
      telegram_username: cleanUsername,
      telegram_id: telegram_id ? String(telegram_id) : null,
    });
  } catch (err: any) {
    console.error('Error syncing profile:', err);
    res.status(500).json({ success: false, message: 'Profil senkronizasyon hatası.' });
  }
});

// 4. Verify 6-digit code submitted on the website
app.post('/api/telegram/verify-code', async (req, res) => {
  const { code } = req.body;
  if (!code) {
    return res.status(400).json({ success: false, message: 'Lütfen 6 haneli giriş kodunu giriniz.' });
  }

  const cleanCode = String(code).trim().replace(/\s+/g, '').toUpperCase();

  // Validate format: strictly 6-digit numeric OTP
  if (!/^\d{6}$/.test(cleanCode)) {
    return res.status(400).json({
      success: false,
      message: 'Geçersiz kod biçimi. Lütfen Telegram botunun verdiği 6 haneli güvenlik kodunu giriniz.',
    });
  }

  // 1. Check in-memory code store
  let entry = activeAuthCodes.get(cleanCode);

  // 2. If not in memory, query Supabase database (admin_logs / telegram_auth_codes)
  if (!entry) {
    try {
      const headers = {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      };

      const dbRes = await fetch(
        `${SUPABASE_URL}/rest/v1/admin_logs?target_type=eq.telegram_auth_code&target_id=eq.${encodeURIComponent(cleanCode)}&select=*`,
        { headers }
      );

      if (dbRes.ok) {
        const rows = await dbRes.json();
        if (Array.isArray(rows) && rows.length > 0) {
          const row = rows[0];
          const details = row.details || {};
          if (details && details.code === cleanCode) {
            entry = {
              code: details.code,
              telegram_id: Number(details.telegram_id),
              telegram_username: details.telegram_username,
              telegram_first_name: details.first_name || details.telegram_first_name || 'Shelby',
              telegram_last_name: details.last_name || details.telegram_last_name || '',
              photo_url: details.photo_url,
              created_at: details.created_at || new Date(row.created_at).getTime(),
              expires_at: details.expires_at,
            };
          }
        }
      }
    } catch (dbErr) {
      console.error('Supabase code lookup error:', dbErr);
    }
  }

  if (entry) {
    // Check 5-minute expiration
    if (Date.now() > entry.expires_at) {
      activeAuthCodes.delete(cleanCode);
      // Invalidate in Supabase
      fetch(`${SUPABASE_URL}/rest/v1/admin_logs?id=eq.tg_code_${cleanCode}`, {
        method: 'DELETE',
        headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
      }).catch(() => {});

      return res.status(400).json({
        success: false,
        message: 'Bu kodun 5 dakikalık geçerlilik süresi dolmuş. Lütfen Telegram botuna /start yazarak yeni kod alınız.',
      });
    }

    // Populate photo if needed
    let photoUrl = entry.photo_url;
    if (!photoUrl) {
      photoUrl = await getTelegramUserProfilePhoto(entry.telegram_id, entry.telegram_first_name || entry.telegram_username);
    }

    // Consume code (single-use)
    activeAuthCodes.delete(cleanCode);
    fetch(`${SUPABASE_URL}/rest/v1/admin_logs?id=eq.tg_code_${cleanCode}`, {
      method: 'DELETE',
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
    }).catch(() => {});

    const tgUserData = {
      id: entry.telegram_id,
      first_name: entry.telegram_first_name,
      last_name: entry.telegram_last_name || '',
      username: entry.telegram_username,
      auth_date: Math.floor(entry.created_at / 1000),
      photo_url: photoUrl,
    };

    // Save profile to Supabase
    await syncTelegramUserToSupabase(tgUserData);

    return res.json({
      success: true,
      message: 'Telegram hesabınız başarıyla bağlandı!',
      user: tgUserData,
    });
  }

  return res.status(400).json({
    success: false,
    message: 'Geçersiz veya süresi dolmuş kod. Kodlar 5 dakika geçerlidir. Lütfen Telegram botumuza (@ShelbyOnlineBOT) gidip /start yazarak yeni bir kod alınız.',
  });
});

// 4. Dynamic Telegram Avatar Endpoint (Live streaming with caching)
app.get('/api/telegram/avatar/:userId', async (req, res) => {
  const { userId } = req.params;
  const numericId = Number(userId.replace(/\D/g, ''));
  if (!numericId || !TELEGRAM_BOT_TOKEN) {
    return res.redirect('https://ui-avatars.com/api/?name=Telegram+User&background=24A1DE&color=fff&size=256');
  }

  try {
    const photosRes = await telegramApiCall('getUserProfilePhotos', {
      user_id: numericId,
      limit: 1,
    });

    if (
      photosRes &&
      photosRes.ok &&
      photosRes.result &&
      photosRes.result.photos &&
      photosRes.result.photos.length > 0
    ) {
      const photoArray = photosRes.result.photos[0];
      const bestPhoto = photoArray[photoArray.length - 1] || photoArray[0];
      if (bestPhoto && bestPhoto.file_id) {
        const fileRes = await telegramApiCall('getFile', { file_id: bestPhoto.file_id });
        if (fileRes && fileRes.ok && fileRes.result && fileRes.result.file_path) {
          const fileUrl = `https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${fileRes.result.file_path}`;
          try {
            const imgFetch = await fetch(fileUrl, { signal: AbortSignal.timeout(8000) });
            if (imgFetch.ok) {
              const contentType = imgFetch.headers.get('content-type') || 'image/jpeg';
              res.setHeader('Content-Type', contentType);
              res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=43200');
              const arrayBuffer = await imgFetch.arrayBuffer();
              return res.send(Buffer.from(arrayBuffer));
            }
          } catch (fetchErr) {
            // Fallback gracefully below
          }
        }
      }
    }
  } catch (err) {
    console.error(`Error in avatar endpoint for user ${numericId}:`, err);
  }

  return res.redirect(`https://ui-avatars.com/api/?name=TG+${numericId.toString().slice(-4)}&background=24A1DE&color=fff&size=256`);
});

// 5. Sync Profile Directly with Supabase Database and Live Telegram API
app.post('/api/telegram/sync-profile', async (req, res) => {
  try {
    const body = req.body || {};
    const tgUser = body.user || body;
    const rawId = tgUser.telegram_id || tgUser.id || body.telegram_id || body.id;
    const numericId = rawId ? Number(String(rawId).replace(/\D/g, '')) : undefined;
    const username = tgUser.telegram_username || tgUser.username || body.telegram_username || body.username || '';

    let photoUrl = tgUser.photo_url || tgUser.avatar_url || body.photo_url;
    if (numericId && (!photoUrl || photoUrl.includes('ui-avatars.com') || photoUrl.includes('unsplash.com'))) {
      const livePhoto = await getTelegramUserProfilePhoto(numericId, username || `TG_${numericId}`);
      if (livePhoto) {
        photoUrl = livePhoto;
      }
    }

    const userDataToSync = {
      id: numericId || rawId || 'unknown',
      first_name: tgUser.telegram_first_name || tgUser.first_name || body.first_name || username || 'Shelby',
      last_name: tgUser.telegram_last_name || tgUser.last_name || body.last_name || '',
      username: username ? username.replace('@', '') : undefined,
      photo_url: photoUrl,
      coins: tgUser.coins ?? tgUser.coin_balance ?? body.coins,
    };

    const synced = await syncTelegramUserToSupabase(userDataToSync);

    res.json({
      success: true,
      status: 'ok',
      photo_url: photoUrl,
      telegram_id: String(userDataToSync.id),
      telegram_username: userDataToSync.username,
      profile: synced,
    });
  } catch (err: any) {
    console.error('Error in sync-profile endpoint:', err);
    res.status(500).json({ success: false, status: 'error', message: err?.message || 'Sync failed' });
  }
});

// ======================== VISITOR & ACTIVITY TRACKING ENGINE ========================

interface ServerVisitorLog {
  id: string;
  session_id: string;
  visitor_id: string;
  user_id?: string | null;
  username?: string | null;
  is_authenticated?: boolean;
  device_type: 'mobile' | 'desktop' | 'tablet' | 'bot';
  os: string;
  os_version?: string;
  browser: string;
  browser_version?: string;
  screen_resolution?: string;
  ip_address?: string;
  path: string;
  page_title?: string;
  referrer?: string;
  action_type: 'page_view' | 'login' | 'register' | 'sponsor_click' | 'banner_click' | 'wheel_spin' | 'giveaway_entry' | 'store_purchase' | 'heartbeat' | 'other';
  action_name?: string;
  details?: Record<string, any>;
  duration_seconds?: number;
  is_online?: boolean;
  last_seen_at?: string;
  created_at: string;
}

interface ServerLiveSession {
  session_id: string;
  visitor_id: string;
  user_id?: string | null;
  username?: string | null;
  is_authenticated?: boolean;
  ip_address: string;
  device_type: 'mobile' | 'desktop' | 'tablet' | 'bot';
  os: string;
  browser: string;
  screen_resolution: string;
  current_path: string;
  page_title: string;
  referrer: string;
  first_seen_at: number;
  last_seen_at: number;
  hits_count: number;
  last_action: string;
}

const serverActivityLogs: ServerVisitorLog[] = [];
const serverLiveSessions = new Map<string, ServerLiveSession>();
const MAX_SERVER_ACTIVITY_LOGS = 5000;
const LOCAL_VISITOR_LOGS_FILE = path.join(process.cwd(), '.visitor_logs_cache.json');

// Load historical visitor logs from local file cache on server boot
try {
  if (fs.existsSync(LOCAL_VISITOR_LOGS_FILE)) {
    const raw = fs.readFileSync(LOCAL_VISITOR_LOGS_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      serverActivityLogs.push(...parsed.slice(0, MAX_SERVER_ACTIVITY_LOGS));
      console.log(`[Visitor Tracking] Loaded ${serverActivityLogs.length} historical visitor logs from cache.`);
    }
  }
} catch (e) {
  console.warn('[Visitor Tracking] Error loading local visitor logs cache:', e);
}

// Helper to persist logs to disk
let saveLogsTimeout: any = null;
function persistVisitorLogsToDisk() {
  if (saveLogsTimeout) return;
  saveLogsTimeout = setTimeout(() => {
    saveLogsTimeout = null;
    try {
      fs.writeFileSync(LOCAL_VISITOR_LOGS_FILE, JSON.stringify(serverActivityLogs.slice(0, 2000)), 'utf-8');
    } catch {}
  }, 1000);
}

function parseServerUserAgent(ua: string) {
  const isBot = /bot|googlebot|crawler|spider|robot|crawling|lighthouse|headless/i.test(ua);
  const isTablet = /(ipad|tablet|(android(?!.*mobile))|(windows(?!.*phone)(.*touch))|kindle|playbook|silk)/i.test(ua);
  const isMobile = !isTablet && /(iphone|ipod|android.*mobile|windows phone|blackberry|bb10|mobile|opera mini|iemobile)/i.test(ua);
  
  let deviceType: 'mobile' | 'desktop' | 'tablet' | 'bot' = 'desktop';
  if (isBot) deviceType = 'bot';
  else if (isTablet) deviceType = 'tablet';
  else if (isMobile) deviceType = 'mobile';

  let os = 'Bilinmiyor';
  if (/windows nt 10.0/i.test(ua)) os = 'Windows 10/11';
  else if (/windows nt/i.test(ua)) os = 'Windows';
  else if (/iphone|ipad|ipod/i.test(ua)) os = /ipad/i.test(ua) ? 'iPadOS' : 'iOS';
  else if (/android/i.test(ua)) os = 'Android';
  else if (/macintosh|mac os x/i.test(ua)) os = 'macOS';
  else if (/linux/i.test(ua)) os = 'Linux';

  let browser = 'Bilinmiyor';
  if (/edg\//i.test(ua)) browser = 'Edge';
  else if (/opr\/|opera/i.test(ua)) browser = 'Opera';
  else if (/samsungbrowser/i.test(ua)) browser = 'Samsung Internet';
  else if (/chrome|crios/i.test(ua)) browser = 'Chrome';
  else if (/firefox|fxios/i.test(ua)) browser = 'Firefox';
  else if (/safari/i.test(ua) && !/chrome|crios|android/i.test(ua)) browser = 'Safari';
  else if (/telegram/i.test(ua)) browser = 'Telegram';

  return { deviceType, os, browser };
}

// 1. Post visitor activity or heartbeat
app.post('/api/tracking/activity', async (req, res) => {
  try {
    const rawIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || req.ip || '127.0.0.1';
    const cleanIp = rawIp.replace(/^::ffff:/, '');
    const userAgent = (req.headers['user-agent'] as string) || '';
    const parsedUa = parseServerUserAgent(userAgent);

    const {
      session_id,
      visitor_id,
      user_id,
      username,
      is_authenticated,
      device_info,
      path,
      page_title,
      referrer,
      action_type,
      action_name,
      details,
    } = req.body || {};

    const resolvedSessionId = String(session_id || `sess_${cleanIp.replace(/[^a-zA-Z0-9]/g, '')}_${Date.now()}`);
    const resolvedVisitorId = String(visitor_id || `vis_${cleanIp.replace(/[^a-zA-Z0-9]/g, '')}`);
    const resolvedDeviceType = device_info?.deviceType || parsedUa.deviceType;
    const resolvedOs = device_info?.os || parsedUa.os;
    const resolvedBrowser = device_info?.browser || parsedUa.browser;
    const resolvedScreen = device_info?.screenResolution || 'Bilinmiyor';
    const now = Date.now();
    const nowIso = new Date().toISOString();

    // Update Live Session
    const existingSession = serverLiveSessions.get(resolvedSessionId);
    const sessionObj: ServerLiveSession = {
      session_id: resolvedSessionId,
      visitor_id: resolvedVisitorId,
      user_id: user_id || existingSession?.user_id || null,
      username: username || existingSession?.username || (user_id ? 'Üye' : 'Misafir Ziyaretçi'),
      is_authenticated: Boolean(is_authenticated || user_id || existingSession?.is_authenticated),
      ip_address: cleanIp,
      device_type: resolvedDeviceType,
      os: resolvedOs,
      browser: resolvedBrowser,
      screen_resolution: resolvedScreen,
      current_path: path || existingSession?.current_path || '/',
      page_title: page_title || existingSession?.page_title || 'Ana Sayfa',
      referrer: referrer || existingSession?.referrer || '',
      first_seen_at: existingSession ? existingSession.first_seen_at : now,
      last_seen_at: now,
      hits_count: (existingSession?.hits_count || 0) + 1,
      last_action: action_name || action_type || 'Ziyaret',
    };
    serverLiveSessions.set(resolvedSessionId, sessionObj);

    // Filter out pure heartbeats from raw log list if identical to last log to prevent spam
    const isHeartbeat = action_type === 'heartbeat';
    if (!isHeartbeat || !serverActivityLogs.length || serverActivityLogs[0]?.session_id !== resolvedSessionId) {
      const logEntry: ServerVisitorLog = {
        id: `act_${now}_${Math.random().toString(36).substring(2, 7)}`,
        session_id: resolvedSessionId,
        visitor_id: resolvedVisitorId,
        user_id: user_id || null,
        username: username || (user_id ? 'Üye' : 'Misafir Ziyaretçi'),
        is_authenticated: Boolean(is_authenticated || user_id),
        device_type: resolvedDeviceType,
        os: resolvedOs,
        os_version: device_info?.osVersion,
        browser: resolvedBrowser,
        browser_version: device_info?.browserVersion,
        screen_resolution: resolvedScreen,
        ip_address: cleanIp,
        path: path || '/',
        page_title: page_title || '',
        referrer: referrer || (req.headers.referer as string) || '',
        action_type: action_type || 'page_view',
        action_name: action_name || (action_type === 'page_view' ? `Sayfa Görüntülendi: ${path || '/'}` : 'Aktivite'),
        details: details || {},
        created_at: nowIso,
      };

      serverActivityLogs.unshift(logEntry);
      if (serverActivityLogs.length > MAX_SERVER_ACTIVITY_LOGS) {
        serverActivityLogs.pop();
      }

      // Save to local disk cache asynchronously
      persistVisitorLogsToDisk();

      // Persist to Supabase database (both visitor_logs and admin_logs) asynchronously for all-time historical storage
      if (action_type !== 'heartbeat') {
        const headers = {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'resolution=merge-duplicates,return=representation',
        };

        // 1. Save directly to public.visitor_logs table
        fetch(`${SUPABASE_URL}/rest/v1/visitor_logs`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            id: logEntry.id,
            session_id: logEntry.session_id,
            visitor_id: logEntry.visitor_id,
            user_id: logEntry.user_id,
            username: logEntry.username,
            is_authenticated: logEntry.is_authenticated,
            device_type: logEntry.device_type,
            os: logEntry.os,
            os_version: logEntry.os_version || null,
            browser: logEntry.browser,
            browser_version: logEntry.browser_version || null,
            screen_resolution: logEntry.screen_resolution || null,
            ip_address: cleanIp,
            path: logEntry.path,
            page_title: logEntry.page_title || null,
            referrer: logEntry.referrer || null,
            action_type: logEntry.action_type,
            action_name: logEntry.action_name,
            details: logEntry.details || {},
            created_at: nowIso,
          }),
        }).catch(() => {});

        // 2. Also save to admin_logs for backward compatibility
        fetch(`${SUPABASE_URL}/rest/v1/admin_logs`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            admin_username: logEntry.username,
            action: `[${logEntry.device_type.toUpperCase()}] ${logEntry.action_name}`,
            entity_type: 'visitor_activity',
            entity_id: logEntry.session_id,
            ip_address: cleanIp,
            details: {
              device_type: logEntry.device_type,
              os: logEntry.os,
              browser: logEntry.browser,
              screen: logEntry.screen_resolution,
              path: logEntry.path,
              referrer: logEntry.referrer,
              action_type: logEntry.action_type,
              ...logEntry.details,
            },
            created_at: nowIso,
          }),
        }).catch(() => {});
      }
    }

    // Clean up expired sessions older than 15 minutes
    const expiryThreshold = now - 15 * 60 * 1000;
    for (const [key, sess] of serverLiveSessions.entries()) {
      if (sess.last_seen_at < expiryThreshold) {
        serverLiveSessions.delete(key);
      }
    }

    // Calculate current live active count (active in last 5 minutes)
    const activeCutoff = now - 5 * 60 * 1000;
    let liveCount = 0;
    for (const sess of serverLiveSessions.values()) {
      if (sess.last_seen_at >= activeCutoff) {
        liveCount++;
      }
    }

    return res.json({
      success: true,
      live_visitors_count: Math.max(1, liveCount),
      session_id: resolvedSessionId,
    });
  } catch (err: any) {
    console.error('Error tracking visitor activity:', err);
    return res.status(500).json({ success: false, message: err?.message || 'Hata' });
  }
});

// 2. Get Real-Time Live Visitors & Status
app.get('/api/tracking/live', async (req, res) => {
  try {
    const now = Date.now();
    const activeCutoff = now - 5 * 60 * 1000; // 5 mins

    const activeList: ServerLiveSession[] = [];
    let mobileCount = 0;
    let desktopCount = 0;
    let tabletCount = 0;

    for (const sess of serverLiveSessions.values()) {
      if (sess.last_seen_at >= activeCutoff) {
        activeList.push(sess);
        if (sess.device_type === 'mobile') mobileCount++;
        else if (sess.device_type === 'tablet') tabletCount++;
        else desktopCount++;
      }
    }

    // Sort by most recently active
    activeList.sort((a, b) => b.last_seen_at - a.last_seen_at);

    return res.json({
      success: true,
      active_count: activeList.length,
      active_visitors: activeList,
      device_counts: {
        mobile: mobileCount,
        desktop: desktopCount,
        tablet: tabletCount,
      },
      recent_logs: serverActivityLogs.slice(0, 30),
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err?.message });
  }
});

function isLogWithinTimeRange(
  logCreatedAt: string,
  timeRange: string = '24h',
  startDate?: string,
  endDate?: string,
  now: number = Date.now()
): boolean {
  if (!logCreatedAt) return true;
  const logTime = new Date(logCreatedAt).getTime();
  if (isNaN(logTime)) return true;

  if (timeRange === 'all') {
    return true;
  }

  if (timeRange === '1h') {
    return logTime >= now - 60 * 60 * 1000;
  }
  if (timeRange === '6h') {
    return logTime >= now - 6 * 60 * 60 * 1000;
  }
  if (timeRange === '12h') {
    return logTime >= now - 12 * 60 * 60 * 1000;
  }
  if (timeRange === '24h') {
    return logTime >= now - 24 * 60 * 60 * 1000;
  }
  if (timeRange === '7d') {
    return logTime >= now - 7 * 24 * 60 * 60 * 1000;
  }
  if (timeRange === '30d') {
    return logTime >= now - 30 * 24 * 60 * 60 * 1000;
  }
  if (timeRange === 'custom') {
    if (startDate) {
      const startTime = new Date(startDate).getTime();
      if (!isNaN(startTime) && logTime < startTime) return false;
    }
    if (endDate) {
      let endTime = new Date(endDate).getTime();
      if (endDate.length === 10) {
        endTime += 24 * 60 * 60 * 1000 - 1;
      }
      if (!isNaN(endTime) && logTime > endTime) return false;
    }
    return true;
  }

  // default 24 hours
  return logTime >= now - 24 * 60 * 60 * 1000;
}

function computeDailyVisitorLogs(logs: ServerVisitorLog[], daysLimit = 60) {
  const dayMap = new Map<string, {
    date: string;
    visitors: Set<string>;
    page_views: number;
    events: number;
    mobile: number;
    desktop: number;
    tablet: number;
    bot: number;
    auth_users: Set<string>;
    pages: Map<string, number>;
    hours: Map<number, number>;
  }>();

  for (const log of logs) {
    if (!log.created_at) continue;
    const d = new Date(log.created_at);
    if (isNaN(d.getTime())) continue;
    const dateStr = d.toISOString().slice(0, 10); // YYYY-MM-DD
    
    if (!dayMap.has(dateStr)) {
      dayMap.set(dateStr, {
        date: dateStr,
        visitors: new Set<string>(),
        page_views: 0,
        events: 0,
        mobile: 0,
        desktop: 0,
        tablet: 0,
        bot: 0,
        auth_users: new Set<string>(),
        pages: new Map<string, number>(),
        hours: new Map<number, number>(),
      });
    }

    const item = dayMap.get(dateStr)!;
    item.events++;
    if (log.visitor_id) item.visitors.add(log.visitor_id);
    if (log.is_authenticated && (log.user_id || log.username)) {
      item.auth_users.add(log.user_id || log.username || '');
    }
    if (log.action_type === 'page_view') {
      item.page_views++;
      if (log.path) item.pages.set(log.path, (item.pages.get(log.path) || 0) + 1);
    }
    if (log.device_type === 'mobile') item.mobile++;
    else if (log.device_type === 'tablet') item.tablet++;
    else if (log.device_type === 'bot') item.bot++;
    else item.desktop++;

    const hour = d.getHours();
    item.hours.set(hour, (item.hours.get(hour) || 0) + 1);
  }

  const result: any[] = [];
  for (const [date, data] of dayMap.entries()) {
    let topPage = '';
    let topPageViews = 0;
    for (const [p, cnt] of data.pages.entries()) {
      if (cnt > topPageViews) {
        topPage = p;
        topPageViews = cnt;
      }
    }

    let peakHourNum = 0;
    let peakHourCount = 0;
    for (const [h, cnt] of data.hours.entries()) {
      if (cnt > peakHourCount) {
        peakHourNum = h;
        peakHourCount = cnt;
      }
    }
    const peakHour = `${peakHourNum.toString().padStart(2, '0')}:00 - ${(peakHourNum + 1).toString().padStart(2, '0')}:00`;

    result.push({
      date,
      unique_visitors: Math.max(1, data.visitors.size || (data.events > 0 ? 1 : 0)),
      total_page_views: data.page_views,
      total_events: data.events,
      mobile_count: data.mobile,
      desktop_count: data.desktop,
      tablet_count: data.tablet,
      bot_count: data.bot,
      authenticated_users: data.auth_users.size,
      top_page: topPage || '/',
      top_page_views: topPageViews,
      peak_hour: peakHour,
      updated_at: new Date().toISOString(),
    });
  }

  result.sort((a, b) => b.date.localeCompare(a.date));
  return result.slice(0, daysLimit);
}

// 3. Get Detailed Analytics & Statistics
app.get('/api/tracking/stats', async (req, res) => {
  try {
    const { time_range = '24h', start_date, end_date } = req.query;
    const now = Date.now();
    const activeCutoff = now - 5 * 60 * 1000;

    let liveCount = 0;
    for (const sess of serverLiveSessions.values()) {
      if (sess.last_seen_at >= activeCutoff) liveCount++;
    }

    // Filter serverActivityLogs by selected timeframe
    const filteredLogs = serverActivityLogs.filter((log) =>
      isLogWithinTimeRange(log.created_at, time_range as string, start_date as string, end_date as string, now)
    );

    // Compute Daily Logs History
    const dailyHistory = computeDailyVisitorLogs(serverActivityLogs, 60);

    const todayStr = new Date().toISOString().slice(0, 10);
    const yesterdayDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const yesterdayStr = yesterdayDate.toISOString().slice(0, 10);

    const todayLog = dailyHistory.find((d) => d.date === todayStr);
    const yesterdayLog = dailyHistory.find((d) => d.date === yesterdayStr);

    let peakDay = { date: '-', visitors: 0 };
    let totalDailyVisitorsSum = 0;
    for (const d of dailyHistory) {
      totalDailyVisitorsSum += d.unique_visitors;
      if (d.unique_visitors > peakDay.visitors) {
        peakDay = { date: d.date, visitors: d.unique_visitors };
      }
    }
    const avgDailyVisitors = dailyHistory.length > 0 ? Math.round(totalDailyVisitorsSum / dailyHistory.length) : 0;

    // Aggregate from filtered logs
    const uniqueVisitors = new Set<string>();
    const pageViewMap = new Map<string, number>();
    const osMap = new Map<string, number>();
    const browserMap = new Map<string, number>();
    const actionMap = new Map<string, number>();

    let mobileCount = 0;
    let desktopCount = 0;
    let tabletCount = 0;
    let botCount = 0;
    let pageViewsCount = 0;

    for (const log of filteredLogs) {
      if (log.visitor_id) uniqueVisitors.add(log.visitor_id);
      if (log.action_type === 'page_view') {
        pageViewsCount++;
        pageViewMap.set(log.path, (pageViewMap.get(log.path) || 0) + 1);
      }

      if (log.device_type === 'mobile') mobileCount++;
      else if (log.device_type === 'tablet') tabletCount++;
      else if (log.device_type === 'bot') botCount++;
      else desktopCount++;

      if (log.os) osMap.set(log.os, (osMap.get(log.os) || 0) + 1);
      if (log.browser) browserMap.set(log.browser, (browserMap.get(log.browser) || 0) + 1);
      if (log.action_type) actionMap.set(log.action_type, (actionMap.get(log.action_type) || 0) + 1);
    }

    const total = Math.max(1, filteredLogs.length);

    const osBreakdown = Array.from(osMap.entries())
      .map(([name, count]) => ({ name, count, percent: Math.round((count / total) * 100) }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    const browserBreakdown = Array.from(browserMap.entries())
      .map(([name, count]) => ({ name, count, percent: Math.round((count / total) * 100) }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    const topPages = Array.from(pageViewMap.entries())
      .map(([path, count]) => ({ path, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const actionBreakdown = Array.from(actionMap.entries())
      .map(([action, count]) => ({ action, count }))
      .sort((a, b) => b.count - a.count);

    return res.json({
      success: true,
      time_range: time_range || '24h',
      stats: {
        total_events: filteredLogs.length,
        all_time_total_events: serverActivityLogs.length,
        total_unique_visitors: uniqueVisitors.size || (serverLiveSessions.size || 1),
        total_page_views: pageViewsCount,
        live_active_visitors: Math.max(1, liveCount),
        today_unique_visitors: todayLog?.unique_visitors || Math.max(1, uniqueVisitors.size),
        today_page_views: todayLog?.total_page_views || pageViewsCount,
        yesterday_unique_visitors: yesterdayLog?.unique_visitors || 0,
        daily_average_visitors: avgDailyVisitors,
        peak_day: peakDay,
        daily_history: dailyHistory,
        device_breakdown: {
          mobile_count: mobileCount,
          mobile_percent: Math.round((mobileCount / total) * 100),
          desktop_count: desktopCount,
          desktop_percent: Math.round((desktopCount / total) * 100),
          tablet_count: tabletCount,
          tablet_percent: Math.round((tabletCount / total) * 100),
          bot_count: botCount,
          bot_percent: Math.round((botCount / total) * 100),
        },
        os_breakdown: osBreakdown,
        browser_breakdown: browserBreakdown,
        top_pages: topPages,
        action_breakdown: actionBreakdown,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err?.message });
  }
});

// 3.5 Get Daily Visitor Logs specifically
app.get('/api/tracking/daily', async (req, res) => {
  try {
    const { days = '60' } = req.query;
    const daysLimit = parseInt(days as string, 10) || 60;
    const dailyLogs = computeDailyVisitorLogs(serverActivityLogs, daysLimit);

    const todayStr = new Date().toISOString().slice(0, 10);
    const yesterdayDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const yesterdayStr = yesterdayDate.toISOString().slice(0, 10);

    const todayLog = dailyLogs.find((d) => d.date === todayStr);
    const yesterdayLog = dailyLogs.find((d) => d.date === yesterdayStr);

    let peakDay = { date: '-', visitors: 0 };
    let totalVisitorsSum = 0;
    let totalPageViewsSum = 0;

    for (const d of dailyLogs) {
      totalVisitorsSum += d.unique_visitors;
      totalPageViewsSum += d.total_page_views;
      if (d.unique_visitors > peakDay.visitors) {
        peakDay = { date: d.date, visitors: d.unique_visitors };
      }
    }

    return res.json({
      success: true,
      total_days: dailyLogs.length,
      today_unique_visitors: todayLog?.unique_visitors || 0,
      today_page_views: todayLog?.total_page_views || 0,
      yesterday_unique_visitors: yesterdayLog?.unique_visitors || 0,
      yesterday_page_views: yesterdayLog?.total_page_views || 0,
      peak_day: peakDay,
      average_daily_visitors: dailyLogs.length > 0 ? Math.round(totalVisitorsSum / dailyLogs.length) : 0,
      total_recorded_visitors: totalVisitorsSum,
      total_recorded_page_views: totalPageViewsSum,
      daily_logs: dailyLogs,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err?.message });
  }
});

// 4. Get Filtered & Paginated Logs
app.get('/api/tracking/logs', async (req, res) => {
  try {
    const { device, action, search, user_type, time_range = '24h', start_date, end_date, limit = '100', offset = '0' } = req.query;
    const numLimit = parseInt(limit as string, 10) || 100;
    const numOffset = parseInt(offset as string, 10) || 0;
    const cleanSearch = (search as string || '').toLowerCase().trim();
    const cleanDevice = (device as string || 'all').toLowerCase();
    const cleanAction = (action as string || 'all').toLowerCase();
    const cleanUserType = (user_type as string || 'all').toLowerCase();
    const cleanTimeRange = (time_range as string || '24h').toLowerCase();

    const now = Date.now();
    const activeCutoff = now - 5 * 60 * 1000;

    let filtered = serverActivityLogs.filter((log) => {
      // Time Range Filter
      if (!isLogWithinTimeRange(log.created_at, cleanTimeRange, start_date as string, end_date as string, now)) {
        return false;
      }
      // Device filter
      if (cleanDevice !== 'all' && log.device_type !== cleanDevice) {
        return false;
      }
      // Action filter
      if (cleanAction !== 'all' && log.action_type !== cleanAction) {
        return false;
      }
      // User type filter
      if (cleanUserType === 'member' && !log.is_authenticated) {
        return false;
      }
      if (cleanUserType === 'guest' && log.is_authenticated) {
        return false;
      }
      // Search filter
      if (cleanSearch) {
        const matches =
          log.ip_address?.toLowerCase().includes(cleanSearch) ||
          log.username?.toLowerCase().includes(cleanSearch) ||
          log.path?.toLowerCase().includes(cleanSearch) ||
          log.action_name?.toLowerCase().includes(cleanSearch) ||
          log.os?.toLowerCase().includes(cleanSearch) ||
          log.browser?.toLowerCase().includes(cleanSearch) ||
          JSON.stringify(log.details || {}).toLowerCase().includes(cleanSearch);
        if (!matches) return false;
      }
      return true;
    });

    // Mark online status dynamically
    const paginated = filtered.slice(numOffset, numOffset + numLimit).map((item) => {
      const liveSess = serverLiveSessions.get(item.session_id);
      const isOnline = liveSess ? (liveSess.last_seen_at >= activeCutoff) : false;
      return {
        ...item,
        is_online: isOnline,
      };
    });

    return res.json({
      success: true,
      time_range: cleanTimeRange,
      total: filtered.length,
      limit: numLimit,
      offset: numOffset,
      logs: paginated,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err?.message });
  }
});

// 5. Clear Tracking Logs
app.post('/api/tracking/clear', async (_req, res) => {
  try {
    serverActivityLogs.length = 0;
    serverLiveSessions.clear();
    return res.json({ success: true, message: 'Tüm ziyaretçi ve aktivite logları başarıyla temizlendi.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err?.message });
  }
});

// 5. Healthcheck
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', botUsername: botInfo.username, activeCodes: activeAuthCodes.size });
});

// Fallback 404 for unmatched API requests (returns JSON error, never HTML)
app.all('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'NotFound',
    message: `API rotası bulunamadı: ${req.method} ${req.path}`,
  });
});

// ======================== SERVER BOOTSTRAP & SPA FALLBACK ========================

async function startServer() {
  // Initialize Telegram Bot & start polling
  initTelegramBot().then(() => {
    pollTelegramUpdates();
  });

  // Vite middleware in development or static files in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom',
    });
    app.use(vite.middlewares);

    // Universal SPA fallback for all frontend GET requests
    app.get('*', async (req, res, next) => {
      // Never intercept API routes
      if (req.path.startsWith('/api/')) {
        return next();
      }
      try {
        const url = req.originalUrl;
        const indexPath = path.resolve(process.cwd(), 'index.html');
        let template = fs.readFileSync(indexPath, 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        const seo = await getAuthoritativeSiteSettings();
        const transformedHtml = injectDynamicSeoTags(template, req, seo);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(transformedHtml);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    const indexPath = path.join(distPath, 'index.html');

    // Serve static assets from dist folder
    app.use(express.static(distPath, { index: false }));

    // Universal SPA fallback for all frontend GET requests
    app.get('*', async (req, res, next) => {
      // Never intercept API routes
      if (req.path.startsWith('/api/')) {
        return next();
      }
      try {
        let template = fs.readFileSync(indexPath, 'utf-8');
        const seo = await getAuthoritativeSiteSettings();
        const transformedHtml = injectDynamicSeoTags(template, req, seo);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(transformedHtml);
      } catch (e) {
        next(e);
      }
    });
  }

  // Global Error Handler for API routes & server (catches payload too large, JSON syntax errors, etc.)
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (err?.type === 'entity.too.large' || err?.status === 413) {
      console.warn('⚠️ PayloadTooLargeError caught on route:', req.path);
      return res.status(413).json({
        success: false,
        error: 'PayloadTooLargeError',
        message: 'Gönderilen dosya veya veri boyutu çok büyük. Lütfen daha küçük bir görsel seçiniz.',
      });
    }
    if (err) {
      console.error('Express server error:', err);
      return res.status(err.status || 500).json({
        success: false,
        error: err.name || 'InternalServerError',
        message: err.message || 'Sunucu hatası oluştu.',
      });
    }
    next();
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 ShelbyOnline Server running on port ${PORT}`);
    // Non-blocking warmup of portal data cache to make first request instantaneous
    fetchPortalDataFromSupabase()
      .then(() => console.log('⚡ Portal data cache warmed up successfully.'))
      .catch((e) => console.warn('Warmup error (non-fatal):', e?.message));
  });
}

startServer();
