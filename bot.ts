import 'dotenv/config';

/**
 * ==============================================================================
 * ShelbyOnline - Standalone Telegram Bot Service
 * ==============================================================================
 * Bu dosya bağımsız (standalone) bir Telegram Bot servisidir.
 * Kendi sunucunuzda (VPS, PM2, Docker, Linux/Windows sunucu) web sitesinden ayrı
 * olarak çalıştırılabilir.
 *
 * Çalıştırma:
 *   - Doğrudan: npm run bot  (veya npx tsx bot.ts)
 *   - PM2 ile:  pm2 start "npx tsx bot.ts" --name shelby-bot
 *   - Build ile: npm run build:bot && npm run start:bot
 * ==============================================================================
 */

// 1. Environment Configurations
const TELEGRAM_BOT_TOKEN =
  process.env.TELEGRAM_BOT_TOKEN || '8944054737:AAHD_G8mzXVQiYEQnqUDiLa6hSJyRdIyjeY';

const WEB_APP_URL = (process.env.WEB_APP_URL || process.env.VITE_APP_URL || 'https://shelbyonline.com').replace(/\/$/, '');

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

let botInfo = {
  id: 0,
  username: 'ShelbyOnlineBOT',
  first_name: 'ShelbyOnlineBot',
};

// Memory Cache for Codes & Anti-Spam
const activeAuthCodes = new Map<string, TelegramCodeEntry>();
const lastUserActionTimes = new Map<number, { time: number; code: string }>();
const processedUpdateIds = new Set<number>();
const processedMessageKeys = new Set<string>();

// Keep memory size healthy
function markUpdateProcessed(updateId: number): boolean {
  if (processedUpdateIds.has(updateId)) return true;
  processedUpdateIds.add(updateId);
  if (processedUpdateIds.size > 2000) {
    const oldest = processedUpdateIds.values().next().value;
    if (oldest !== undefined) processedUpdateIds.delete(oldest);
  }
  return false;
}

function markMessageProcessed(key: string): boolean {
  if (processedMessageKeys.has(key)) return true;
  processedMessageKeys.add(key);
  if (processedMessageKeys.size > 2000) {
    const oldest = processedMessageKeys.values().next().value;
    if (oldest !== undefined) processedMessageKeys.delete(oldest);
  }
  return false;
}

// Resilient Telegram API Helper
let lastConflictLogTime = 0;
async function telegramApiCall(method: string, body?: any, timeoutMs: number = 10000) {
  if (!TELEGRAM_BOT_TOKEN) return null;

  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/${method}`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (!res.ok) {
      if (res.status === 409) {
        const now = Date.now();
        if (now - lastConflictLogTime > 60000) {
          lastConflictLogTime = now;
          console.log('ℹ️ [Telegram API] HTTP 409 Conflict: Başka bir bot oturumu getUpdates çağrısı yapıyor. Beklemeye alınıyor...');
        }
        return { ok: false, error_code: 409, is_conflict: true };
      }

      if (res.status === 429) {
        return { ok: false, error_code: 429, description: 'Too Many Requests' };
      }

      const errText = await res.text().catch(() => '');
      console.warn(`[Telegram API] ${method} returned HTTP ${res.status}: ${errText}`);
      return null;
    }

    return await res.json();
  } catch (err: any) {
    const isNetworkError =
      err?.name === 'TimeoutError' ||
      err?.name === 'AbortError' ||
      err?.code === 'ECONNRESET' ||
      err?.code === 'ETIMEDOUT' ||
      err?.code === 'UND_ERR_CONNECT_TIMEOUT' ||
      String(err?.message || '').toLowerCase().includes('timeout');

    if (method === 'getUpdates' && isNetworkError) {
      return null;
    }

    console.error(`[Telegram API] Error in ${method}:`, err?.message || err);
    return null;
  }
}

// Fetch Profile Photo as Base64 Data URL
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
              console.log(`📸 Telegram avatarı başarıyla alındı (User: ${userId})`);
              return `data:${contentType};base64,${base64}`;
            }
          } catch {}
        }
      }
    }
  } catch (err) {
    console.error(`Profil fotoğrafı alma hatası (${userId}):`, err);
  }

  const safeName = encodeURIComponent(displayName || 'Shelby User');
  return `https://ui-avatars.com/api/?name=${safeName}&background=24A1DE&color=ffffff&bold=true&size=256`;
}

