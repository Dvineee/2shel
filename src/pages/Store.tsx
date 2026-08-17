import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/db';
import { StoreProduct } from '../types';
import { ShoppingBag, Coins, Check, AlertCircle, Sparkles, Package } from 'lucide-react';
import { formatCoin } from '../lib/utils';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

export const StorePage: React.FC = () => {
  const { storeProducts, refreshAll } = useData();
  const { user, refreshProfile } = useAuth();

  const [selectedProduct, setSelectedProduct] = useState<StoreProduct | null>(null);
  const [deliveryNote, setDeliveryNote] = useState('');
  const [purchasing, setPurchasing] = useState(false);

  const handlePurchase = async () => {
    if (!user || !selectedProduct) return;

    if (user.coin_balance < selectedProduct.coin_price) {
      toast.error(`Yetersiz bakiye! Bu ürün için ${selectedProduct.coin_price} Coin gerekiyor.`);
      return;
    }

    setPurchasing(true);
    try {
      const res = await db.purchaseProduct(
        user.id,
        user.username,
        selectedProduct.id,
        deliveryNote
      );

      if (res.success) {
        toast.success(res.message);
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
        setSelectedProduct(null);
        setDeliveryNote('');
        await refreshProfile();
        await refreshAll();
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error('Satın alma işlemi tamamlanamadı');
    } finally {
      setPurchasing(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-12">
      {/* Header Banner */}
      <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-r from-amber-950/60 via-[#120b24] to-[#070510] border border-amber-800/30 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="max-w-xl space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30">
            <ShoppingBag className="w-3.5 h-3.5 text-amber-400" />
            ÖZEL DİJİTAL MAĞAZA
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            SponsorHub Coin Mağazası
          </h1>
          <p className="text-xs sm:text-sm text-slate-300">
            Topladığınız coinlerle Steam cüzdan kodları, Trendyol alışveriş çekleri ve VIP üyelikler satın alın.
          </p>
        </div>

        {user && (
          <div className="p-4 rounded-2xl bg-[#0d0918] border border-amber-500/30 text-right flex md:flex-col items-center md:items-end justify-between">
            <span className="text-xs text-slate-400">Kullanılabilir Bakiyeniz</span>
            <div className="flex items-center gap-2 text-xl sm:text-2xl font-black text-amber-400 mt-1">
              <Coins className="w-6 h-6" />
              <span>{formatCoin(user.coin_balance)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {storeProducts.map((product) => (
          <div
            key={product.id}
            className="rounded-3xl bg-[#120b24] border border-violet-800/30 hover:border-amber-500/60 p-4 flex flex-col transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-amber-900/20 group"
          >
            {/* Image Box */}
            <div className="relative h-40 w-full rounded-2xl overflow-hidden bg-violet-950/40 mb-3.5">
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
              <span className="absolute top-2 right-2 px-2.5 py-0.5 rounded-full bg-black/70 backdrop-blur-sm text-[10px] font-bold text-slate-300 border border-white/10">
                Stok: {product.stock}
              </span>
            </div>

            {/* Content */}
            <div className="flex flex-col flex-1">
              <h3 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
                {product.name}
              </h3>
              <p className="text-xs text-slate-400 mt-1.5 line-clamp-2 flex-1">
                {product.description}
              </p>

              {/* Price & Action */}
              <div className="mt-4 pt-3 border-t border-violet-900/30 flex items-center justify-between gap-2">
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Fiyat</span>
                  <span className="text-sm font-black text-amber-400">
                    {formatCoin(product.coin_price)} Coin
                  </span>
                </div>

                <button
                  onClick={() => setSelectedProduct(product)}
                  disabled={product.stock <= 0}
                  className={`px-4 py-2 rounded-xl font-bold text-xs shadow-md transition-all ${
                    product.stock <= 0
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 shadow-amber-500/30 hover:scale-105'
                  }`}
                >
                  {product.stock <= 0 ? 'Tükendi' : 'Satın Al'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Purchase Confirmation Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="max-w-md w-full rounded-3xl bg-[#120b24] border border-amber-500/40 p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              Siparişi Onayla
            </h3>

            <div className="flex items-center gap-3 p-3 rounded-2xl bg-violet-950/40 border border-violet-900/40">
              <img
                src={selectedProduct.image_url}
                alt={selectedProduct.name}
                className="w-16 h-16 rounded-xl object-cover"
              />
              <div>
                <h4 className="text-sm font-bold text-white">{selectedProduct.name}</h4>
                <p className="text-xs text-amber-400 font-bold mt-0.5">
                  Tutar: {formatCoin(selectedProduct.coin_price)} Coin
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Teslimat Notu / E-posta veya Telegram ID (Opsiyonel)
              </label>
              <textarea
                value={deliveryNote}
                onChange={(e) => setDeliveryNote(e.target.value)}
                placeholder="Örn: Kodumu telegram @kullaniciadi adresime iletiniz..."
                rows={2}
                className="w-full p-3 text-xs rounded-xl bg-[#0d0918] border border-violet-800/30 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedProduct(null)}
                className="flex-1 py-2.5 rounded-xl border border-violet-800 text-slate-300 hover:bg-violet-900/30 text-xs font-bold transition-colors"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={handlePurchase}
                disabled={purchasing}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 text-xs font-black shadow-lg shadow-amber-500/30 hover:scale-105 transition-all"
              >
                {purchasing ? 'İşleniyor...' : 'Onayla & Satın Al'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
