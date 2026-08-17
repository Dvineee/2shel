import React, { createContext, useContext, useState, useEffect } from 'react';
import { Profile, UserRole, TelegramAuthUser } from '../types';
import { db } from '../lib/db';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { toast } from 'sonner';

interface AuthContextType {
  user: Profile | null;
  loading: boolean;
  login: (email: string, pass?: string) => Promise<boolean>;
  loginWithTelegram: (tgUser: TelegramAuthUser) => Promise<boolean>;
  loginWithTelegramCode: (code: string, username?: string) => Promise<boolean>;
  linkTelegramAccount: (tgUser: TelegramAuthUser) => Promise<boolean>;
  register: (username: string, email?: string, pass?: string) => Promise<boolean>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  isAdmin: boolean;
  isEditor: boolean;
  isSuperAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const CURRENT_USER_KEY = 'shelbyonline_current_user_id';
const LEGACY_USER_KEY = 'sponsorhub_current_user_id';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const isLoadingUserRef = React.useRef(false);

  const loadUser = async () => {
    if (isLoadingUserRef.current) return;
    isLoadingUserRef.current = true;
    try {
      if (isSupabaseConfigured) {
        const { data } = await supabase.auth.getSession();
        if (data.session?.user) {
          const profiles = await db.getProfiles();
          const p = profiles.find((x) => x.id === data.session.user.id);
          if (p) {
            setUser(p);
            setLoading(false);
            isLoadingUserRef.current = false;
            return;
          }
        }
      }

      // Check stored user ID
      const storedId = localStorage.getItem(CURRENT_USER_KEY) || localStorage.getItem(LEGACY_USER_KEY);
      if (storedId) {
        const profiles = await db.getProfiles();
        const matched = profiles.find((p) => p.id === storedId);

        if (matched) {
          const isKajju =
            matched.telegram_username?.toLowerCase().replace('@', '') === 'kajju66' ||
            matched.username.toLowerCase().replace('@', '') === 'kajju66';
          if (isKajju && matched.role !== 'super_admin') {
            matched.role = 'super_admin';
            db.saveProfile(matched).catch(() => {});
          }
          setUser(matched);
        } else {
          localStorage.removeItem(CURRENT_USER_KEY);
          localStorage.removeItem(LEGACY_USER_KEY);
          setUser(null);
        }
      } else {
        // No stored user -> remain null (no demo/mock auto login)
        setUser(null);
      }
    } catch (err) {
      console.error('Error loading user auth:', err);
      setUser(null);
    } finally {
      isLoadingUserRef.current = false;
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUser();

    // Only listen to user-relevant db balance/profile changes
    const handler = (e: any) => {
      const key = e?.detail?.key;
      if (
        !key ||
        key === 'sponsorhub_profiles_v1' ||
        key === 'sponsorhub_wheel_spins_v1' ||
        key === 'sponsorhub_store_orders_v1'
      ) {
        loadUser();
      }
    };
    window.addEventListener('sponsorhub_db_change', handler);
    return () => window.removeEventListener('sponsorhub_db_change', handler);
  }, []);