// Sync Telegram User to Supabase Profiles
async function syncTelegramUserToSupabase(tgUser: {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  coins?: number;
}) {
  try {
    const tgIdStr = String(tgUser.id);
    const cleanUsername = tgUser.username ? tgUser.username.replace('@', '').trim() : '';
    const fullName = [tgUser.first_name, tgUser.last_name].filter(Boolean).join(' ').trim();
    const displayName = fullName || cleanUsername || `Üye #${tgIdStr.slice(-4)}`;

    const headers = {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=representation',
    };

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
      avatar_url:
        tgUser.photo_url ||
        existingProfile?.avatar_url ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName || displayName)}&background=24A1DE&color=ffffff&bold=true&size=256`,
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
    console.error('Kullanıcı Supabase senkronizasyon hatası:', err);
    return null;
  }
}

// Persist generated auth code to Supabase and optionally sync to Web Server
async function persistAuthCodeToSupabase(entry: TelegramCodeEntry) {
  try {
    const headers = {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=representation',
    };

    // 1. Save to Supabase admin_logs (universally accessible)
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

    // 2. Also save to telegram_auth_codes if exists
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

    // 3. If WEB_APP_URL is specified and reachable, push code to web app's live register endpoint
    if (WEB_APP_URL && WEB_APP_URL.startsWith('http')) {
      fetch(`${WEB_APP_URL}/api/telegram/register-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
      }).catch(() => {});
    }
  } catch (err) {
    console.error('Giriş kodu Supabase kaydetme hatası:', err);
  }
}

// Generate Auth Code and send reply
async function sendAuthCodeMessage(chatId: number, fromUser: any, forceNew = false) {
  const userId = fromUser.id;
  const now = Date.now();
  const lastAction = lastUserActionTimes.get(userId);

  if (!forceNew && lastAction && now - lastAction.time < 4000) {
    console.log(`[Anti-Spam] Kullanıcı ${userId} için 4 saniye içinde tekrar kod talebi engellendi.`);
    return;
  }

  const code = String(Math.floor(100000 + Math.random() * 900000));
  const displayName = fromUser.first_name || fromUser.username || 'Değerli Üyemiz';

  lastUserActionTimes.set(userId, { time: now, code });

  let photoUrl = '';
  try {
    photoUrl = await getTelegramUserProfilePhoto(userId, displayName);
  } catch {}

  const codeEntry: TelegramCodeEntry = {
    code,
    telegram_id: userId,
    telegram_username: fromUser.username ? `@${fromUser.username}` : '',
    telegram_first_name: fromUser.first_name || 'Shelby',
    telegram_last_name: fromUser.last_name || '',
    photo_url: photoUrl,
    created_at: now,
    expires_at: now + 5 * 60 * 1000,
  };

  activeAuthCodes.set(code, codeEntry);

  // Sync to database
  persistAuthCodeToSupabase(codeEntry).catch(() => {});
  syncTelegramUserToSupabase({
    id: userId,
    first_name: fromUser.first_name,
    last_name: fromUser.last_name,
    username: fromUser.username,
    photo_url: photoUrl,
  }).catch(() => {});

  const msgText =
    `🔐 <b>ShelbyOnline Giriş ve Güvenlik Kodunuz</b>\n\n` +
    `Merhaba <b>${displayName}</b>,\n\n` +
    `Web sitemizde tek tıkla şifresiz giriş yapmak için aşağıdaki <b>6 haneli kodu</b> kullanabilirsiniz:\n\n` +
    `👉 <code>${code}</code> 👈\n\n` +
    `⏳ <b>Geçerlilik Süresi:</b> 5 Dakika\n` +
    `🎁 <b>Hoş Geldin Hediyesi:</b> 250 Shelby Coin hesabınıza tanımlandı!\n\n` +
    `<i>Kodu kopyalayıp web sitesindeki giriş ekranına yapıştırınız.</i>`;

  const inlineKeyboard = {
    inline_keyboard: [
      [
        {
          text: '🔄 Yeni Kod Üret',
          callback_data: 'refresh_code',
        },
        {
          text: '🌐 Web Sitesine Git',
          url: WEB_APP_URL,
        },
      ],
    ],
  };

  await telegramApiCall('sendMessage', {
    chat_id: chatId,
    text: msgText,
    parse_mode: 'HTML',
    reply_markup: inlineKeyboard,
  });

  console.log(`🔑 Giriş Kodu Gönderildi: [${code}] -> Kullanıcı: ${userId} (${fromUser.username || displayName})`);
}

