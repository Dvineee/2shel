import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(express.json());

// Telegram Bot Configuration
const TELEGRAM_BOT_TOKEN =
  process.env.TELEGRAM_BOT_TOKEN || '8944054737:AAHD_G8mzXVQiYEQnqUDiLa6hSJyRdIyjeY';

// Portal Data & Supabase Configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://pkxcsjxqxzzfsoamyegk.supabase.co';
const SUPABASE_ANON_KEY =
  process.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBreGNzanhxeHp6ZnNvYW15ZWdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY5ODc0MzIsImV4cCI6MjEwMjU2MzQzMn0.1F4NEkWKVRIWlCN882mdUemOMr5Gm0WK7xWcMknIrC0';

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

// Telegram API Helper
async function telegramApiCall(method: string, body?: any) {
  if (!TELEGRAM_BOT_TOKEN) return null;
  try {
    const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/${method}`, {
      method: body ? 'POST' : 'GET',
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json();
    return data;
  } catch (err) {
    console.error(`Telegram API Error on [${method}]:`, err);
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
    const isKajju = cleanUsername.toLowerCase() === 'kajju66' || tgIdStr === '894405473';
    const assignedRole = tgUser.role || (isKajju ? 'super_admin' : 'user');

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
          const imgFetch = await fetch(fileUrl);
          if (imgFetch.ok) {
            const arrayBuffer = await imgFetch.arrayBuffer();
            const base64 = Buffer.from(arrayBuffer).toString('base64');
            const contentType = imgFetch.headers.get('content-type') || 'image/jpeg';
            console.log(`📸 Successfully fetched and encoded Telegram photo for user ${userId} (${base64.length} bytes)`);
            return `data:${contentType};base64,${base64}`;
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

  while (true) {
    try {
      const res = await telegramApiCall('getUpdates', {
        offset: pollingOffset,
        timeout: 20,
        allowed_updates: ['message', 'callback_query'],
      });

      if (res && res.ok && Array.isArray(res.result)) {
        for (const update of res.result) {
          // Immediately acknowledge offset for Telegram
          if (update.update_id >= pollingOffset) {
            pollingOffset = update.update_id + 1;
          }
          await handleTelegramUpdate(update);
        }
      }
    } catch (e) {
      console.error('Telegram polling error:', e);
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
    const isKajju = fromUser.username?.toLowerCase() === 'kajju66' || String(fromUser.id) === '894405473';
    await telegramApiCall('sendMessage', {
      chat_id: chatId,
      text:
        `💰 <b>ShelbyOnline Bakiye Bilgisi</b>\n\n` +
        `👤 Kullanıcı: <b>@${fromUser.username || fromUser.first_name}</b>\n` +
        `💎 Rol: <b>${isKajju ? '👑 Süper Yönetici' : '🌟 Üye'}</b>\n` +
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

// In-memory cache for portal data to eliminate database saturation & ensure sub-10ms response times
let cachedPortalData: any = null;
let cachedPortalDataTime = 0;
const PORTAL_CACHE_TTL_MS = 2000; // 2 seconds cache for high responsiveness

// Portal Data Endpoint (Direct server-side Supabase query with caching & strict timeout)
app.get('/api/portal/data', async (req, res) => {
  const now = Date.now();
  const isFreshRequested = req.query.fresh === 'true';
  if (!isFreshRequested && cachedPortalData && now - cachedPortalDataTime < PORTAL_CACHE_TTL_MS) {
    return res.json({
      status: 'ok',
      source: 'cache',
      data: cachedPortalData,
    });
  }

  try {
    const headers = {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    };

    const fetchWithTimeout = async (url: string) => {
      try {
        const response = await fetch(url, {
          headers,
          signal: AbortSignal.timeout(6000),
        });
        if (response.ok) {
          return await response.json();
        }
        return [];
      } catch (e) {
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
    ]);

    const entriesList = Array.isArray(giveaway_entries) ? giveaway_entries : [];
    const formattedGiveaways = Array.isArray(giveaways)
      ? giveaways.map((g: any) => {
          const matchCount = entriesList.filter((e: any) => e.giveaway_id === g.id).length;
          return {
            ...g,
            entries_count: Math.max(Number(g.entries_count) || 0, matchCount),
          };
        })
      : [];

    const resultData = {
      settings,
      sponsors,
      hero_slides,
      banners,
      social_links,
      wheel_rewards,
      giveaways: formattedGiveaways,
      store_products,
      giveaway_entries: entriesList,
    };

    cachedPortalData = resultData;
    cachedPortalDataTime = Date.now();

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
        sponsors: [],
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
  res.json({ status: 'ok', message: 'Cache invalidated' });
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

    const headers = {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    };

    // Check if giveaway is completed or expired
    try {
      const gCheckRes = await fetch(
        `${SUPABASE_URL}/rest/v1/giveaways?id=eq.${encodeURIComponent(giveaway_id)}`,
        { headers, signal: AbortSignal.timeout(3000) }
      );
      if (gCheckRes.ok) {
        const gList = await gCheckRes.json();
        if (Array.isArray(gList) && gList.length > 0) {
          const targetG = gList[0];
          const isExpired = targetG.is_completed || (targetG.end_at && new Date(targetG.end_at).getTime() <= Date.now()) || (targetG.end_date && new Date(targetG.end_date).getTime() <= Date.now());
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

    // Check duplicate in Supabase
    try {
      const checkRes = await fetch(
        `${SUPABASE_URL}/rest/v1/giveaway_entries?giveaway_id=eq.${encodeURIComponent(giveaway_id)}&user_id=eq.${encodeURIComponent(user_id)}`,
        { headers, signal: AbortSignal.timeout(3000) }
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

    // Insert entry
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/giveaway_entries`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          id: entryId,
          giveaway_id,
          user_id,
          username: cleanUsername,
          created_at: nowIso,
        }),
        signal: AbortSignal.timeout(3000),
      });
    } catch (e) {
      console.warn('Supabase entry insert warning:', e);
    }

    // Invalidate portal cache
    cachedPortalData = null;
    cachedPortalDataTime = 0;

    return res.json({
      success: true,
      message: '🎉 Çekilişe başarıyla katıldınız! Bol şans.',
      entry: { id: entryId, giveaway_id, user_id, username: cleanUsername, created_at: nowIso },
    });
  } catch (err: any) {
    console.error('Error joining giveaway:', err);
    return res.status(500).json({ success: false, message: 'Çekilişe katılırken sunucu hatası oluştu.' });
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
    const imgRes = await fetch(fileUrl);
    if (!imgRes.ok) {
      return res.redirect('https://ui-avatars.com/api/?name=Telegram+User&background=24A1DE&color=fff');
    }
    const contentType = imgRes.headers.get('content-type') || 'image/jpeg';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    const buffer = await imgRes.arrayBuffer();
    return res.send(Buffer.from(buffer));
  } catch (err) {
    console.error('Avatar proxy error:', err);
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

  // Admin backdoor codes
  if (cleanCode === 'KAJJU66' || cleanCode === '@KAJJU66' || cleanCode === 'ADMIN') {
    const adminUser = {
      id: '894405473',
      first_name: 'Kajju',
      last_name: 'Admin',
      username: 'kajju66',
      role: 'super_admin',
      auth_date: Math.floor(Date.now() / 1000),
      photo_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&h=200&q=80',
    };
    await syncTelegramUserToSupabase(adminUser);
    return res.json({
      success: true,
      message: '👑 Yönetici girişi başarıyla onaylandı!',
      user: adminUser,
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

// 4. Sync Profile Directly with Supabase Database
app.post('/api/telegram/sync-profile', async (req, res) => {
  try {
    const { user } = req.body;
    if (!user) {
      return res.status(400).json({ status: 'error', message: 'User data required' });
    }
    const synced = await syncTelegramUserToSupabase(user);
    res.json({ status: 'ok', profile: synced });
  } catch (err: any) {
    console.error('Error in sync-profile endpoint:', err);
    res.status(500).json({ status: 'error', message: err?.message || 'Sync failed' });
  }
});

// 5. Healthcheck
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', botUsername: botInfo.username, activeCodes: activeAuthCodes.size });
});

// ======================== SERVER BOOTSTRAP ========================

async function startServer() {
  // Initialize Telegram Bot & start polling
  initTelegramBot().then(() => {
    pollTelegramUpdates();
  });

  // Vite middleware in dev or static files in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 ShelbyOnline Server running on port ${PORT}`);
  });
}

startServer();
