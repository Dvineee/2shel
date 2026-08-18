import React, { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { db } from '../../lib/db';
import { StoreProduct, StoreOrder } from '../../types';
import {
  ShoppingBag,
  Plus,
  Edit2,
  Trash2,
  X,
  Coins,
  Package,
  CheckCircle2,
  Clock,
  XCircle,
  Copy,
  Check,
  Search,
  Wallet,
  Building,
  CreditCard,
  User,
  Filter,
  RefreshCw,
  ExternalLink,
  MessageSquare,
  AlertCircle,
  FileCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatCoin } from '../../lib/utils';
import { ImageUploadField } from '../../components/common/ImageUploadField';
import { soundEngine } from '../../lib/sound';

export const StoreManager: React.FC = () => {
  const { storeProducts, refreshAll } = useData();

  // Active Main Tab: 'orders' | 'products'
  const [activeTab, setActiveTab] = useState<'orders' | 'products'>('orders');

  // Orders State
  const [orders, setOrders] = useState<StoreOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState<boolean>(false);
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<'all' | 'pending' | 'completed' | 'cancelled' | 'trx' | 'iban'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Selected Order Modal for Detailed View & Admin Notes
  const [selectedOrder, setSelectedOrder] = useState<StoreOrder | null>(null);
  const [adminNoteInput, setAdminNoteInput] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  // Products State
  const [editingProduct, setEditingProduct] = useState<Partial<StoreProduct> | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [coinPrice, setCoinPrice] = useState(500);
  const [stock, setStock] = useState(50);
  const [imageUrl, setImageUrl] = useState('');
  const [category, setCategory] = useState('gift_card');
  const [active, setActive] = useState(true);

  // Load Orders
  const loadOrders = async () => {
    setLoadingOrders(true);
    try {
      const allOrders = await db.getStoreOrders();
      setOrders(allOrders);
    } catch {
      toast.error('Siparişler yüklenemedi');
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleCopy = (text: string, id: string) => {
    soundEngine.playClick();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Panoya kopyalandı!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleUpdateOrderStatus = async (
    orderId: string,
    newStatus: 'pending' | 'completed' | 'cancelled' | 'rejected',
    note?: string
  ) => {
    soundEngine.playClick();
    setUpdatingOrderId(orderId);
    setUpdatingStatus(true);

    // Optimistic UI update so table and buttons update immediately on 1st click
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status: newStatus,
              admin_note: note !== undefined ? note : o.admin_note,
              updated_at: new Date().toISOString(),
            }
          : o
      )
    );

    try {
      const updated = await db.updateStoreOrderStatus(orderId, newStatus, note);
      if (updated) {
        toast.success(
          newStatus === 'completed'
            ? 'Sipariş tamamlandı ve TESLİM EDİLDİ olarak kaydedildi!'
            : newStatus === 'cancelled' || newStatus === 'rejected'
            ? 'Sipariş iptal edildi ve coinler kullanıcıya iade edildi.'
            : 'Sipariş durumu güncellendi.'
        );
        setSelectedOrder(null);
      }
    } catch {
      toast.error('Sipariş durumu güncellenirken hata oluştu');
    } finally {
      setUpdatingStatus(false);
      setUpdatingOrderId(null);
      await loadOrders();
      await refreshAll();
    }
  };

  // Product Handlers
  const openNew = () => {
    soundEngine.playClick();
    setIsNew(true);
    setEditingProduct({});
    setName('500 TL Steam Cüzdan Kodu');
    setDescription('Tüm Steam oyunlarında geçerli dijital bakiye kodu.');
    setCoinPrice(1000);
    setStock(25);
    setImageUrl('https://images.unsplash.com/photo-1612287233221-a47781b0a880?auto=format&fit=crop&w=400&h=300&q=80');
    setCategory('gift_card');
    setActive(true);
  };

  const openEdit = (p: StoreProduct) => {
    soundEngine.playClick();
    setIsNew(false);
    setEditingProduct(p);
    setName(p.name);
    setDescription(p.description || '');
    setCoinPrice(p.coin_price);
    setStock(p.stock);
    setImageUrl(p.image_url);
    setCategory(p.category || 'gift_card');
    setActive(p.active);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    soundEngine.playClick();
    const data: Partial<StoreProduct> = {
      name,
      description,
      coin_price: Number(coinPrice),
      stock: Number(stock),
      image_url: imageUrl,
      category,
      active,
    };

    try {
      if (isNew) {
        await db.createStoreProduct(data as any);
        toast.success('Yeni ürün mağazaya eklendi!');
      } else if (editingProduct?.id) {
        await db.updateStoreProduct(editingProduct.id, data);
        toast.success('Ürün güncellendi!');
      }
      setEditingProduct(null);
      await refreshAll();
    } catch {
      toast.error('İşlem başarısız');
    }
  };

  const handleDeleteProduct = async (id: string, productName: string) => {
    soundEngine.playClick();
    if (window.confirm(`"${productName}" ürününü silmek istediğinizden emin misiniz?`)) {
      await db.deleteStoreProduct(id);
      toast.success('Ürün silindi');
      await refreshAll();
    }
  };

  // Filter Orders
  const filteredOrders = orders.filter((order) => {
    // Search match
    const q = orderSearch.toLowerCase().trim();
    const matchesSearch =
      !q ||
      order.username?.toLowerCase().includes(q) ||
      order.product_name?.toLowerCase().includes(q) ||
      order.payout_address?.toLowerCase().includes(q) ||
      order.payout_holder_name?.toLowerCase().includes(q) ||
      order.id.toLowerCase().includes(q);

    if (!matchesSearch) return false;

    // Status / Type filter
    if (orderStatusFilter === 'all') return true;
    if (orderStatusFilter === 'pending') return order.status === 'pending';
    if (orderStatusFilter === 'completed') return order.status === 'completed';
    if (orderStatusFilter === 'cancelled') return order.status === 'cancelled' || order.status === 'rejected';
    if (orderStatusFilter === 'trx') return order.payout_type === 'trx';
    if (orderStatusFilter === 'iban') return order.payout_type === 'iban';

    return true;
  });

  // Statistics
  const totalOrdersCount = orders.length;
  const pendingOrdersCount = orders.filter((o) => o.status === 'pending').length;
  const completedOrdersCount = orders.filter((o) => o.status === 'completed').length;
  const totalSpentCoins = orders.reduce((sum, o) => sum + (o.coin_price || 0), 0);

  return (
    <div className="space-y-6 animate-in fade-in pb-12">
      {/* Top Header & Tab Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
            <ShoppingBag className="w-6 h-6 text-amber-400" />
            <span>Mağaza & Sipariş Yönetimi</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Kullanıcıların satın aldığı ürünleri, TRX/IBAN ödeme bilgilerini görüntüleyin ve teslimat durumlarını yönetin.
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex items-center gap-2 p-1 rounded-2xl bg-[#120b24] border border-violet-800/40">
          <button
            onClick={() => {
              soundEngine.playClick();
              setActiveTab('orders');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'orders'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Siparişler & Satın Alımlar ({orders.length})</span>
            {pendingOrdersCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center font-bold">
                {pendingOrdersCount}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              soundEngine.playClick();
              setActiveTab('products');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'products'
                ? 'bg-violet-600 text-white shadow-md shadow-violet-900/50'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Ürün Kataloğu ({storeProducts.length})</span>
          </button>
        </div>
      </div>

      {/* TAB 1: ORDERS & PURCHASES */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="p-4 rounded-2xl bg-[#120b24] border border-violet-800/30">
              <span className="text-[10px] uppercase font-bold text-slate-400">Toplam Sipariş</span>
              <div className="text-xl font-black text-white mt-1">{totalOrdersCount}</div>
            </div>

            <div className="p-4 rounded-2xl bg-[#120b24] border border-amber-500/30">
              <span className="text-[10px] uppercase font-bold text-amber-400">Bekleyen / İncelenen</span>
              <div className="text-xl font-black text-amber-300 mt-1 flex items-center gap-1.5">
                <span>{pendingOrdersCount}</span>
                {pendingOrdersCount > 0 && <Clock className="w-4 h-4 animate-spin text-amber-400" />}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#120b24] border border-emerald-500/30">
              <span className="text-[10px] uppercase font-bold text-emerald-400">Teslim Edilen</span>
              <div className="text-xl font-black text-emerald-300 mt-1">{completedOrdersCount}</div>
            </div>

            <div className="p-4 rounded-2xl bg-[#120b24] border border-violet-800/30">
              <span className="text-[10px] uppercase font-bold text-slate-400">Harcanan Toplam Coin</span>
              <div className="text-xl font-black text-amber-400 mt-1 flex items-center gap-1">
                <Coins className="w-4 h-4" />
                <span>{formatCoin(totalSpentCoins)}</span>
              </div>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="p-4 rounded-2xl bg-[#120b24] border border-violet-800/30 flex flex-col md:flex-row items-center justify-between gap-3 shadow-lg">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-violet-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                placeholder="Kullanıcı, ürün adı, TRX cüzdanı veya IBAN ara..."
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#090614] border border-violet-800/40 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
              {[
                { id: 'all', label: `Tümü (${orders.length})` },
                { id: 'pending', label: `⏳ Bekleyen (${pendingOrdersCount})` },
                { id: 'completed', label: `✅ Tamamlanan (${completedOrdersCount})` },
                { id: 'cancelled', label: `❌ İptal/Red` },
                { id: 'trx', label: `⚡ TRX / USDT` },
                { id: 'iban', label: `🏦 Banka IBAN` },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    soundEngine.playClick();
                    setOrderStatusFilter(tab.id as any);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    orderStatusFilter === tab.id
                      ? 'bg-amber-500 text-slate-950 font-black shadow'
                      : 'bg-[#090614] text-slate-400 hover:text-white border border-violet-900/40'
                  }`}
                >
                  {tab.label}
                </button>
              ))}

              <button
                onClick={loadOrders}
                className="p-2 rounded-lg bg-violet-950/60 hover:bg-violet-800 text-violet-300 hover:text-white transition-colors cursor-pointer"
                title="Yenile"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingOrders ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Orders Table */}
          <div className="rounded-3xl bg-[#120b24] border border-violet-800/30 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-violet-950/60 text-violet-300 uppercase text-[11px] font-bold border-b border-violet-900/40">
                  <tr>
                    <th className="px-4 py-3.5">Sipariş & Tarih</th>
                    <th className="px-4 py-3.5">Kullanıcı</th>
                    <th className="px-4 py-3.5">Satın Alınan Ürün</th>
                    <th className="px-4 py-3.5">Ödeme / Çekim Detayı (TRX / IBAN)</th>
                    <th className="px-3 py-3.5 text-center">Tutar</th>
                    <th className="px-4 py-3.5 text-center">Durum</th>
                    <th className="px-4 py-3.5 text-right">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-violet-900/20">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        {loadingOrders ? 'Siparişler yükleniyor...' : 'Kriterlere uygun sipariş bulunamadı.'}
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((order) => {
                      const isPending = order.status === 'pending';
                      const isCompleted = order.status === 'completed';
                      const isCancelled = order.status === 'cancelled' || order.status === 'rejected';

                      return (
                        <tr
                          key={order.id}
                          className={`hover:bg-violet-950/30 transition-colors ${
                            isPending ? 'bg-amber-500/5' : ''
                          }`}
                        >
                          {/* Order ID & Date */}
                          <td className="px-4 py-4">
                            <div className="flex flex-col">
                              <span className="font-mono text-white font-bold text-xs">{order.id}</span>
                              <span className="text-[10px] text-slate-400 mt-0.5">
                                {new Date(order.created_at).toLocaleDateString('tr-TR', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                          </td>

                          {/* Username */}
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg bg-violet-950 border border-violet-800/40 flex items-center justify-center text-violet-300 font-bold text-xs">
                                <User className="w-3.5 h-3.5" />
                              </div>
                              <div>
                                <span className="font-bold text-white block">{order.username || 'Kullanıcı'}</span>
                                <span className="text-[10px] text-slate-500 font-mono">ID: {order.user_id.slice(0, 8)}...</span>
                              </div>
                            </div>
                          </td>

                          {/* Product */}
                          <td className="px-4 py-4">
                            <div className="font-bold text-white">{order.product_name}</div>
                            {order.delivery_note && (
                              <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-1 italic">
                                Not: {order.delivery_note}
                              </div>
                            )}
                          </td>

                          {/* Payout Details (TRX / IBAN) */}
                          <td className="px-4 py-4">
                            <div className="p-2.5 rounded-xl bg-[#090614] border border-violet-800/40 space-y-1 max-w-xs">
                              <div className="flex items-center justify-between gap-2">
                                <span
                                  className={`inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                                    order.payout_type === 'trx'
                                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  }`}
                                >
                                  {order.payout_type === 'trx' ? <Wallet className="w-3 h-3" /> : <Building className="w-3 h-3" />}
                                  <span>{order.payout_type === 'trx' ? 'TRX (TRC20)' : 'Banka IBAN'}</span>
                                </span>

                                {order.payout_address && (
                                  <button
                                    type="button"
                                    onClick={() => handleCopy(order.payout_address!, order.id)}
                                    className="p-1 rounded bg-violet-950/80 hover:bg-violet-800 text-violet-300 hover:text-white transition-colors cursor-pointer"
                                    title="Adresi Kopyala"
                                  >
                                    {copiedId === order.id ? (
                                      <Check className="w-3 h-3 text-emerald-400" />
                                    ) : (
                                      <Copy className="w-3 h-3" />
                                    )}
                                  </button>
                                )}
                              </div>

                              <div className="font-mono text-[11px] text-amber-300 font-bold break-all select-all">
                                {order.payout_address || 'Belirtilmedi'}
                              </div>

                              {order.payout_holder_name && (
                                <div className="text-[10px] text-slate-300">
                                  Hesap: <span className="font-bold text-white">{order.payout_holder_name}</span>
                                  {order.payout_bank_name ? ` (${order.payout_bank_name})` : ''}
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Price */}
                          <td className="px-3 py-4 text-center">
                            <span className="font-black text-amber-400 text-xs flex items-center justify-center gap-1">
                              <Coins className="w-3.5 h-3.5" />
                              {formatCoin(order.coin_price)}
                            </span>
                          </td>

                          {/* Status */}
                          <td className="px-4 py-4 text-center">
                            <span
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase ${
                                isCompleted
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                  : isCancelled
                                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              }`}
                            >
                              {isCompleted && <CheckCircle2 className="w-3 h-3" />}
                              {isCancelled && <XCircle className="w-3 h-3" />}
                              {isPending && <Clock className="w-3 h-3 animate-spin" />}
                              <span>{isCompleted ? 'Teslim Edildi' : isCancelled ? 'İptal Edildi' : 'İnceleniyor'}</span>
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {isPending && (
                                <>
                                  <button
                                    disabled={updatingOrderId === order.id}
                                    onClick={() => handleUpdateOrderStatus(order.id, 'completed')}
                                    className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] shadow flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50"
                                    title="Teslim Edildi Olarak Onayla"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                    <span>{updatingOrderId === order.id ? 'İşleniyor...' : 'Teslim Et'}</span>
                                  </button>

                                  <button
                                    disabled={updatingOrderId === order.id}
                                    onClick={() => handleUpdateOrderStatus(order.id, 'cancelled')}
                                    className="px-2.5 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-800 text-rose-300 hover:text-white border border-rose-800/40 font-bold text-[11px] transition-all cursor-pointer disabled:opacity-50"
                                    title="Siparişi İptal Et & Coini İade Et"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                    <span>İptal / İade</span>
                                  </button>
                                </>
                              )}

                              <button
                                onClick={() => {
                                  setSelectedOrder(order);
                                  setAdminNoteInput(order.admin_note || '');
                                }}
                                className="p-1.5 rounded-lg bg-violet-950/60 text-violet-300 hover:text-white border border-violet-800/30 hover:bg-violet-800 transition-colors cursor-pointer"
                                title="Detayları İncele"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PRODUCTS CATALOG */}
      {activeTab === 'products' && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <button
              onClick={openNew}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-black text-xs shadow-lg shadow-violet-900/50 flex items-center gap-2 cursor-pointer transition-all hover:scale-105"
            >
              <Plus className="w-4 h-4" />
              <span>Yeni Ürün Ekle</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {storeProducts.map((product) => (
              <div
                key={product.id}
                className="rounded-3xl bg-[#120b24] border border-violet-800/30 p-4 flex flex-col justify-between space-y-3 group hover:border-violet-600/50 transition-all shadow-xl"
              >
                <div className="h-36 w-full rounded-2xl overflow-hidden bg-violet-950/40">
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>

                <div>
                  <h4 className="text-xs font-bold text-white truncate">{product.name}</h4>
                  <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{product.description}</p>
                </div>

                <div className="flex items-center justify-between text-xs font-black text-amber-400">
                  <span>{formatCoin(product.coin_price)} Coin</span>
                  <span className="text-[10px] text-slate-400 font-normal">Stok: {product.stock}</span>
                </div>

                <div className="pt-2 border-t border-violet-900/30 flex items-center justify-between">
                  <span
                    className={`text-[10px] font-bold ${
                      product.active ? 'text-emerald-400' : 'text-slate-500'
                    }`}
                  >
                    {product.active ? '● Satışta' : '○ Pasif'}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEdit(product)}
                      className="p-1.5 rounded-lg bg-violet-950/60 text-violet-300 hover:text-white border border-violet-800/30 cursor-pointer"
                      title="Düzenle"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(product.id, product.name)}
                      className="p-1.5 rounded-lg bg-rose-950/40 text-rose-300 hover:text-white border border-rose-800/30 cursor-pointer"
                      title="Sil"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Product Edit / Create Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="max-w-md w-full rounded-3xl bg-[#120b24] border border-violet-700/50 p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-violet-900/30 pb-3">
              <h3 className="text-base font-black text-white">
                {isNew ? 'Yeni Ürün Ekle' : 'Ürünü Düzenle'}
              </h3>
              <button
                onClick={() => setEditingProduct(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Ürün Adı</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#090614] border border-violet-800/40 text-white focus:outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Açıklama</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full p-2.5 rounded-xl bg-[#090614] border border-violet-800/40 text-white focus:outline-none focus:border-violet-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Fiyat (Coin)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={coinPrice}
                    onChange={(e) => setCoinPrice(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl bg-[#090614] border border-violet-800/40 text-white focus:outline-none focus:border-violet-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Stok Adedi</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={stock}
                    onChange={(e) => setStock(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl bg-[#090614] border border-violet-800/40 text-white focus:outline-none focus:border-violet-500"
                  />
                </div>
              </div>

              <div>
                <ImageUploadField
                  label="Ürün Görseli"
                  value={imageUrl}
                  onChange={setImageUrl}
                  placeholder="https://..."
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="prod-active"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  className="w-4 h-4 rounded text-violet-600 focus:ring-0 cursor-pointer"
                />
                <label htmlFor="prod-active" className="text-white font-bold cursor-pointer">
                  Ürünü Hemen Satışa Aç (Aktif)
                </label>
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="flex-1 py-2.5 rounded-xl border border-violet-800 text-slate-300 hover:bg-violet-900/30 font-bold cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-black shadow-lg cursor-pointer"
                >
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Selected Order Detailed Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div className="max-w-lg w-full rounded-3xl bg-[#120b24] border border-amber-500/40 p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-violet-900/40 pb-3">
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-amber-400" />
                  <span>Sipariş Detayı #{selectedOrder.id}</span>
                </h3>
                <span className="text-[11px] text-slate-400">
                  Tarih: {new Date(selectedOrder.created_at).toLocaleString('tr-TR')}
                </span>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="w-8 h-8 rounded-xl bg-violet-950/60 hover:bg-violet-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Order Card Info */}
            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-[#090614] border border-violet-800/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-semibold">Kullanıcı:</span>
                  <span className="text-white font-bold">{selectedOrder.username || 'Kullanıcı'} ({selectedOrder.user_id.slice(0, 8)})</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-semibold">Satın Alınan Ürün:</span>
                  <span className="text-white font-bold">{selectedOrder.product_name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-semibold">Coin Tutarı:</span>
                  <span className="text-amber-400 font-black">{formatCoin(selectedOrder.coin_price)} Coin</span>
                </div>
              </div>

              {/* Payout & Delivery Address Box */}
              <div className="p-4 rounded-2xl bg-violet-950/50 border border-violet-800/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-amber-300 uppercase tracking-wider">
                    Ödeme / Teslimat Bilgisi
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-violet-900/60 text-violet-200">
                    {selectedOrder.payout_type === 'trx' ? 'TRX TRC-20' : 'Banka Havalesi (IBAN)'}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-[#090614] border border-violet-700/60 flex items-center justify-between gap-2">
                  <span className="font-mono text-white text-xs break-all font-bold">
                    {selectedOrder.payout_address || 'Belirtilmedi'}
                  </span>
                  {selectedOrder.payout_address && (
                    <button
                      type="button"
                      onClick={() => handleCopy(selectedOrder.payout_address!, 'modal-copy')}
                      className="p-1.5 rounded-lg bg-violet-900 text-violet-200 hover:text-white cursor-pointer shrink-0"
                      title="Kopyala"
                    >
                      {copiedId === 'modal-copy' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  )}
                </div>

                {selectedOrder.payout_holder_name && (
                  <div className="text-slate-300 text-xs">
                    Hesap Sahibi: <span className="text-white font-bold">{selectedOrder.payout_holder_name}</span>
                    {selectedOrder.payout_bank_name && ` (${selectedOrder.payout_bank_name})`}
                  </div>
                )}

                {selectedOrder.delivery_note && (
                  <div className="text-[11px] text-slate-400 pt-1 border-t border-violet-900/40">
                    Kullanıcı Notu: <span className="text-slate-200 italic">{selectedOrder.delivery_note}</span>
                  </div>
                )}
              </div>

              {/* Status Update Options */}
              <div className="space-y-2 pt-2">
                <label className="block text-slate-300 font-bold">Yönetici Notu (Opsiyonel)</label>
                <input
                  type="text"
                  value={adminNoteInput}
                  onChange={(e) => setAdminNoteInput(e.target.value)}
                  placeholder="Örn: 25 USDT TRC20 TXID: 9812a... ile gönderildi"
                  className="w-full p-2.5 rounded-xl bg-[#090614] border border-violet-800/40 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-3">
                <button
                  disabled={updatingStatus}
                  onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'completed', adminNoteInput)}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>Teslim Edildi Olarak Onayla</span>
                </button>

                <button
                  disabled={updatingStatus}
                  onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'cancelled', adminNoteInput)}
                  className="py-2.5 px-4 rounded-xl bg-rose-950/80 hover:bg-rose-800 text-rose-300 hover:text-white border border-rose-800/50 font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <X className="w-4 h-4" />
                  <span>İptal / İade</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
