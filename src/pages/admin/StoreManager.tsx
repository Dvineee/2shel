import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { db } from '../../lib/db';
import { StoreProduct } from '../../types';
import { ShoppingBag, Plus, Edit2, Trash2, X, Coins, Package } from 'lucide-react';
import { toast } from 'sonner';
import { formatCoin } from '../../lib/utils';

export const StoreManager: React.FC = () => {
  const { storeProducts, refreshAll } = useData();

  const [editingProduct, setEditingProduct] = useState<Partial<StoreProduct> | null>(null);
  const [isNew, setIsNew] = useState(false);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [coinPrice, setCoinPrice] = useState(500);
  const [stock, setStock] = useState(50);
  const [imageUrl, setImageUrl] = useState('');
  const [category, setCategory] = useState('gift_card');
  const [active, setActive] = useState(true);

  const openNew = () => {
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
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

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`"${name}" ürününü silmek istediğinizden emin misiniz?`)) {
      await db.deleteStoreProduct(id);
      toast.success('Ürün silindi');
      await refreshAll();
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Coin Mağazası Yönetimi</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Kullanıcıların coinleri ile satın alabileceği dijital ürünleri, fiyatları ve stokları yönetin.
          </p>
        </div>

        <button
          onClick={openNew}
          className="px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs shadow-lg flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Yeni Ürün Ekle</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {storeProducts.map((product) => (
          <div
            key={product.id}
            className="rounded-3xl bg-[#120b24] border border-violet-800/30 p-4 flex flex-col justify-between space-y-3 group"
          >
            <div className="h-32 w-full rounded-2xl overflow-hidden bg-violet-950/40">
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full h-full object-cover"
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
                  className="p-1.5 rounded-lg bg-violet-950/60 text-violet-300 hover:text-white border border-violet-800/30"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(product.id, product.name)}
                  className="p-1.5 rounded-lg bg-rose-950/40 text-rose-300 hover:text-white border border-rose-800/30"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="max-w-md w-full rounded-3xl bg-[#120b24] border border-violet-700/50 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-violet-900/30 pb-3">
              <h3 className="text-base font-black text-white">
                {isNew ? 'Yeni Ürün Ekle' : 'Ürünü Düzenle'}
              </h3>
              <button onClick={() => setEditingProduct(null)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Ürün Adı *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#0d0918] border border-violet-800/40 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Coin Fiyatı *</label>
                  <input
                    type="number"
                    required
                    value={coinPrice}
                    onChange={(e) => setCoinPrice(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl bg-[#0d0918] border border-violet-800/40 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Mevcut Stok *</label>
                  <input
                    type="number"
                    required
                    value={stock}
                    onChange={(e) => setStock(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl bg-[#0d0918] border border-violet-800/40 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Görsel URL *</label>
                <input
                  type="text"
                  required
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#0d0918] border border-violet-800/40 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Açıklama</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#0d0918] border border-violet-800/40 text-white"
                />
              </div>

              <label className="flex items-center gap-2 pt-2 text-white font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                />
                Satışta Göster (Aktif)
              </label>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-violet-900/30">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2 rounded-xl border border-violet-800 text-slate-300"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold"
                >
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