// Main Telegram Update Dispatcher
async function handleTelegramUpdate(update: any) {
  if (!update) return;

  if (update.update_id && markUpdateProcessed(update.update_id)) {
    return;
  }

  // Callback query
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

  // Text message
  const msg = update.message;
  if (!msg || !msg.text) return;

  const chatId = msg.chat?.id;
  const fromUser = msg.from;
  const text = msg.text.trim();

  if (!chatId || !fromUser) return;

  const msgKey = `msg_${chatId}_${msg.message_id}`;
  if (markMessageProcessed(msgKey)) return;

  if (msg.date && Date.now() / 1000 - msg.date > 120) {
    return;
  }

  if (text.startsWith('/start') || text.startsWith('/kod') || text.toLowerCase() === 'kod' || text.toLowerCase() === 'giris') {
    await sendAuthCodeMessage(chatId, fromUser);
  } else if (text.startsWith('/bakiye') || text.startsWith('/coin')) {
    const isSuperAdmin = String(fromUser.id) === '894405473';
    await telegramApiCall('sendMessage', {
      chat_id: chatId,
      text:
        `💰 <b>ShelbyOnline Hesap Bilgileriniz</b>\n\n` +
        `👤 Kullanıcı: <b>@${fromUser.username || fromUser.first_name}</b>\n` +
        `💎 Rol: <b>${isSuperAdmin ? '👑 Süper Yönetici' : '🌟 Üye'}</b>\n` +
        `🎁 Günlük Çark ve Mağazada harcayabileceğiniz coinlerinizi görmek için web sitesine giriş yapınız.\n` +
        `🌐 <b>${WEB_APP_URL}</b>`,
      parse_mode: 'HTML',
    });
  } else if (text.startsWith('/yardim')) {
    await telegramApiCall('sendMessage', {
      chat_id: chatId,
      text:
        `ℹ️ <b>ShelbyOnline Giriş Yardımı</b>\n\n` +
        `1. /start veya /kod komutunu bota gönderin.\n` +
        `2. Botun verdiği 6 haneli güvenlik kodunu kopyalayın (5 dakika geçerlidir).\n` +
        `3. <b>${WEB_APP_URL}</b> üzerindeki giriş kutusuna kodu yapıştırıp onaylayın.\n` +
        `4. Şifresiz olarak hesabınıza bağlanın ve hediyelerinizi toplayın!`,
      parse_mode: 'HTML',
    });
  } else if (text.startsWith('/site')) {
    await telegramApiCall('sendMessage', {
      chat_id: chatId,
      text: `🌐 ShelbyOnline Web Sitesi:\n${WEB_APP_URL}`,
    });
  }
}

