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

// In-memory cache for portal data to eliminate database saturation & ensure sub-5ms response times
let cachedPortalData: any = null;
let cachedPortalDataTime = 0;
const PORTAL_CACHE_TTL_MS = 20000; // 20 seconds cache for high responsiveness, instantly invalidated on writes

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

  // Merge Supabase sponsors, remove deleted ids
  const remoteSponsors = Array.isArray(sponsors) ? sponsors : [];
  const finalSponsorsMap = new Map<string, any>();

  for (const sp of remoteSponsors) {
    const spId = String(sp.id);
    if (serverDeletedSponsorIds.has(spId)) continue;
    if (serverCustomSponsors.has(spId)) {
      finalSponsorsMap.set(spId, { ...sp, ...serverCustomSponsors.get(spId) });
    } else {
      finalSponsorsMap.set(spId, sp);
    }
  }

  for (const [id, customSp] of serverCustomSponsors.entries()) {
    if (serverDeletedSponsorIds.has(id)) continue;
    if (!finalSponsorsMap.has(id)) {
      finalSponsorsMap.set(id, customSp);
    }
  }

  const finalSponsorsList = Array.from(finalSponsorsMap.values());

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
    banners,
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
  res.json({ status: 'ok', message: 'Cache invalidated' });
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
    const isCompleted = Boolean(giveaway.is_completed || giveaway.winner_username);

    const basePayload: any = {
      id: targetId,
      title: giveaway.title,
      description: giveaway.description || '',
      image_url: giveaway.image_url || 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=800&h=450&q=80',
      prize: giveaway.prize_details || giveaway.prize || 'Ödül',
      total_winners: Number(giveaway.winner_count || giveaway.total_winners || 1),
      end_date: giveaway.end_at || giveaway.end_date || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
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
      const { error: upsertErr } = await fetch(`${SUPABASE_URL}/rest/v1/giveaways`, {
        method: 'POST',
        headers: { ...headers, Prefer: 'resolution=merge-duplicates,return=representation' },
        body: JSON.stringify(extendedPayload),
        signal: AbortSignal.timeout(4000),
      }).then((r) => r.json().then((d) => ({ error: !r.ok ? d : null })));

      if (upsertErr) {
        // Fallback to base payload
        await fetch(`${SUPABASE_URL}/rest/v1/giveaways`, {
          method: 'POST',
          headers: { ...headers, Prefer: 'resolution=merge-duplicates,return=representation' },
          body: JSON.stringify(basePayload),
          signal: AbortSignal.timeout(4000),
        });
      }
    } catch (dbErr) {
      console.warn('Supabase giveaway upsert warning:', dbErr);
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
        { headers, signal: AbortSignal.timeout(3000) }
      );
      if (gCheckRes.ok) {
        const gList = await gCheckRes.json();
        if (Array.isArray(gList) && gList.length > 0) {
          const targetG = gList[0];
          const isExpired =
            targetG.is_completed ||
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

    // Step 3: Auto-ensure giveaway exists in Supabase so Foreign Key doesn't fail
    try {
      const gExistsRes = await fetch(
        `${SUPABASE_URL}/rest/v1/giveaways?id=eq.${encodeURIComponent(giveaway_id)}&select=id`,
        { headers, signal: AbortSignal.timeout(3000) }
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
          signal: AbortSignal.timeout(4000),
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
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
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
    app.get('*', (req, res, next) => {
      // Never intercept API routes
      if (req.path.startsWith('/api/')) {
        return next();
      }
      res.sendFile(indexPath);
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