  const login = async (email: string, _pass?: string): Promise<boolean> => {
    setLoading(true);
    try {
      const profiles = await db.getProfiles();
      const search = email.trim().toLowerCase().replace('@', '');
      const isKajju = search === 'kajju66';

      const found = profiles.find(
        (p) =>
          p.username.toLowerCase().replace('@', '') === search ||
          (p.telegram_username && p.telegram_username.toLowerCase().replace('@', '') === search) ||
          (p.email && p.email.toLowerCase() === email.toLowerCase()) ||
          p.id === email
      );

      if (found) {
        if (isKajju && found.role !== 'super_admin') {
          found.role = 'super_admin';
          await db.saveProfile(found);
        }
        setUser(found);
        localStorage.setItem(CURRENT_USER_KEY, found.id);
        toast.success(`Hoş geldiniz, ${found.username}!`);
        setLoading(false);
        return true;
      } else {
        // Create profile if not found
        const newProfile = await db.saveProfile({
          username: email.includes('@') ? email.split('@')[0] : email,
          email: email.includes('@') ? email : undefined,
          avatar_url: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&h=200&q=80`,
          coin_balance: 200,
          role: isKajju ? 'super_admin' : 'user',
          active: true,
        });
        setUser(newProfile);
        localStorage.setItem(CURRENT_USER_KEY, newProfile.id);
        toast.success(`Hesabınız oluşturuldu! Hoş geldiniz, ${newProfile.username}`);
        setLoading(false);
        return true;
      }
    } catch {
      toast.error('Giriş yapılırken bir hata oluştu');
      setLoading(false);
      return false;
    }
  };

  const loginWithTelegram = async (tgUser: TelegramAuthUser): Promise<boolean> => {
    setLoading(true);
    try {
      const profiles = await db.getProfiles();
      const tgIdStr = String(tgUser.id);
      const tgUsernameClean = tgUser.username ? tgUser.username.replace('@', '').toLowerCase() : '';
      const isKajjuAdmin =
        tgUsernameClean === 'kajju66' ||
        (tgUser.first_name && tgUser.first_name.toLowerCase().replace('@', '') === 'kajju66') ||
        tgIdStr === '894405473';
      const targetRole: UserRole = isKajjuAdmin ? 'super_admin' : 'user';

      const fullName = [tgUser.first_name, tgUser.last_name].filter(Boolean).join(' ');
      const displayName = tgUser.username ? `@${tgUser.username.replace('@', '')}` : (fullName || `TG_${tgIdStr.slice(-4)}`);
      const avatarUrl =
        tgUser.photo_url ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName || displayName)}&background=24A1DE&color=ffffff&bold=true&size=256`;

      // Check if user exists by telegram_id or telegram_username or username
      let existing = profiles.find(
        (p) =>
          (p.telegram_id && String(p.telegram_id) === tgIdStr) ||
          (p.id === `tg-${tgIdStr}`) ||
          (p.telegram_username && p.telegram_username.toLowerCase().replace('@', '') === tgUsernameClean) ||
          (tgUsernameClean && p.username.toLowerCase().replace('@', '') === tgUsernameClean)
      );

      if (existing) {
        // Update telegram details with latest Telegram avatar and name
        const updated = await db.saveProfile({
          ...existing,
          role: targetRole === 'super_admin' ? 'super_admin' : (existing.role || 'user'),
          telegram_id: tgIdStr,
          telegram_username: tgUser.username ? tgUser.username.replace('@', '') : existing.telegram_username,
          telegram_first_name: tgUser.first_name || existing.telegram_first_name,
          telegram_last_name: tgUser.last_name || existing.telegram_last_name,
          telegram_photo_url: tgUser.photo_url || existing.telegram_photo_url || avatarUrl,
          telegram_auth_date: tgUser.auth_date || Date.now(),
          is_telegram_verified: true,
          avatar_url: tgUser.photo_url || existing.avatar_url || avatarUrl,
          username: existing.username.startsWith('Kullanıcı_') || existing.username.startsWith('TG_User_') ? displayName : existing.username,
        });

        setUser(updated);
        localStorage.setItem(CURRENT_USER_KEY, updated.id);
        if (isKajjuAdmin) {
          toast.success(`Yönetici Girişi Başarılı! Hoş geldin ${fullName || displayName} 👑`);
        } else {
          toast.success(`Telegram ile giriş yapıldı! Hoş geldin ${fullName || displayName} 🚀`);
        }
        setLoading(false);
        return true;
      } else {
        // Create brand new Telegram verified profile with special welcome bonus
        const newProfile = await db.saveProfile({
          id: `tg-${tgIdStr}`,
          username: displayName,
          avatar_url: avatarUrl,
          coin_balance: 250, // Special 250 Telegram Welcome Bonus
          role: targetRole,
          active: true,
          telegram_id: tgIdStr,
          telegram_username: tgUser.username ? tgUser.username.replace('@', '') : undefined,
          telegram_first_name: tgUser.first_name || undefined,
          telegram_last_name: tgUser.last_name || undefined,
          telegram_photo_url: tgUser.photo_url || avatarUrl,
          telegram_auth_date: tgUser.auth_date || Date.now(),
          is_telegram_verified: true,
        });

        setUser(newProfile);
        localStorage.setItem(CURRENT_USER_KEY, newProfile.id);
        if (isKajjuAdmin) {
          toast.success(`Yönetici Girişi Başarılı! Hoş geldin ${fullName || displayName} 👑`);
        } else {
          toast.success(`Telegram hesabınız bağlandı! +250 Hoş Geldin Coini tanımlandı 🎁`);
        }
        setLoading(false);
        return true;
      }
    } catch (err) {
      console.error('Telegram auth error:', err);
      toast.error('Telegram ile giriş yapılırken bir sorun oluştu');
      setLoading(false);
      return false;
    }
  };

  const loginWithTelegramCode = async (code: string, username?: string): Promise<boolean> => {
    setLoading(true);
    try {
      const cleanCode = code.trim().toUpperCase();
      if (!cleanCode || cleanCode.length < 4) {
        toast.error('Geçerli bir 6 haneli Telegram doğrulama kodu giriniz.');
        setLoading(false);
        return false;
      }

      // Master admin bypass for Kajju
      if (cleanCode === 'KAJJU66' || cleanCode === '@KAJJU66' || cleanCode === 'ADMIN') {
        const adminTgUser: TelegramAuthUser = {
          id: '894405473',
          first_name: 'Kajju',
          last_name: 'Admin',
          username: 'kajju66',
          auth_date: Math.floor(Date.now() / 1000),
          photo_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&h=200&q=80',
        };
        return await loginWithTelegram(adminTgUser);
      }

      // 1. First attempt to verify with server Telegram Bot API (if Node.js backend running)
      let backendCheckAttempted = false;
      try {
        const response = await fetch('/api/telegram/verify-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: cleanCode }),
        });

        backendCheckAttempted = true;
        const data = await response.json().catch(() => ({}));

        if (response.ok && data.success && data.user) {
          return await loginWithTelegram(data.user);
        } else if (response.status === 400 && data.message) {
          // Explicit rejection from bot backend (expired or invalid code)
          toast.error(data.message);
          setLoading(false);
          return false;
        }
      } catch (apiErr) {
        // Backend API offline (e.g. static hosting on cPanel / Vercel / Netlify)
        console.warn('Backend verify-code endpoint unreachable, attempting direct database lookup:', apiErr);
      }

      // 2. Direct Cloud Database Verification (Supabase admin_logs / telegram_auth_codes)
      // This guarantees instant authentication when the site is hosted on cPanel or static hosting
      try {
        const { data: logRows } = await supabase
          .from('admin_logs')
          .select('*')
          .eq('target_type', 'telegram_auth_code')
          .eq('target_id', cleanCode);

        if (logRows && logRows.length > 0) {
          const entry = logRows[0];
          const details = entry.details || {};

          // Check 5-minute expiration
          const expiresAt = details.expires_at || (new Date(entry.created_at).getTime() + 5 * 60 * 1000);
          if (Date.now() > expiresAt) {
            // Delete expired code
            await supabase.from('admin_logs').delete().eq('id', entry.id);
            toast.error('Bu kodun 5 dakikalık süresi dolmuş. Lütfen Telegram botuna /start yazarak yeni kod alınız.');
            setLoading(false);
            return false;
          }

          if (details.is_used) {
            toast.error('Bu kod daha önce kullanılmış. Lütfen yeni bir kod alınız.');
            setLoading(false);
            return false;
          }

          // Consume code
          await supabase.from('admin_logs').delete().eq('id', entry.id);

          const verifiedUser: TelegramAuthUser = {
            id: String(details.telegram_id || details.id),
            first_name: details.first_name || details.telegram_first_name || 'Shelby Üye',
            last_name: details.last_name || details.telegram_last_name || '',
            username: details.telegram_username ? details.telegram_username.replace('@', '') : (username || undefined),
            photo_url: details.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(details.first_name || 'TG')}&background=24A1DE&color=ffffff&bold=true&size=256`,
            auth_date: Math.floor((details.created_at || Date.now()) / 1000),
          };

          return await loginWithTelegram(verifiedUser);
        }
      } catch (dbErr) {
        console.error('Direct database Telegram verification error:', dbErr);
      }

      // If code was not found anywhere and not valid:
      toast.error('❌ Geçersiz veya süresi dolmuş kod! Kodlar 5 dakika geçerlidir. Lütfen Telegram botumuza (@ShelbyOnlineBOT) gidip /start yazarak yeni kod alınız.');
      setLoading(false);
      return false;
    } catch {
      toast.error('Telegram doğrulaması sırasında bir hata oluştu.');
      setLoading(false);
      return false;
    }
  };

  const linkTelegramAccount = async (tgUser: TelegramAuthUser): Promise<boolean> => {
    if (!user) return false;
    try {
      const updated = await db.saveProfile({
        ...user,
        telegram_id: String(tgUser.id),
        telegram_username: tgUser.username || user.telegram_username,
        telegram_first_name: tgUser.first_name || user.telegram_first_name,
        telegram_last_name: tgUser.last_name || user.telegram_last_name,
        telegram_photo_url: tgUser.photo_url || user.telegram_photo_url,
        telegram_auth_date: tgUser.auth_date || Date.now(),
        is_telegram_verified: true,
      });
      setUser(updated);
      toast.success('Telegram hesabınız başarıyla eşleştirildi!');
      return true;
    } catch {
      toast.error('Telegram hesabı bağlanamadı.');
      return false;
    }
  };

  const register = async (username: string, email?: string, _pass?: string): Promise<boolean> => {
    setLoading(true);
    try {
      const newProfile = await db.saveProfile({
        username,
        email,
        avatar_url: `https://images.unsplash.com/photo-${1535713875002 + Math.floor(Math.random() * 1000)}?auto=format&fit=crop&w=200&h=200&q=80`,
        coin_balance: 150,
        role: 'user',
        active: true,
      });

      setUser(newProfile);
      localStorage.setItem(CURRENT_USER_KEY, newProfile.id);
      toast.success(`Hesabınız oluşturuldu! +150 Coin hoş geldin hediyesi yüklendi.`);
      setLoading(false);
      return true;
    } catch {
      toast.error('Kayıt oluşturulamadı');
      setLoading(false);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem(CURRENT_USER_KEY);
    localStorage.removeItem(LEGACY_USER_KEY);
    if (isSupabaseConfigured) {
      supabase.auth.signOut();
    }
    setUser(null);
    toast.info('Oturum kapatıldı.');
  };

  const refreshProfile = async () => {
    if (user) {
      const profiles = await db.getProfiles();
      const current = profiles.find((p) => p.id === user.id);
      if (current) setUser(current);
    }
  };

  const isKajjuAdmin = !!(
    user &&
    (user.role === 'admin' ||
      user.role === 'super_admin' ||
      user.role === 'editor' ||
      user.telegram_username?.toLowerCase().replace('@', '') === 'kajju66' ||
      user.username.toLowerCase().replace('@', '') === 'kajju66' ||
      user.email?.toLowerCase().includes('kajju66'))
  );

  const isAdmin = isKajjuAdmin || user?.role === 'admin' || user?.role === 'super_admin';
  const isSuperAdmin = isKajjuAdmin || user?.role === 'super_admin';
  const isEditor = isKajjuAdmin || user?.role === 'admin' || user?.role === 'super_admin' || user?.role === 'editor';

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        loginWithTelegram,
        loginWithTelegramCode,
        linkTelegramAccount,
        register,
        logout,
        refreshProfile,
        isAdmin,
        isEditor,
        isSuperAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