// Initialize Bot commands and details
async function initBot() {
  console.log('🤖 Telegram Bot servisi başlatılıyor...');
  
  try {
    await telegramApiCall('deleteWebhook', { drop_pending_updates: false });
  } catch {}

  const res = await telegramApiCall('getMe');
  if (res && res.ok && res.result) {
    botInfo = {
      id: res.result.id,
      username: res.result.username || 'ShelbyOnlineBOT',
      first_name: res.result.first_name || 'ShelbyOnlineBot',
    };
    console.log(`✅ Telegram Bot Başarıyla Bağlandı: @${botInfo.username} (${botInfo.first_name})`);

    await telegramApiCall('setMyCommands', {
      commands: [
        { command: 'start', description: 'Giriş Kodu Al (5 Dk Geçerli)' },
        { command: 'kod', description: 'Yeni 6 Haneli Giriş Kodu Üret' },
        { command: 'bakiye', description: 'Shelby Coin Bakiyeni Öğren' },
        { command: 'yardim', description: 'Giriş ve Bonus Yardımı' },
        { command: 'site', description: 'Web Sitesi Adresi' },
      ],
    });

    try {
      const initUpdates = await telegramApiCall('getUpdates', { offset: -1, limit: 1 });
      if (initUpdates && initUpdates.ok && Array.isArray(initUpdates.result) && initUpdates.result.length > 0) {
        pollingOffset = initUpdates.result[0].update_id + 1;
        console.log(`📡 Polling offset başlangıç değeri: ${pollingOffset}`);
      }
    } catch {}
    return true;
  } else {
    console.error('❌ Telegram Bot bağlantısı kurulamadı. Token kontrol ediniz.');
    return false;
  }
}

// Long Polling Loop
let pollingOffset = 0;
let isRunning = true;

async function startPolling() {
  console.log('🚀 Telegram Polling döngüsü aktif. Mesajlar dinleniyor...');

  let consecutiveErrors = 0;
  let consecutiveConflicts = 0;

  while (isRunning) {
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
        consecutiveConflicts = 0;
        for (const update of res.result) {
          if (update.update_id >= pollingOffset) {
            pollingOffset = update.update_id + 1;
          }
          await handleTelegramUpdate(update);
        }
      } else if (res && (res.error_code === 409 || res.is_conflict)) {
        consecutiveConflicts++;
        const conflictBackoff = Math.min(5000 + consecutiveConflicts * 3000, 30000) + Math.floor(Math.random() * 2000);
        console.log(`⚠️ Çakışma algılandı. ${Math.round(conflictBackoff / 1000)}s bekleniyor...`);
        await new Promise((r) => setTimeout(r, conflictBackoff));
        continue;
      } else if (res && res.error_code === 429) {
        await new Promise((r) => setTimeout(r, 10000));
        continue;
      } else if (!res) {
        consecutiveErrors++;
        const backoff = Math.min(consecutiveErrors * 1500, 8000);
        await new Promise((r) => setTimeout(r, backoff));
        continue;
      }
    } catch {
      consecutiveErrors++;
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
}

// Graceful Shutdown
function handleShutdown() {
  console.log('\n🛑 Telegram bot servisi güvenli şekilde kapatılıyor...');
  isRunning = false;
  process.exit(0);
}

process.on('SIGINT', handleShutdown);
process.on('SIGTERM', handleShutdown);

// Main Execution
async function main() {
  console.log('====================================================');
  console.log('💎 ShelbyOnline Standalone Telegram Bot');
  console.log(`🌐 Hedef Web Sitesi: ${WEB_APP_URL}`);
  console.log(`📦 Supabase URL: ${SUPABASE_URL}`);
  console.log('====================================================');

  const ready = await initBot();
  if (ready) {
    startPolling();
  } else {
    console.error('Bot başlatılamadı. 10 saniye sonra yeniden denenecek...');
    setTimeout(main, 10000);
  }
}

main();
