import React, { useState } from 'react';
import { Mail, Send, MessageSquare, ShieldCheck, Check } from 'lucide-react';
import { useData } from '../context/DataContext';
import { toast } from 'sonner';

export const ContactPage: React.FC = () => {
  const { settings } = useData();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('Sponsorluk & Reklam');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) {
      toast.error('Lütfen tüm zorunlu alanları doldurunuz.');
      return;
    }
    setSent(true);
    toast.success('Mesajınız başarıyla iletildi! Ekibimiz en kısa sürede dönüş yapacaktır.');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-12">
      {/* Header */}
      <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-r from-purple-950/60 via-[#120b24] to-[#070510] border border-violet-800/30 text-center relative overflow-hidden">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/20 text-violet-300 text-xs font-bold border border-violet-500/30 mb-3">
          <MessageSquare className="w-3.5 h-3.5 text-violet-400" />
          7/24 İLETİŞİM & SPONSORLUK
        </div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight">
          Bizimle İletişime Geçin
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-slate-300 max-w-xl mx-auto">
          Sponsorluk anlaşmaları, reklam yerleşimi veya kullanıcı destek talepleri için formu doldurabilirsiniz.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Contact Info (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-6 rounded-3xl bg-[#120b24] border border-violet-800/30 space-y-4">
            <h3 className="text-base font-bold text-white">Resmi Kanallarımız</h3>

            <div className="space-y-3 text-xs">
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-violet-950/30 border border-violet-900/30">
                <div className="w-10 h-10 rounded-xl bg-violet-600/20 text-violet-300 flex items-center justify-center">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-slate-400 text-[11px]">E-posta Destek</span>
                  <p className="text-white font-bold">{settings.support_email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-2xl bg-violet-950/30 border border-violet-900/30">
                <div className="w-10 h-10 rounded-xl bg-violet-600/20 text-violet-300 flex items-center justify-center">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-slate-400 text-[11px]">Telegram Sponsorluk & Reklam</span>
                  <p className="text-white font-bold">{settings.telegram_channel_url ? '@SponsorHubVIP' : '@destek'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Form (7 cols) */}
        <div className="lg:col-span-7 p-6 sm:p-8 rounded-3xl bg-[#120b24] border border-violet-800/30 shadow-xl">
          {sent ? (
            <div className="text-center py-12 space-y-3">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                <Check className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-white">Mesajınız Alındı</h3>
              <p className="text-xs text-slate-300 max-w-sm mx-auto">
                En geç 24 saat içerisinde belirtmiş olduğunuz e-posta adresi üzerinden iletişime geçeceğiz.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Adınız / Kurum</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Adınız veya Markanız"
                    className="w-full p-3 rounded-xl bg-[#0d0918] border border-violet-800/40 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">E-posta Adresiniz</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ornek@domain.com"
                    className="w-full p-3 rounded-xl bg-[#0d0918] border border-violet-800/40 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-violet-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Konu</label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full p-3 rounded-xl bg-[#0d0918] border border-violet-800/40 text-white text-xs focus:outline-none focus:border-violet-500"
                >
                  <option value="Sponsorluk & Reklam">Sponsorluk & Banner Reklamı</option>
                  <option value="Bonus & Kampanya Ekleme">Bonus & Kampanya Ekleme</option>
                  <option value="Genel Destek">Genel Destek & Şikayet</option>
                  <option value="Diğer">Diğer</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Mesajınız</label>
                <textarea
                  required
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Detayları buraya yazınız..."
                  className="w-full p-3 rounded-xl bg-[#0d0918] border border-violet-800/40 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-violet-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 text-white font-bold text-xs shadow-lg shadow-violet-900/50 hover:scale-[1.01] transition-all"
              >
                Mesajı Gönder
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
