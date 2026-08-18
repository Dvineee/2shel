import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/db';
import { StoreProduct, StoreOrder, PayoutType } from '../types';
import {
  ShoppingBag,
  Coins,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
  XCircle,
  CreditCard,
  Wallet,
  Building,
  UserCheck,
  History,
  X,
} from 'lucide-react';
import { formatCoin } from '../lib/utils';
import { soundEngine } from '../lib/sound';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

export const StorePage: React.FC = () => {
  const { storeProducts, settings, refreshAll } = useData();
  const { user, refreshProfile } = useAuth();

  const [selectedProduct, setSelectedProduct] = useState<StoreProduct | null>(null);
  const [payoutType, setPayoutType] = useState<PayoutType>('trx');
  const [trxAddress, setTrxAddress] = useState('');
  const [ibanNumber, setIbanNumber] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [bankName, setBankName] = useState('');
  const [deliveryNote, setDeliveryNote] = useState('');
  const [purchasing, setPurchasing] = useState(false);

  // User's own orders history
  const [myOrders, setMyOrders] = useState<StoreOrder[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(false);

  const loadMyOrders = async () => {
    if (!user) return;
    setLoadingOrders(true);
    try {
      const allOrders = await db.getStoreOrders();
      const userOrders = allOrders.filter((o) => o.user_id === user.id);
      setMyOrders(userOrders);
    } catch {
      // ignore
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadMyOrders();
    }
    const handleDbChange = () => {
      if (user) {
        loadMyOrders();
      }
    };
    window.addEventListener('sponsorhub_db_change', handleDbChange);
    window.addEventListener('storage', handleDbChange);
    return () => {
      window.removeEventListener('sponsorhub_db_change', handleDbChange);
      window.removeEventListener('storage', handleDbChange);
    };
  }, [user]);

  // Lock body scroll when modal is open on mobile
  useEffect(() => {
    if (selectedProduct) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [selectedProduct]);

  const handleOpenPurchase = (product: StoreProduct) => {
    if (!user) {
      soundEngine.playError();
      toast.error('Mağazadan alışveriş yapabilmek için lütfen önce giriş yapınız.');
      return;
    }

    if (user.coin_balance < product.coin_price) {
      soundEngine.playError();
      const missingCoins = product.coin_price - user.coin_balance;
      toast.error(
        `Bakiye Yetersiz! Bu ödülü satın almak için ${formatCoin(product.coin_price)} Coin gerekiyor. (Mevcut: ${formatCoin(user.coin_balance)} Coin, Eksik: ${formatCoin(missingCoins)} Coin)`,
        { duration: 4500 }
      );
      return;
    }

    soundEngine.playClick();
    setSelectedProduct(product);
  };

  const handlePurchase = async () => {
    if (!user || !selectedProduct) return;

    if (user.coin_balance < selectedProduct.coin_price) {
      soundEngine.playError();
      const missingCoins = selectedProduct.coin_price - user.coin_balance;
      toast.error(`Bakiye Yetersiz! ${formatCoin(missingCoins)} Coin daha gerekiyor.`);
      return;
    }

    // Validation
    if (payoutType === 'trx') {
      const cleanTrx = trxAddress.trim();
      if (!cleanTrx) {
        soundEngine.playError();
        toast.error('Lütfen geçerli bir TRX / TRC-20 cüzdan adresi giriniz.');
        return;
      }
      if (cleanTrx.length < 20) {
        soundEngine.playError();
        toast.error('TRX / TRC-20 cüzdan adresi eksik veya geçersiz görünüyor.');
        return;
      }
    } else {
      const cleanIban = ibanNumber.trim().replace(/\s+/g, '');
      const cleanHolder = accountHolder.trim();

      if (!cleanIban) {
        soundEngine.playError();
        toast.error('Lütfen IBAN numaranızı eksiksiz giriniz.');
        return;
      }
      if (!cleanHolder) {
        soundEngine.playError();
        toast.error('Lütfen IBAN hesap sahibinin Ad ve Soyadını giriniz.');
        return;
      }
      if (cleanIban.length < 15) {
        soundEngine.playError();
        toast.error('Girdiğiniz IBAN numarası çok kısa veya geçersiz.');
        return;
      }
    }

    setPurchasing(true);
    try {
      const payoutAddress = payoutType === 'trx' ? trxAddress.trim() : ibanNumber.trim();
      const res = await db.purchaseProduct(user.id, user.username, selectedProduct.id, {
        payout_type: payoutType,
        payout_address: payoutAddress,
        payout_holder_name: payoutType === 'iban' ? accountHolder.trim() : undefined,
        payout_bank_name: payoutType === 'iban' && bankName.trim() ? bankName.trim() : undefined,
        delivery_note: deliveryNote.trim(),
      });

      if (res.success) {
        soundEngine.playSuccess();
        toast.success(res.message);
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
        });

        // Reset form
        setSelectedProduct(null);
        setTrxAddress('');
        setIbanNumber('');
        setAccountHolder('');
        setBankName('');
        setDeliveryNote('');

        await refreshProfile();
        await refreshAll();
        await loadMyOrders();
      } else {
        soundEngine.playError();
        toast.error(res.message);
      }
    } catch {
      soundEngine.playError();
      toast.error('Satın alma işlemi sırasında bir hata oluştu');
    } finally {
      setPurchasing(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300 pb-12">
      {/* Header Banner */}
      <div className="p-5 sm:p-7 md:p-8 rounded-3xl bg-gradient-to-r from-amber-950/60 via-[#120b24] to-[#070510] border border-amber-800/30 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden shadow-2xl">
        <div className="max-w-xl space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30">
            <ShoppingBag className="w-3.5 h-3.5 text-amber-400" />
            ÖZEL DİJİTAL MAĞAZA & ÖDÜL MERKEZİ
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {settings?.site_name || 'SHELBYONLINE'} Coin Mağazası
          </h1>
          <p className="text-xs sm:text-sm text-slate-300">
            Kazandığınız Shelby Coinleri nakite veya dijital hediyelere dönüştürün. Siparişleriniz TRX (TRC-20) veya TR IBAN hesabınıza güvenle teslim edilir.
          </p>
        </div>

        {user && (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="p-3.5 sm:p-4 rounded-2xl bg-[#0d0918]/90 border border-amber-500/30 text-right flex sm:flex-col items-center sm:items-end justify-between shadow-inner">
              <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Kullanılabilir Bakiye</span>
              <div className="flex items-center gap-2 text-xl sm:text-2xl font-black text-amber-400 mt-0.5 sm:mt-1">
                <Coins className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400 animate-pulse" />
                <span>{formatCoin(user.coin_balance)}</span>
              </div>
            </div>

            <button
              onClick={() => {
                soundEngine.playClick();
                setShowHistory(!showHistory);
                if (!showHistory) loadMyOrders();
              }}
              className={`px-4 py-3 rounded-2xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                showHistory
                  ? 'bg-amber-500 text-slate-950 border-amber-400 font-black shadow-lg shadow-amber-500/30'
                  : 'bg-violet-950/60 border-violet-800/40 text-violet-200 hover:text-white hover:bg-violet-900/60'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Siparişlerim ({myOrders.length})</span>
            </button>
          </div>
        )}
      </div>

      {/* User Orders History Section (Collapsible) */}
      {showHistory && user && (
        <div className="p-5 sm:p-6 rounded-3xl bg-[#120b24] border border-amber-500/30 shadow-2xl space-y-4 animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center justify-between border-b border-violet-900/40 pb-3">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-amber-400" />
              <h2 className="text-base font-black text-white">Geçmiş Satın Alımlarım</h2>
            </div>
            <button
              onClick={() => setShowHistory(false)}
              className="text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              Kapat
            </button>
          </div>

          {loadingOrders ? (
            <div className="py-8 text-center text-xs text-slate-400 animate-pulse">
              Siparişleriniz yükleniyor...
            </div>
          ) : myOrders.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              Henüz verilmiş bir siparişiniz bulunmamaktadır.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {myOrders.map((ord) => {
                const isCompleted = ord.status === 'completed';
                const isCancelled = ord.status === 'cancelled' || ord.status === 'rejected';
                const isPending = ord.status === 'pending';

                return (
                  <div
                    key={ord.id}
                    className="p-4 rounded-2xl bg-[#090614] border border-violet-800/30 flex flex-col justify-between gap-3 hover:border-violet-600/50 transition-all"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-sm font-bold text-white">{ord.product_name}</h4>
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                          <span>{new Date(ord.created_at).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                          <span>•</span>
                          <span className="font-bold text-amber-400">{formatCoin(ord.coin_price)} Coin</span>
                        </div>
                      </div>

                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase flex items-center gap-1 shrink-0 ${
                          isCompleted
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm shadow-emerald-950/50'
                            : isCancelled
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        }`}
                      >
                        {isCompleted && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                        {isCancelled && <XCircle className="w-3.5 h-3.5 text-rose-400" />}
                        {isPending && <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />}
                        <span>{isCompleted ? 'Teslim Edildi' : isCancelled ? 'İptal / İade Edildi' : 'İnceleniyor / Hazırlanıyor'}</span>
                      </span>
                    </div>

                    {/* Delivery & Payout Info */}
                    <div className="p-2.5 rounded-xl bg-violet-950/40 border border-violet-900/30 text-[11px] space-y-1">
                      <div className="flex items-center justify-between text-slate-400">
                        <span className="font-semibold">Ödeme / Teslimat:</span>
                        <span className="font-bold text-violet-300 uppercase">
                          {ord.payout_type === 'trx' ? '⚡ TRX / TRC-20' : '🏦 Banka IBAN'}
                        </span>
                      </div>
                      <div className="font-mono text-slate-300 break-all text-[10px]">
                        {ord.payout_address}
                      </div>
                      {ord.payout_holder_name && (
                        <div className="text-slate-400 text-[10px]">
                          Hesap Sahibi: <span className="text-white font-medium">{ord.payout_holder_name}</span>
                        </div>
                      )}
                    </div>

                    {/* Admin Delivery Note / TXID Info if delivered or note attached */}
                    {ord.admin_note && (
                      <div className="p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-700/40 text-[11px] space-y-0.5">
                        <div className="text-emerald-400 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Yönetici Teslimat Notu:</span>
                        </div>
                        <p className="text-slate-200 text-[10px] break-all">{ord.admin_note}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {storeProducts.map((product) => {
          const hasEnoughCoins = user ? user.coin_balance >= product.coin_price : false;
          const isOutOfStock = product.stock <= 0;

          return (
            <div
              key={product.id}
              className="rounded-3xl bg-[#120b24] border border-violet-800/30 hover:border-amber-500/60 p-4 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-amber-900/20 group"
            >
              {/* Image Box */}
              <div className="relative h-44 w-full rounded-2xl overflow-hidden bg-violet-950/40 mb-3.5">
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                <span className="absolute top-2 right-2 px-2.5 py-0.5 rounded-full bg-black/80 backdrop-blur-sm text-[10px] font-bold text-slate-300 border border-white/10">
                  Stok: {product.stock}
                </span>

                {user && !hasEnoughCoins && !isOutOfStock && (
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-rose-950/80 backdrop-blur-sm text-[10px] font-bold text-rose-300 border border-rose-500/30 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Bakiye Yetersiz
                  </span>
                )}
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
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Tutar</span>
                    <span className="text-sm font-black text-amber-400 flex items-center gap-1">
                      <Coins className="w-3.5 h-3.5 text-amber-400" />
                      {formatCoin(product.coin_price)} Coin
                    </span>
                  </div>

                  <button
                    onClick={() => handleOpenPurchase(product)}
                    disabled={isOutOfStock}
                    className={`px-4 py-2 rounded-xl font-black text-xs shadow-md transition-all cursor-pointer ${
                      isOutOfStock
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        : user && !hasEnoughCoins
                        ? 'bg-violet-950/80 hover:bg-rose-950/80 text-rose-200 border border-rose-800/40 hover:border-rose-500/60'
                        : 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 shadow-amber-500/30 hover:scale-105'
                    }`}
                  >
                    {isOutOfStock ? 'Tükendi' : user && !hasEnoughCoins ? 'Bakiye Yetersiz' : 'Satın Al'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Purchase Confirmation & Payout Details Modal (Full Mobile-Responsive Sheet) */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full sm:max-w-lg max-h-[92vh] sm:max-h-[90vh] flex flex-col rounded-t-[28px] sm:rounded-3xl bg-gradient-to-b from-[#180f33] via-[#100a22] to-[#090514] border-t sm:border border-amber-500/40 shadow-2xl overflow-hidden animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-violet-900/40 bg-[#120b24]/90 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-white leading-none">
                    Satın Alma & Teslimat
                  </h3>
                  <span className="text-[10px] text-amber-400/80 font-medium">
                    {settings?.site_name || 'ShelbyOnline'} Ödül Sistemi
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  setSelectedProduct(null);
                }}
                className="w-8 h-8 rounded-xl bg-violet-950/80 hover:bg-violet-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-violet-800/40"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {/* Product Summary */}
              <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-violet-950/40 border border-violet-900/40 shadow-inner">
                <img
                  src={selectedProduct.image_url}
                  alt={selectedProduct.name}
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl object-cover shrink-0 border border-violet-800/40"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs sm:text-sm font-bold text-white truncate">{selectedProduct.name}</h4>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className="text-xs text-amber-400 font-black flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20">
                      <Coins className="w-3.5 h-3.5" />
                      {formatCoin(selectedProduct.coin_price)} Coin
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Kalan: <strong className="text-slate-200">{formatCoin((user?.coin_balance || 0) - selectedProduct.coin_price)}</strong> Coin
                    </span>
                  </div>
                </div>
              </div>

              {/* Payout / Delivery Method Selector */}
              <div className="space-y-2">
                <label className="block text-xs font-black text-amber-300 uppercase tracking-wider">
                  Teslimat / Çekim Yöntemi <span className="text-rose-400">*</span>
                </label>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playClick();
                      setPayoutType('trx');
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                      payoutType === 'trx'
                        ? 'bg-gradient-to-br from-purple-900/50 to-violet-950/80 border-purple-500 text-white shadow-lg shadow-purple-900/30'
                        : 'bg-[#090614] border-violet-900/40 text-slate-400 hover:border-violet-700 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-black text-xs text-purple-300">
                        <Wallet className="w-4 h-4 text-purple-400" />
                        <span>TRX / USDT</span>
                      </div>
                      {payoutType === 'trx' && <CheckCircle2 className="w-4 h-4 text-purple-400" />}
                    </div>
                    <span className="text-[10px] text-slate-400">TRC-20 Cüzdan</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playClick();
                      setPayoutType('iban');
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                      payoutType === 'iban'
                        ? 'bg-gradient-to-br from-emerald-950/60 to-teal-950/80 border-emerald-500 text-white shadow-lg shadow-emerald-900/30'
                        : 'bg-[#090614] border-violet-900/40 text-slate-400 hover:border-violet-700 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-black text-xs text-emerald-300">
                        <Building className="w-4 h-4 text-emerald-400" />
                        <span>BANKA IBAN</span>
                      </div>
                      {payoutType === 'iban' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                    </div>
                    <span className="text-[10px] text-slate-400">TR Havale / FAST</span>
                  </button>
                </div>
              </div>

              {/* Mandatory Payout Fields based on Selection */}
              <div className="space-y-3 p-3.5 sm:p-4 rounded-2xl bg-[#090614] border border-violet-800/40">
                {payoutType === 'trx' ? (
                  <div>
                    <label className="block text-xs font-bold text-white mb-1.5 flex items-center justify-between">
                      <span>TRX / TRC-20 Cüzdan Adresiniz</span>
                      <span className="text-[10px] text-rose-400 font-bold">* Zorunlu</span>
                    </label>
                    <div className="relative">
                      <Wallet className="w-4 h-4 text-purple-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={trxAddress}
                        onChange={(e) => setTrxAddress(e.target.value)}
                        placeholder="Örn: TYDzpheaF27xHsj... (TRC-20 Adresi)"
                        className="w-full pl-9 pr-4 py-2.5 text-xs font-mono rounded-xl bg-[#120b24] border border-violet-700/60 text-white placeholder-slate-500 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1.5">
                      Ödül bakiyeniz Tron (TRC-20) ağı üzerinden bu cüzdana gönderilecektir.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-white mb-1.5 flex items-center justify-between">
                        <span>IBAN Numarası</span>
                        <span className="text-[10px] text-rose-400 font-bold">* Zorunlu</span>
                      </label>
                      <div className="relative">
                        <CreditCard className="w-4 h-4 text-emerald-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          required
                          value={ibanNumber}
                          onChange={(e) => setIbanNumber(e.target.value)}
                          placeholder="TR00 0000 0000 0000 0000 0000 00"
                          className="w-full pl-9 pr-4 py-2.5 text-xs font-mono uppercase rounded-xl bg-[#120b24] border border-violet-700/60 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-white mb-1.5 flex items-center justify-between">
                        <span>Hesap Sahibi Adı ve Soyadı</span>
                        <span className="text-[10px] text-rose-400 font-bold">* Zorunlu</span>
                      </label>
                      <div className="relative">
                        <UserCheck className="w-4 h-4 text-emerald-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          required
                          value={accountHolder}
                          onChange={(e) => setAccountHolder(e.target.value)}
                          placeholder="Banka hesabındaki Ad Soyad"
                          className="w-full pl-9 pr-4 py-2.5 text-xs rounded-xl bg-[#120b24] border border-violet-700/60 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        <span>Banka Adı (Opsiyonel)</span>
                      </label>
                      <input
                        type="text"
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        placeholder="Örn: Garanti BBVA, Ziraat, Papara, Enpara..."
                        className="w-full px-3.5 py-2 text-xs rounded-xl bg-[#120b24] border border-violet-800/40 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Delivery Note (Optional) */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Ek Teslimat Notu (Opsiyonel)
                </label>
                <textarea
                  value={deliveryNote}
                  onChange={(e) => setDeliveryNote(e.target.value)}
                  placeholder="Örn: Telegram kullanıcı adım: @kullaniciadi"
                  rows={2}
                  className="w-full p-2.5 text-xs rounded-xl bg-[#090614] border border-violet-800/40 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>
            </div>

            {/* Modal Sticky Bottom Actions */}
            <div className="flex items-center gap-2.5 p-4 border-t border-violet-900/40 bg-[#0c071a] shrink-0">
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  setSelectedProduct(null);
                }}
                className="flex-1 py-2.5 sm:py-3 rounded-xl border border-violet-800 text-slate-300 hover:bg-violet-900/30 text-xs font-bold transition-colors cursor-pointer"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={handlePurchase}
                disabled={purchasing}
                className="flex-2 py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 text-xs font-black shadow-lg shadow-amber-500/30 hover:scale-[1.01] active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              >
                {purchasing ? 'İşleniyor...' : 'Siparişi Onayla'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
