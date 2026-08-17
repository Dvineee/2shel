import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { soundEngine } from '../../lib/sound';
import {
  Send,
  Sparkles,
  ShieldCheck,
  ExternalLink,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
  Bot,
  KeyRound,
} from 'lucide-react';
import { toast } from 'sonner';

interface TelegramLoginWidgetProps {
  onSuccess?: () => void;
  title?: string;
  subtitle?: string;
}

export const TelegramLoginWidget: React.FC<TelegramLoginWidgetProps> = ({
  onSuccess,
  title = 'Telegram ile Giriş Yap',
  subtitle = '3 adımda şifresiz ve anında güvenli giriş yapın.',
}) => {
  const { loginWithTelegramCode } = useAuth();
  const { settings } = useData();

  const initialBotName = (settings.telegram_bot_username || 'ShelbyOnlineBot').replace('@', '');
  const [currentBotUsername, setCurrentBotUsername] = useState(initialBotName);

  useEffect(() => {
    fetch('/api/telegram/bot-info')
      .then((r) => r.json())
      .then((data) => {
        if (data.botUsername) {
          setCurrentBotUsername(data.botUsername.replace('@', ''));
        }
      })
      .catch(() => {});
  }, []);

  const botUsername = currentBotUsername;
  const [inputCode, setInputCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleVerifyCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = inputCode.trim().replace(/\s+/g, '');
    if (!cleanCode) {
      toast.error('Lütfen 6 haneli kodu giriniz.');
      return;
    }

    soundEngine.playClick();
    setIsLoading(true);

    try {
      const success = await loginWithTelegramCode(cleanCode);
      if (success) {
        soundEngine.playWin();
        if (onSuccess) onSuccess();
      }
    } catch {
      toast.error('Giriş kodu doğrulanamadı.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full bg-[#110b24] border border-violet-700/40 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 shadow-2xl relative overflow-hidden">
      {/* Background Ambient Glow */}
      <div className="absolute -top-10 -right-10 w-36 h-36 bg-[#24A1DE]/20 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-36 h-36 bg-violet-600/15 rounded-full blur-2xl pointer-events-none" />

      {/* Header Banner - Ultra Compact */}
      <div className="text-center mb-3 relative z-10">
        <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-[#24A1DE] to-violet-600 text-white shadow-md shadow-[#24A1DE]/30 mb-1.5">
          <Send className="w-5 h-5 -translate-x-0.5 translate-y-0.5 fill-white" />
        </div>
        <h2 className="text-base sm:text-lg font-black text-white tracking-tight">{title}</h2>
        <div className="inline-flex items-center gap-1 px-2.5 py-0.5 mt-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-bold">
          <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
          <span>Girişe Özel +250 Hoş Geldin Coini</span>
        </div>
      </div>

      {/* 3 Steps Mini Badges / Progression */}
      <div className="grid grid-cols-3 gap-1.5 mb-3 relative z-10">
        <div className="p-2 rounded-xl bg-[#090518] border border-cyan-800/40 text-center flex flex-col items-center justify-center">
          <span className="w-4 h-4 rounded-full bg-[#24A1DE] text-white text-[9px] font-black flex items-center justify-center mb-1">
            1
          </span>
          <span className="text-[10px] font-bold text-slate-200 leading-tight">Botu Başlat</span>
          <span className="text-[9px] text-cyan-400 font-mono mt-0.5">/start</span>
        </div>

        <div className="p-2 rounded-xl bg-[#090518] border border-violet-800/40 text-center flex flex-col items-center justify-center">
          <span className="w-4 h-4 rounded-full bg-violet-600 text-white text-[9px] font-black flex items-center justify-center mb-1">
            2
          </span>
          <span className="text-[10px] font-bold text-slate-200 leading-tight">Kodu Al</span>
          <span className="text-[9px] text-amber-400 font-mono mt-0.5">5 Dk Geçerli</span>
        </div>

        <div className="p-2 rounded-xl bg-[#090518] border border-emerald-800/40 text-center flex flex-col items-center justify-center">
          <span className="w-4 h-4 rounded-full bg-emerald-500 text-white text-[9px] font-black flex items-center justify-center mb-1">
            3
          </span>
          <span className="text-[10px] font-bold text-slate-200 leading-tight">Doğrula & Gir</span>
          <span className="text-[9px] text-emerald-400 font-mono mt-0.5">Anında</span>
        </div>
      </div>

      {/* Action Zone */}
      <div className="space-y-2.5 relative z-10">
        {/* Step 1 Button */}
        <a
          href={`https://t.me/${botUsername}?start=login`}
          target="_blank"
          rel="noreferrer"
          onClick={() => soundEngine.playClick()}
          className="w-full py-2.5 px-3.5 rounded-xl bg-gradient-to-r from-[#24A1DE] via-[#0088cc] to-[#1e88e5] hover:from-[#1e88e5] text-white font-bold text-xs shadow-md shadow-[#24A1DE]/20 flex items-center justify-between transition-all active:scale-[0.98] cursor-pointer group"
        >
          <div className="flex items-center gap-1.5">
            <Send className="w-3.5 h-3.5 fill-white shrink-0 -translate-x-0.5" />
            <span>1. Telegram Botunu Aç (@{botUsername})</span>
          </div>
          <ExternalLink className="w-3 h-3 opacity-80 group-hover:translate-x-0.5 transition-transform shrink-0" />
        </a>

        {/* Step 2 & 3 Input Form */}
        <form onSubmit={handleVerifyCodeSubmit} className="space-y-2">
          <div className="relative">
            <input
              type="text"
              required
              maxLength={8}
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value.toUpperCase())}
              placeholder="Botun verdiği 6 haneli kod..."
              autoFocus
              className="w-full text-center text-lg sm:text-xl font-bold font-mono tracking-widest py-2.5 px-3 rounded-xl bg-[#090518] border border-violet-600/50 text-amber-400 placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:shadow-[0_0_15px_rgba(245,158,11,0.25)] transition-all uppercase"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-white font-black text-xs sm:text-sm shadow-lg shadow-emerald-950/40 transition-all flex items-center justify-center gap-1.5 active:scale-[0.98] cursor-pointer"
          >
            {isLoading ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Kodu Doğrula & Giriş Yap</span>
                <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
              </>
            )}
          </button>
        </form>
      </div>

      {/* Security Mini Note */}
      <div className="mt-2.5 pt-2 border-t border-violet-900/30 flex items-center justify-center text-[10px] text-slate-400 relative z-10">
        <div className="flex items-center gap-1">
          <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
          <span>Şifresiz 256-bit Güvenli Telegram Girişi</span>
        </div>
      </div>
    </div>
  );
};
