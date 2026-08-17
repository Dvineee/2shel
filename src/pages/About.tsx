import React from 'react';
import { ShieldCheck, Award, Users, HeartHandshake, Sparkles } from 'lucide-react';
import { useData } from '../context/DataContext';

export const AboutPage: React.FC = () => {
  const { settings } = useData();

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-12">
      {/* Header Banner */}
      <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-r from-purple-950/60 via-[#120b24] to-[#070510] border border-violet-800/30 text-center relative overflow-hidden">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/20 text-violet-300 text-xs font-bold border border-violet-500/30 mb-3">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          GÜVEN VE ŞEFFAFLIK İLKEMİZ
        </div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight">
          Hakkımızda & Misyonumuz
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-slate-300 max-w-xl mx-auto">
          {settings.site_name || 'ShelbyOnline'}, sektörün en güvenilir ve doğrulanmış platformlarını toplulukla buluşturan bağımsız bir sponsor & kampanya ekosistemidir.
        </p>
      </div>

      {/* 3 Value Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-3xl bg-[#120b24] border border-violet-800/30 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white">100% Doğrulanmış Lisans</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Yalnızca uluslararası geçerliliğe sahip lisansları bulunan ve hızlı ödeme garantisi sunan platformları listeliyoruz.
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-[#120b24] border border-violet-800/30 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white">Özel Topluluk Avantajları</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Kullanıcılarımıza özel çevrimsiz deneme bonusları, hediye çarkı ve coin mağazası fırsatları sunuyoruz.
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-[#120b24] border border-violet-800/30 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-violet-500/20 text-violet-400 flex items-center justify-center">
            <HeartHandshake className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white">Şeffaf Oyuncu Hakları</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Üyelerimizin her türlü soru ve talebinde 7/24 destek olarak aracı ve çözüm odaklı bir köprü kuruyoruz.
          </p>
        </div>
      </div>
    </div>
  );
};
