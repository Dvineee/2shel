import React, { useState, useEffect } from 'react';
import { db } from '../../lib/db';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { Profile, UserRole, StoreOrder, WheelSpin, GiveawayEntry, AdminLog } from '../../types';
import {
  Users,
  Search,
  Shield,
  ShieldCheck,
  ShieldAlert,
  UserCheck,
  UserX,
  Edit2,
  Trash2,
  Coins,
  Activity,
  History,
  ShoppingBag,
  Disc,
  Gift,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  Plus,
  RefreshCw,
  Eye,
  AlertCircle,
  Copy,
  Check,
  UserPlus,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatCoin } from '../../lib/utils';
import { soundEngine } from '../../lib/sound';

export const UsersManager: React.FC = () => {
  const { user: currentAdmin, refreshProfile } = useAuth();
  const { refreshAll } = useData();

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Edit / Role Change Modal
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [editRole, setEditRole] = useState<UserRole>('user');
  const [editCoins, setEditCoins] = useState<number>(0);
  const [editActive, setEditActive] = useState<boolean>(true);
  const [editUsername, setEditUsername] = useState<string>('');
  const [savingUser, setSavingUser] = useState(false);

  // User Detailed Activity Modal
  const [selectedUserForLogs, setSelectedUserForLogs] = useState<Profile | null>(null);
  const [userActivity, setUserActivity] = useState<{
    spins: WheelSpin[];
    entries: GiveawayEntry[];
    orders: StoreOrder[];
    logs: AdminLog[];
    totalActivityCount: number;
  } | null>(null);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [activeLogTab, setActiveLogTab] = useState<'all' | 'spins' | 'orders' | 'entries' | 'system'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Delete Confirmation Modal State
  const [userToDelete, setUserToDelete] = useState<Profile | null>(null);
  const [deleting, setDeleting] = useState<boolean>(false);

  // New User Modal State
  const [showAddUserModal, setShowAddUserModal] = useState<boolean>(false);
  const [newUsername, setNewUsername] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('user');
  const [newCoins, setNewCoins] = useState<number>(250);

  const loadProfiles = async () => {
    setLoading(true);
    try {
      const data = await db.getProfiles();
      setProfiles(data);
    } catch {
      toast.error('Kullanıcı listesi yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfiles();
  }, []);

  const handleCopy = (text: string, id: string) => {
    soundEngine.playClick();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Panoya kopyalandı!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Open Edit Modal
  const openEditModal = (profile: Profile) => {
    soundEngine.playClick();
    setEditingUser(profile);
    setEditRole(profile.role);
    setEditCoins(profile.coin_balance);
    setEditActive(profile.active !== false);
    setEditUsername(profile.username);
  };

  // Save Role & User Changes
  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    soundEngine.playClick();
    setSavingUser(true);

    try {
      const updated = await db.updateUserByAdmin(
        editingUser.id,
        {
          role: editRole,
          coin_balance: Number(editCoins),
          active: editActive,
          username: editUsername,
        },
        currentAdmin?.username || 'Admin'
      );

      if (updated) {
        toast.success(`@${updated.username} kullanıcısının bilgileri ve yetkileri güncellendi!`);
        setEditingUser(null);
        await loadProfiles();
        await refreshAll();
        if (currentAdmin?.id === editingUser.id) {
          await refreshProfile();
        }
      }
    } catch {
      toast.error('Kullanıcı güncellenirken hata oluştu');
    } finally {
      setSavingUser(false);
    }
  };

  // Toggle Account Active / Frozen Status
  const handleToggleStatus = async (profile: Profile) => {
    soundEngine.playClick();
    const newStatus = !profile.active;
    const actionLabel = newStatus ? 'aktifleştirildi' : 'donduruldu';

    try {
      await db.updateUserByAdmin(
        profile.id,
        { active: newStatus },
        currentAdmin?.username || 'Admin'
      );
      toast.success(`@${profile.username} kullanıcısının hesabı ${actionLabel}.`);
      await loadProfiles();
    } catch {
      toast.error('Durum güncellenirken hata oluştu');
    }
  };

  // Open Delete Confirmation Modal
  const handleDeleteClick = (profile: Profile) => {
    soundEngine.playClick();
    if (profile.id === currentAdmin?.id) {
      toast.error('Kendi yönetici hesabınızı silemezsiniz!');
      return;
    }
    setUserToDelete(profile);
  };

  // Execute Confirmed Delete
  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    soundEngine.playClick();
    setDeleting(true);

    try {
      const success = await db.deleteProfile(userToDelete.id, currentAdmin?.username || 'Admin');
      if (success) {
        toast.success(`@${userToDelete.username} kullanıcısı ve tüm verileri sistemden kalıcı olarak silindi.`);
        setUserToDelete(null);
        await loadProfiles();
        await refreshAll();
      } else {
        toast.error('Kullanıcı silinemedi veya bulunamadı');
      }
    } catch {
      toast.error('Silme işlemi sırasında bir hata oluştu');
    } finally {
      setDeleting(false);
    }
  };

  // Open Activity Logs Modal
  const openUserLogs = async (profile: Profile) => {
    soundEngine.playClick();
    setSelectedUserForLogs(profile);
    setLoadingLogs(true);
    setActiveLogTab('all');

    try {
      const history = await db.getUserActivityHistory(profile.id);
      setUserActivity(history);
    } catch {
      toast.error('Kullanıcı logları alınamadı');
    } finally {
      setLoadingLogs(false);
    }
  };

  // Create Manual User
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim()) return;
    soundEngine.playClick();

    try {
      const newProfile: Partial<Profile> = {
        id: `usr-${Date.now()}`,
        username: newUsername.trim(),
        role: newRole,
        coin_balance: Number(newCoins),
        active: true,
        avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(newUsername)}&background=7C3AED&color=ffffff&bold=true`,
      };

      await db.saveProfile(newProfile);
      await db.logAdminAction(
        `Yeni Kullanıcı Oluşturuldu: @${newUsername} (${newRole})`,
        'user_management',
        newProfile.id,
        { username: newUsername, role: newRole, coins: newCoins },
        currentAdmin?.username || 'Admin'
      );

      toast.success(`Yeni kullanıcı @${newUsername} başarıyla oluşturuldu!`);
      setShowAddUserModal(false);
      setNewUsername('');
      setNewCoins(250);
      setNewRole('user');
      await loadProfiles();
    } catch {
      toast.error('Kullanıcı oluşturulurken bir hata meydana geldi');
    }
  };

  // Filter Profiles
  const filteredProfiles = profiles.filter((p) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      p.username.toLowerCase().includes(q) ||
      p.id.toLowerCase().includes(q) ||
      (p.telegram_username && p.telegram_username.toLowerCase().includes(q)) ||
      (p.telegram_first_name && p.telegram_first_name.toLowerCase().includes(q));

    if (!matchesSearch) return false;

    if (roleFilter !== 'all' && p.role !== roleFilter) return false;
    if (statusFilter === 'active' && p.active === false) return false;
    if (statusFilter === 'frozen' && p.active !== false) return false;

    return true;
  });

  // Role Badge Helper
  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'super_admin':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1">
            <ShieldAlert className="w-3 h-3 text-rose-400" />
            <span>Süper Admin</span>
          </span>
        );
      case 'admin':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-purple-400" />
            <span>Yönetici</span>
          </span>
        );
      case 'editor':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/40 flex items-center gap-1">
            <Shield className="w-3 h-3 text-blue-400" />
            <span>Moderatör / Editör</span>
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1">
            <UserCheck className="w-3 h-3 text-slate-400" />
            <span>Kullanıcı</span>
          </span>
        );
    }
  };

  // Metrics
  const totalUsers = profiles.length;
  const adminUsers = profiles.filter((p) => p.role === 'admin' || p.role === 'super_admin').length;
  const editorUsers = profiles.filter((p) => p.role === 'editor').length;
  const activeUsers = profiles.filter((p) => p.active !== false).length;
  const totalCoinsInCirculation = profiles.reduce((sum, p) => sum + (p.coin_balance || 0), 0);

  return (
    <div className="space-y-6 animate-in fade-in pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
            <Users className="w-6 h-6 text-violet-400" />
            <span>Kullanıcı & Yetki Yönetimi</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Tüm kayıtlı üyeleri görüntüleyin, rollerini/yetkilerini düzenleyin ve işlem geçmişi loglarını inceleyin.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              soundEngine.playClick();
              setShowAddUserModal(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-black text-xs shadow-lg shadow-violet-900/40 flex items-center gap-2 cursor-pointer transition-all hover:scale-105"
          >
            <UserPlus className="w-4 h-4" />
            <span>Yeni Kullanıcı Ekle</span>
          </button>

          <button
            onClick={loadProfiles}
            className="p-2.5 rounded-xl bg-[#120b24] border border-violet-800/40 text-violet-300 hover:text-white hover:bg-violet-900/60 transition-colors cursor-pointer"
            title="Listeyi Yenile"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-[#120b24] border border-violet-800/30">
          <span className="text-[10px] uppercase font-bold text-slate-400">Toplam Üye</span>
          <div className="text-xl font-black text-white mt-1">{totalUsers}</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#120b24] border border-violet-800/30">
          <span className="text-[10px] uppercase font-bold text-purple-400">Admin & Editörler</span>
          <div className="text-xl font-black text-purple-300 mt-1">
            {adminUsers} <span className="text-xs font-normal text-slate-400">/ {editorUsers} Editör</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#120b24] border border-emerald-500/30">
          <span className="text-[10px] uppercase font-bold text-emerald-400">Aktif Durumda</span>
          <div className="text-xl font-black text-emerald-300 mt-1">{activeUsers}</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#120b24] border border-amber-500/30">
          <span className="text-[10px] uppercase font-bold text-amber-400">Dolaşımdaki Coin</span>
          <div className="text-xl font-black text-amber-400 mt-1 flex items-center gap-1">
            <Coins className="w-4 h-4" />
            <span>{formatCoin(totalCoinsInCirculation)}</span>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="p-4 rounded-2xl bg-[#120b24] border border-violet-800/30 flex flex-col md:flex-row items-center justify-between gap-3 shadow-lg">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-violet-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Kullanıcı adı, Telegram adı veya ID ara..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#090614] border border-violet-800/40 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-violet-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {/* Role Filters */}
          <div className="flex items-center gap-1 bg-[#090614] p-1 rounded-xl border border-violet-900/40">
            {[
              { id: 'all', label: 'Tüm Roller' },
              { id: 'super_admin', label: 'Süper Admin' },
              { id: 'admin', label: 'Yönetici' },
              { id: 'editor', label: 'Editör' },
              { id: 'user', label: 'Üye' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  soundEngine.playClick();
                  setRoleFilter(tab.id);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  roleFilter === tab.id
                    ? 'bg-violet-600 text-white font-black shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-[#090614] border border-violet-800/40 text-xs font-bold text-slate-300 focus:outline-none focus:border-violet-500 cursor-pointer"
          >
            <option value="all">Tüm Durumlar</option>
            <option value="active">Sadece Aktifler</option>
            <option value="frozen">Dondurulmuş / Banlı</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-3xl bg-[#120b24] border border-violet-800/30 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-violet-950/60 text-violet-300 uppercase text-[11px] font-bold border-b border-violet-900/40">
              <tr>
                <th className="px-4 py-3.5">Kullanıcı & Profil</th>
                <th className="px-4 py-3.5">Yetki / Rol</th>
                <th className="px-4 py-3.5 text-center">Bakiye (Coin)</th>
                <th className="px-4 py-3.5">Telegram Durumu</th>
                <th className="px-4 py-3.5">Kayıt Tarihi</th>
                <th className="px-4 py-3.5 text-center">Durum</th>
                <th className="px-4 py-3.5 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-violet-900/20">
              {filteredProfiles.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    {loading ? 'Kullanıcılar yükleniyor...' : 'Arama kriterlerine uygun kullanıcı bulunamadı.'}
                  </td>
                </tr>
              ) : (
                filteredProfiles.map((p) => {
                  const isActive = p.active !== false;

                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-violet-950/30 transition-colors group"
                    >
                      {/* User Info */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.avatar_url}
                            alt={p.username}
                            className="w-9 h-9 rounded-xl object-cover border border-violet-700/50 shrink-0"
                          />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-white text-xs">{p.username}</span>
                              {p.telegram_username && (
                                <span className="text-[10px] text-blue-400 font-mono">
                                  @{p.telegram_username}
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-500 font-mono block">
                              ID: {p.id.slice(0, 10)}...
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="px-4 py-3.5">
                        {getRoleBadge(p.role)}
                      </td>

                      {/* Coins */}
                      <td className="px-4 py-3.5 text-center">
                        <span className="font-black text-amber-400 text-xs flex items-center justify-center gap-1">
                          <Coins className="w-3.5 h-3.5" />
                          {formatCoin(p.coin_balance)}
                        </span>
                      </td>

                      {/* Telegram Info */}
                      <td className="px-4 py-3.5">
                        {p.telegram_id || p.telegram_username ? (
                          <div className="flex items-center gap-1.5 text-blue-400">
                            <Send className="w-3.5 h-3.5" />
                            <span className="text-[11px] font-bold">Doğrulandı</span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-500">Bağlı Değil</span>
                        )}
                      </td>

                      {/* Created At */}
                      <td className="px-4 py-3.5 text-slate-400 text-[11px]">
                        {p.created_at
                          ? new Date(p.created_at).toLocaleDateString('tr-TR', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })
                          : '-'}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            isActive
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          }`}
                        >
                          {isActive ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          <span>{isActive ? 'Aktif' : 'Donduruldu'}</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View Detailed Activity & Logs Button */}
                          <button
                            onClick={() => openUserLogs(p)}
                            className="px-2.5 py-1.5 rounded-lg bg-indigo-950/60 hover:bg-indigo-800 text-indigo-300 hover:text-white border border-indigo-800/40 text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                            title="İşlem & Log Geçmişini Görüntüle"
                          >
                            <Activity className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Aktiviteler</span>
                          </button>

                          {/* Edit Role & Coins Button */}
                          <button
                            onClick={() => openEditModal(p)}
                            className="p-1.5 rounded-lg bg-violet-950/80 hover:bg-violet-800 text-violet-200 hover:text-white border border-violet-700/50 transition-colors cursor-pointer"
                            title="Yetki & Bakiye Düzenle"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Toggle Active Status */}
                          <button
                            onClick={() => handleToggleStatus(p)}
                            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                              isActive
                                ? 'bg-amber-950/40 border-amber-800/40 text-amber-300 hover:bg-amber-800 hover:text-white'
                                : 'bg-emerald-950/40 border-emerald-800/40 text-emerald-300 hover:bg-emerald-800 hover:text-white'
                            }`}
                            title={isActive ? 'Hesabı Dondur' : 'Hesabı Aktifleştir'}
                          >
                            {isActive ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                          </button>

                          {/* Delete Profile */}
                          <button
                            onClick={() => handleDeleteClick(p)}
                            className="p-1.5 rounded-lg bg-rose-950/40 text-rose-300 hover:text-white hover:bg-rose-800 border border-rose-800/30 transition-colors cursor-pointer"
                            title="Kullanıcıyı Sil"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

      {/* MODAL 1: EDIT USER ROLE, COINS & STATUS */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div className="max-w-md w-full rounded-3xl bg-[#120b24] border border-violet-600/50 p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-violet-900/40 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-black text-white">
                  Kullanıcı & Yetki Düzenle
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-4 text-xs">
              {/* User Overview */}
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#090614] border border-violet-800/40">
                <img
                  src={editingUser.avatar_url}
                  alt={editingUser.username}
                  className="w-12 h-12 rounded-xl object-cover border border-violet-700/50 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <span className="font-bold text-white block text-sm truncate">{editingUser.username}</span>
                  <span className="text-[10px] text-slate-400 font-mono block">ID: {editingUser.id}</span>
                </div>
              </div>

              {/* Username Field */}
              <div>
                <label className="block text-slate-300 font-bold mb-1">Kullanıcı Adı</label>
                <input
                  type="text"
                  required
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#090614] border border-violet-800/40 text-white focus:outline-none focus:border-violet-500"
                />
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-slate-300 font-bold mb-1.5">Kullanıcı Rolü & Yetki Düzeyi</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'user', label: 'Üye (Standart)', desc: 'Sadece siteyi kullanır' },
                    { id: 'editor', label: 'Moderatör / Editör', desc: 'İçerik düzenleme yetkisi' },
                    { id: 'admin', label: 'Yönetici (Admin)', desc: 'Tüm paneli yönetir' },
                    { id: 'super_admin', label: 'Süper Admin', desc: 'Tam sınırsız yetki' },
                  ].map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setEditRole(r.id as UserRole)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-0.5 ${
                        editRole === r.id
                          ? 'bg-violet-600 border-violet-400 text-white shadow-md'
                          : 'bg-[#090614] border-violet-900/40 text-slate-400 hover:text-white'
                      }`}
                    >
                      <span className="font-bold text-xs">{r.label}</span>
                      <span className="text-[10px] text-slate-300/80">{r.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Coin Balance */}
              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  Coin Bakiyesi
                </label>
                <div className="relative">
                  <Coins className="w-4 h-4 text-amber-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    min={0}
                    value={editCoins}
                    onChange={(e) => setEditCoins(Number(e.target.value))}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[#090614] border border-violet-800/40 text-amber-400 font-black focus:outline-none focus:border-amber-500 text-sm"
                  />
                </div>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#090614] border border-violet-800/40">
                <div>
                  <span className="text-white font-bold block">Hesap Durumu</span>
                  <span className="text-[10px] text-slate-400">
                    {editActive ? 'Kullanıcı siteye giriş yapabilir.' : 'Hesap donduruldu, giriş yapamaz.'}
                  </span>
                </div>
                <input
                  type="checkbox"
                  id="user-active-toggle"
                  checked={editActive}
                  onChange={(e) => setEditActive(e.target.checked)}
                  className="w-5 h-5 rounded text-violet-600 focus:ring-0 cursor-pointer"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="flex-1 py-2.5 rounded-xl border border-violet-800 text-slate-300 hover:bg-violet-900/30 font-bold cursor-pointer"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={savingUser}
                  className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-black shadow-lg cursor-pointer disabled:opacity-50"
                >
                  {savingUser ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: DETAILED ACTIVITY & AUDIT LOGS FOR USER */}
      {selectedUserForLogs && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div className="max-w-3xl w-full rounded-3xl bg-[#120b24] border border-indigo-500/40 p-6 shadow-2xl space-y-4 my-8 max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-violet-900/40 pb-3">
              <div className="flex items-center gap-3">
                <img
                  src={selectedUserForLogs.avatar_url}
                  alt={selectedUserForLogs.username}
                  className="w-10 h-10 rounded-xl object-cover border border-indigo-500/40"
                />
                <div>
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <span>@{selectedUserForLogs.username}</span>
                    {getRoleBadge(selectedUserForLogs.role)}
                  </h3>
                  <span className="text-[10px] text-slate-400 font-mono">
                    ID: {selectedUserForLogs.id}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedUserForLogs(null)}
                className="w-8 h-8 rounded-xl bg-violet-950/60 hover:bg-violet-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Sub Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-violet-900/30">
              {[
                { id: 'all', label: `Tüm Aktiviteler (${userActivity?.totalActivityCount || 0})`, icon: Activity },
                { id: 'spins', label: `🎡 Çark Çevirmeleri (${userActivity?.spins.length || 0})`, icon: Disc },
                { id: 'orders', label: `🛍️ Mağaza Siparişleri (${userActivity?.orders.length || 0})`, icon: ShoppingBag },
                { id: 'entries', label: `🎁 Çekiliş Katılımları (${userActivity?.entries.length || 0})`, icon: Gift },
                { id: 'system', label: `🛡️ Sistem & Admin Logları (${userActivity?.logs.length || 0})`, icon: FileText },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    soundEngine.playClick();
                    setActiveLogTab(tab.id as any);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeLogTab === tab.id
                      ? 'bg-indigo-600 text-white font-black shadow'
                      : 'bg-[#090614] text-slate-400 hover:text-white border border-violet-900/40'
                  }`}
                >
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Log Contents Body */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 min-h-[300px]">
              {loadingLogs ? (
                <div className="py-16 text-center text-xs text-slate-400 animate-pulse">
                  Kullanıcı aktiviteleri ve logları yükleniyor...
                </div>
              ) : !userActivity || userActivity.totalActivityCount === 0 ? (
                <div className="py-16 text-center text-xs text-slate-400">
                  Bu kullanıcıya ait herhangi bir kayıtlı işlem bulunamadı.
                </div>
              ) : (
                <>
                  {/* Wheel Spins Section */}
                  {(activeLogTab === 'all' || activeLogTab === 'spins') && userActivity.spins.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-[11px] font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Disc className="w-3.5 h-3.5" />
                        <span>Çark Çevirme Geçmişi ({userActivity.spins.length})</span>
                      </div>
                      <div className="space-y-1.5">
                        {userActivity.spins.map((spin) => (
                          <div
                            key={spin.id}
                            className="p-3 rounded-2xl bg-[#090614] border border-violet-800/30 flex items-center justify-between text-xs"
                          >
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold">
                                🎡
                              </div>
                              <div>
                                <span className="font-bold text-white">{spin.reward_title}</span>
                                <span className="text-[10px] text-slate-400 block">
                                  {new Date(spin.created_at).toLocaleString('tr-TR')}
                                </span>
                              </div>
                            </div>
                            <span className="font-black text-amber-400">+{spin.reward_value} Coin</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Store Orders Section */}
                  {(activeLogTab === 'all' || activeLogTab === 'orders') && userActivity.orders.length > 0 && (
                    <div className="space-y-2 pt-2">
                      <div className="text-[11px] font-black text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>Mağaza Satın Alımları & Çekimler ({userActivity.orders.length})</span>
                      </div>
                      <div className="space-y-2">
                        {userActivity.orders.map((ord) => (
                          <div
                            key={ord.id}
                            className="p-3.5 rounded-2xl bg-[#090614] border border-purple-900/40 space-y-2 text-xs"
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <span className="font-bold text-white text-sm">{ord.product_name}</span>
                                <span className="text-[10px] text-slate-400 block mt-0.5">
                                  Sipariş ID: #{ord.id} • {new Date(ord.created_at).toLocaleString('tr-TR')}
                                </span>
                              </div>
                              <span className="font-black text-amber-400 text-sm">
                                -{formatCoin(ord.coin_price)} Coin
                              </span>
                            </div>

                            {/* Payout Details */}
                            <div className="p-2.5 rounded-xl bg-violet-950/50 border border-violet-800/40 text-[11px] flex items-center justify-between gap-2">
                              <div>
                                <span className="text-slate-400 font-semibold block">
                                  {ord.payout_type === 'trx' ? '⚡ TRX / USDT Cüzdan' : '🏦 Banka IBAN'}:
                                </span>
                                <span className="font-mono text-white font-bold break-all">
                                  {ord.payout_address}
                                </span>
                                {ord.payout_holder_name && (
                                  <span className="text-slate-300 block text-[10px]">
                                    Hesap: {ord.payout_holder_name}
                                  </span>
                                )}
                              </div>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase shrink-0 ${
                                  ord.status === 'completed'
                                    ? 'bg-emerald-500/20 text-emerald-300'
                                    : ord.status === 'cancelled'
                                    ? 'bg-rose-500/20 text-rose-300'
                                    : 'bg-amber-500/20 text-amber-300'
                                }`}
                              >
                                {ord.status === 'completed'
                                  ? 'Teslim Edildi'
                                  : ord.status === 'cancelled'
                                  ? 'İptal Edildi'
                                  : 'İnceleniyor'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Giveaway Entries Section */}
                  {(activeLogTab === 'all' || activeLogTab === 'entries') && userActivity.entries.length > 0 && (
                    <div className="space-y-2 pt-2">
                      <div className="text-[11px] font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Gift className="w-3.5 h-3.5" />
                        <span>Çekiliş Katılımları ({userActivity.entries.length})</span>
                      </div>
                      <div className="space-y-1.5">
                        {userActivity.entries.map((entry) => (
                          <div
                            key={entry.id}
                            className="p-3 rounded-2xl bg-[#090614] border border-violet-800/30 flex items-center justify-between text-xs"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-emerald-400 font-bold">🎁 Çekiliş ID:</span>
                              <span className="font-mono text-white">{entry.giveaway_id}</span>
                            </div>
                            <span className="text-[10px] text-slate-400">
                              {new Date(entry.created_at).toLocaleString('tr-TR')}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* System & Audit Logs Section */}
                  {(activeLogTab === 'all' || activeLogTab === 'system') && userActivity.logs.length > 0 && (
                    <div className="space-y-2 pt-2">
                      <div className="text-[11px] font-black text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5" />
                        <span>Sistem & Yönetici Log Kayıtları ({userActivity.logs.length})</span>
                      </div>
                      <div className="space-y-1.5">
                        {userActivity.logs.map((log) => (
                          <div
                            key={log.id}
                            className="p-3 rounded-2xl bg-[#090614] border border-violet-800/30 space-y-1 text-xs"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-white">{log.action}</span>
                              <span className="text-[10px] text-slate-400">
                                {new Date(log.created_at).toLocaleString('tr-TR')}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-400 flex items-center gap-2">
                              <span>İşlemi Yapan: <strong className="text-violet-300">{log.admin_username}</strong></span>
                              <span>•</span>
                              <span className="font-mono">Modül: {log.entity_type}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: ADD NEW USER MANUALLY */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div className="max-w-md w-full rounded-3xl bg-[#120b24] border border-violet-600/50 p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-violet-900/40 pb-3">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-violet-400" />
                <h3 className="text-base font-black text-white">Yeni Kullanıcı Ekle</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddUserModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Kullanıcı Adı</label>
                <input
                  type="text"
                  required
                  placeholder="Örn: SuperUser99"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#090614] border border-violet-800/40 text-white focus:outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Kullanıcı Rolü</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as UserRole)}
                  className="w-full p-2.5 rounded-xl bg-[#090614] border border-violet-800/40 text-white focus:outline-none focus:border-violet-500"
                >
                  <option value="user">Standart Kullanıcı (Üye)</option>
                  <option value="editor">Moderatör / Editör</option>
                  <option value="admin">Yönetici (Admin)</option>
                  <option value="super_admin">Süper Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Başlangıç Coin Bakiyesi</label>
                <input
                  type="number"
                  min={0}
                  value={newCoins}
                  onChange={(e) => setNewCoins(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl bg-[#090614] border border-violet-800/40 text-amber-400 font-black focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-violet-800 text-slate-300 hover:bg-violet-900/30 font-bold cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-black shadow-lg cursor-pointer"
                >
                  Kullanıcıyı Oluştur
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: CONFIRM DELETE USER (CUSTOM DIALOG) */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in">
          <div className="max-w-md w-full rounded-3xl bg-[#120b24] border border-rose-600/50 p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-rose-900/40 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <h3 className="text-base font-black text-white">
                  Kullanıcıyı Silmek İstiyor musunuz?
                </h3>
              </div>
              <button
                type="button"
                disabled={deleting}
                onClick={() => setUserToDelete(null)}
                className="text-slate-400 hover:text-white cursor-pointer disabled:opacity-50"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-[#090614] border border-rose-800/30 flex items-center gap-3">
                <img
                  src={userToDelete.avatar_url}
                  alt={userToDelete.username}
                  className="w-12 h-12 rounded-xl object-cover border border-rose-700/50 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm truncate">
                      @{userToDelete.username}
                    </span>
                    {getRoleBadge(userToDelete.role)}
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                    ID: {userToDelete.id}
                  </span>
                  <span className="text-[10px] text-amber-400 font-bold block mt-0.5">
                    Mevcut Bakiye: {formatCoin(userToDelete.coin_balance)} Coin
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/40 text-rose-200 text-xs leading-relaxed space-y-1">
                <p className="font-bold flex items-center gap-1.5 text-rose-300">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>DİKKAT: Bu işlem geri alınamaz!</span>
                </p>
                <p className="text-[11px] text-rose-200/90">
                  Bu kullanıcının hesabı, çark çevirmeleri, çekiliş katılımları ve sipariş kayıtları sistemden tamamen kaldırılacaktır.
                </p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  disabled={deleting}
                  onClick={() => setUserToDelete(null)}
                  className="flex-1 py-2.5 rounded-xl border border-violet-800 text-slate-300 hover:bg-violet-900/30 font-bold cursor-pointer transition-colors disabled:opacity-50"
                >
                  Vazgeç
                </button>
                <button
                  type="button"
                  disabled={deleting}
                  onClick={handleConfirmDelete}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black shadow-lg shadow-rose-900/40 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                >
                  {deleting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Siliniyor...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span>Evet, Kalıcı Olarak Sil</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
