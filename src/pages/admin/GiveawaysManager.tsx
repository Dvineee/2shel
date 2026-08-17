import React, { useState, useEffect, useRef } from 'react';
import { useData } from '../../context/DataContext';
import { db } from '../../lib/db';
import { Giveaway, GiveawayEntry, GiveawayTemplate } from '../../types';
import {
  Gift,
  Plus,
  Edit2,
  Trash2,
  X,
  Clock,
  Users,
  Trophy,
  Crown,
  Sparkles,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  Award,
  Settings2,
  BookmarkPlus,
  Bookmark,
  Layers,
  Save,
  Check,
  UserCheck,
  HelpCircle,
  UserPlus,
} from 'lucide-react';
import { toast } from 'sonner';
import { soundEngine } from '../../lib/sound';
import confetti from 'canvas-confetti';
import { formatDate } from '../../lib/utils';

export const GiveawaysManager: React.FC = () => {
  const { giveaways, refreshAll } = useData();

  // Custom Confirm Modal State (Solves iframe window.confirm block)
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'primary';
    onConfirm: () => void | Promise<void>;
  } | null>(null);

  // Quick Save Template Name Dialog State
  const [saveTplPrompt, setSaveTplPrompt] = useState<{
    isOpen: boolean;
    defaultName: string;
  } | null>(null);
  const [customTplName, setCustomTplName] = useState('');

  // Templates state
  const [templates, setTemplates] = useState<GiveawayTemplate[]>([]);
  const [isTemplateManagerOpen, setIsTemplateManagerOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Partial<GiveawayTemplate> | null>(null);
  const [tplName, setTplName] = useState('');
  const [tplTitle, setTplTitle] = useState('');
  const [tplPrize, setTplPrize] = useState('');
  const [tplImage, setTplImage] = useState('');
  const [tplDesc, setTplDesc] = useState('');
  const [tplDays, setTplDays] = useState(7);
  const [tplWinnerCount, setTplWinnerCount] = useState(1);
  const [tplColor, setTplColor] = useState<'violet' | 'rose' | 'amber' | 'emerald' | 'blue' | 'cyan' | 'fuchsia'>('violet');

  // Create / Edit modal state
  const [editingGiveaway, setEditingGiveaway] = useState<Partial<Giveaway> | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [prizeDetails, setPrizeDetails] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [endAt, setEndAt] = useState('');
  const [active, setActive] = useState(true);
  const [winnerCount, setWinnerCount] = useState<number>(1);

  // Draw / Conclude Modal state
  const [drawGiveaway, setDrawGiveaway] = useState<Giveaway | null>(null);
  const [entries, setEntries] = useState<GiveawayEntry[]>([]);
  const [loadingEntries, setLoadingEntries] = useState(false);
  const [selectedWinnersList, setSelectedWinnersList] = useState<string[]>([]);
  const [manualWinnerInput, setManualWinnerInput] = useState<string>('');
  const [winnerNote, setWinnerNote] = useState<string>('');
  const [isDrawing, setIsDrawing] = useState(false);
  const [displayedCandidate, setDisplayedCandidate] = useState<string>('');
  const drawIntervalRef = useRef<any>(null);

  // Load templates on mount
  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    const list = await db.getGiveawayTemplates();
    setTemplates(list);
  };

  const formatDateTimeInput = (dateInput?: string | Date, extraDays = 7) => {
    const d = dateInput ? new Date(dateInput) : new Date(Date.now() + extraDays * 24 * 60 * 60 * 1000);
    const validDate = isNaN(d.getTime()) ? new Date(Date.now() + extraDays * 24 * 60 * 60 * 1000) : d;
    const year = validDate.getFullYear();
    const month = String(validDate.getMonth() + 1).padStart(2, '0');
    const day = String(validDate.getDate()).padStart(2, '0');
    const hours = String(validDate.getHours()).padStart(2, '0');
    const mins = String(validDate.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${mins}`;
  };

  // Apply template to active form
  const applyTemplate = (tpl: GiveawayTemplate) => {
    soundEngine.playClick();
    setTitle(tpl.title);
    setPrizeDetails(tpl.prize_details);
    setImageUrl(tpl.image_url);
    setDescription(tpl.description);
    setWinnerCount(tpl.winner_count || 1);
    setEndAt(formatDateTimeInput(undefined, tpl.duration_days || 7));
    toast.success(`"${tpl.name}" şablonu uygulandı!`);
  };

  // Quick save current form as new template
  const handleOpenSaveAsTemplateDialog = () => {
    if (!title.trim() || !prizeDetails.trim()) {
      toast.warning('Şablon olarak kaydetmek için en azından Çekiliş Başlığı ve Ödül Detayı girilmelidir.');
      return;
    }
    setCustomTplName(title.slice(0, 26));
    setSaveTplPrompt({
      isOpen: true,
      defaultName: title.slice(0, 26),
    });
  };

  const confirmSaveCurrentAsTemplate = async () => {
    if (!customTplName.trim()) {
      toast.error('Lütfen bir şablon adı giriniz.');
      return;
    }

    const newTpl: GiveawayTemplate = {
      id: `tpl-${Date.now()}`,
      name: customTplName.trim(),
      title: title.trim(),
      prize_details: prizeDetails.trim(),
      image_url: imageUrl.trim() || 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=800&h=450&q=80',
      description: description.trim(),
      duration_days: 7,
      winner_count: Number(winnerCount) || 1,
      badge_color: 'amber',
    };

    setTemplates((prev) => [...prev, newTpl]);
    setSaveTplPrompt(null);

    try {
      await db.saveGiveawayTemplate(newTpl);
      const updated = await db.getGiveawayTemplates();
      setTemplates(updated);
      toast.success(`"${newTpl.name}" şablonu başarıyla kaydedildi! 💾`);
    } catch (err) {
      console.error('Save template error:', err);
      toast.error('Şablon kaydedilirken bir hata oluştu.');
    }
  };

  // Template editor handlers
  const openTemplateEditor = (tpl?: GiveawayTemplate) => {
    if (tpl) {
      setEditingTemplate(tpl);
      setTplName(tpl.name || '');
      setTplTitle(tpl.title || '');
      setTplPrize(tpl.prize_details || '');
      setTplImage(tpl.image_url || '');
      setTplDesc(tpl.description || '');
      setTplDays(tpl.duration_days || 7);
      setTplWinnerCount(tpl.winner_count || 1);
      setTplColor(tpl.badge_color || 'violet');
    } else {
      setEditingTemplate({});
      setTplName('🎁 Yeni Şablon');
      setTplTitle(title || 'Haftalık Özel Çekiliş');
      setTplPrize(prizeDetails || '50.000 TL Nakit Ödül');
      setTplImage(imageUrl || 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=800&h=450&q=80');
      setTplDesc(description || 'Topluluk üyelerimize özel dev çekiliş.');
      setTplDays(7);
      setTplWinnerCount(winnerCount || 1);
      setTplColor('amber');
    }
  };

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tplName.trim() || !tplTitle.trim() || !tplPrize.trim()) {
      toast.error('Lütfen zorunlu alanları doldurunuz.');
      return;
    }

    const tplData: GiveawayTemplate = {
      id: editingTemplate?.id || `tpl-${Date.now()}`,
      name: tplName.trim(),
      title: tplTitle.trim(),
      prize_details: tplPrize.trim(),
      image_url: tplImage.trim() || 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=800&h=450&q=80',
      description: tplDesc.trim(),
      duration_days: Number(tplDays) || 7,
      winner_count: Math.max(1, Number(tplWinnerCount) || 1),
      badge_color: tplColor,
    };

    // Immediate UI update
    setTemplates((prev) => {
      const idx = prev.findIndex((t) => t.id === tplData.id);
      if (idx !== -1) {
        const next = [...prev];
        next[idx] = tplData;
        return next;
      }
      return [...prev, tplData];
    });

    setEditingTemplate(null);
    soundEngine.playClick();

    try {
      await db.saveGiveawayTemplate(tplData);
      const updated = await db.getGiveawayTemplates();
      setTemplates(updated);
      toast.success('Şablon başarıyla kaydedildi! ✅');
    } catch (err) {
      console.error('Save template error:', err);
      toast.error('Şablon kaydedilirken bir sorun oluştu.');
    }
  };

  const handleDeleteTemplate = (id: string, name: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Şablonu Sil',
      message: `"${name}" şablonunu silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`,
      confirmText: 'Evet, Şablonu Sil',
      variant: 'danger',
      onConfirm: async () => {
        setTemplates((prev) => prev.filter((t) => t.id !== id));
        try {
          await db.deleteGiveawayTemplate(id);
          const updated = await db.getGiveawayTemplates();
          setTemplates(updated);
          toast.success('Şablon başarıyla silindi.');
        } catch (err) {
          console.error('Delete template error:', err);
          toast.error('Şablon silinirken bir hata oluştu.');
        }
      },
    });
  };

  const handleResetTemplates = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Şablonları Varsayılana Sıfırla',
      message: 'Tüm hazır çekiliş şablonları fabrika ayarlarına sıfırlanacaktır. Devam etmek istiyor musunuz?',
      confirmText: 'Evet, Sıfırla',
      variant: 'warning',
      onConfirm: async () => {
        try {
          const reset = await db.resetGiveawayTemplates();
          setTemplates(reset);
          toast.success('Şablonlar varsayılana sıfırlandı.');
        } catch (err) {
          console.error('Reset templates error:', err);
          toast.error('Şablonlar sıfırlanırken bir hata oluştu.');
        }
      },
    });
  };

  const getBadgeStyle = (color?: string) => {
    switch (color) {
      case 'rose':
        return 'bg-rose-900/40 hover:bg-rose-800/60 text-rose-300 border-rose-700/40';
      case 'amber':
        return 'bg-amber-900/40 hover:bg-amber-800/60 text-amber-300 border-amber-700/40';
      case 'emerald':
        return 'bg-emerald-900/40 hover:bg-emerald-800/60 text-emerald-300 border-emerald-700/40';
      case 'blue':
        return 'bg-blue-900/40 hover:bg-blue-800/60 text-blue-300 border-blue-700/40';
      case 'cyan':
        return 'bg-cyan-900/40 hover:bg-cyan-800/60 text-cyan-300 border-cyan-700/40';
      case 'fuchsia':
        return 'bg-fuchsia-900/40 hover:bg-fuchsia-800/60 text-fuchsia-300 border-fuchsia-700/40';
      default:
        return 'bg-violet-900/40 hover:bg-violet-800/60 text-violet-300 border-violet-700/40';
    }
  };

  const openNew = () => {
    setIsNew(true);
    setEditingGiveaway({});
    if (templates.length > 0) {
      const first = templates[0];
      setTitle(first.title);
      setDescription(first.description);
      setPrizeDetails(first.prize_details);
      setImageUrl(first.image_url);
      setWinnerCount(first.winner_count || 1);
      setEndAt(formatDateTimeInput(undefined, first.duration_days || 7));
    } else {
      setTitle('Haftalık PlayStation 5 & Nakit Çekilişi');
      setDescription('Topluluk üyelerimize özel dev çekiliş. Tek tıkla hemen katıl.');
      setPrizeDetails('1x PlayStation 5 + 50.000 TL Nakit Ödül');
      setImageUrl('https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=800&h=450&q=80');
      setWinnerCount(1);
      setEndAt(formatDateTimeInput());
    }
    setActive(true);
  };

  const openEdit = (g: Giveaway) => {
    setIsNew(false);
    setEditingGiveaway(g);
    setTitle(g.title || '');
    setDescription(g.description || '');
    setPrizeDetails(g.prize_details || '');
    setImageUrl(g.image_url || '');
    setWinnerCount(g.winner_count || 1);
    setEndAt(formatDateTimeInput(g.end_at));
    setActive(g.active !== false);
  };

  const openDrawModal = async (g: Giveaway) => {
    soundEngine.playClick();
    setDrawGiveaway(g);
    
    // Parse existing winners (if comma separated or single)
    const existingWinners = g.winner_username
      ? g.winner_username.split(',').map((w) => w.trim().replace(/^@/, '')).filter(Boolean)
      : [];
    setSelectedWinnersList(existingWinners);
    setManualWinnerInput('');
    setWinnerNote(g.winner_note || '');
    setDisplayedCandidate(existingWinners[0] || '');
    setLoadingEntries(true);

    try {
      const fetchedEntries = await db.getEntriesByGiveawayId(g.id);
      setEntries(fetchedEntries);
    } catch {
      toast.error('Katılımcı listesi yüklenirken bir hata oluştu');
    } finally {
      setLoadingEntries(false);
    }
  };

  const closeDrawModal = () => {
    if (drawIntervalRef.current) {
      clearInterval(drawIntervalRef.current);
    }
    setDrawGiveaway(null);
    setIsDrawing(false);
    setSelectedWinnersList([]);
    setManualWinnerInput('');
    setWinnerNote('');
  };

  // Add winner to list
  const addWinnerToList = (username: string) => {
    const clean = username.trim().replace(/^@/, '');
    if (!clean) return;
    if (selectedWinnersList.includes(clean)) {
      toast.warning(`@${clean} zaten kazananlar listesinde yer alıyor.`);
      return;
    }
    const maxWinners = drawGiveaway?.winner_count || 1;
    if (selectedWinnersList.length >= maxWinners) {
      toast.info(`Bu çekiliş için belirlenen toplam kazanan sayısı (${maxWinners}) doldu. Yeni kazanan eklemek için mevcut olanlardan birini kaldırabilir veya çekilişi güncelleyebilirsiniz.`);
    }
    setSelectedWinnersList((prev) => [...prev, clean]);
    setManualWinnerInput('');
    soundEngine.playClick();
  };

  // Remove winner from list
  const removeWinnerFromList = (username: string) => {
    setSelectedWinnersList((prev) => prev.filter((w) => w !== username));
    soundEngine.playClick();
  };

  // Perform Live Animated Random Draw for 1 next winner
  const startRandomLiveDraw = () => {
    if (entries.length === 0) {
      toast.warning('Bu çekilişe henüz kayıtlı bir katılımcı bulunmuyor. Manuel olarak bir kazanan kullanıcı adı yazabilirsiniz.');
      return;
    }

    const availableEntries = entries.filter(
      (e) => !selectedWinnersList.includes(e.username || e.user_id)
    );

    if (availableEntries.length === 0) {
      toast.warning('Kalan tüm katılımcılar zaten kazanan olarak seçildi.');
      return;
    }

    setIsDrawing(true);
    soundEngine.playWheelTick();

    let counter = 0;
    const totalIterations = 32;
    let speed = 40;

    const runStep = () => {
      const randomCandidate = availableEntries[Math.floor(Math.random() * availableEntries.length)];
      const candidateName = randomCandidate.username || `Kullanıcı-${randomCandidate.user_id.slice(0, 5)}`;
      setDisplayedCandidate(candidateName);
      soundEngine.playWheelTick(1 + counter / totalIterations);
      counter++;

      if (counter < totalIterations) {
        speed += 6;
        drawIntervalRef.current = setTimeout(runStep, speed);
      } else {
        // Final Pick
        const winningEntry = availableEntries[Math.floor(Math.random() * availableEntries.length)];
        const winnerName = (winningEntry.username || winningEntry.user_id).replace(/^@/, '');
        setDisplayedCandidate(winnerName);
        addWinnerToList(winnerName);
        setIsDrawing(false);
        soundEngine.playWin();

        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
        });

        toast.success(`🎉 Çekiliş Kazananı Belirlendi: @${winnerName}`);
      }
    };

    runStep();
  };

  // Pick all winners at once randomly
  const pickAllWinnersRandomly = () => {
    if (entries.length === 0) {
      toast.warning('Bu çekilişe henüz katılımcı bulunmuyor.');
      return;
    }

    const maxWinners = drawGiveaway?.winner_count || 1;
    // Shuffle entries
    const shuffled = [...entries].sort(() => 0.5 - Math.random());
    const uniqueUsernames = Array.from(
      new Set(shuffled.map((e) => (e.username || e.user_id).replace(/^@/, '')))
    );
    const selected = uniqueUsernames.slice(0, maxWinners);

    setSelectedWinnersList(selected);
    soundEngine.playWin();
    confetti({
      particleCount: 150,
      spread: 90,
      origin: { y: 0.5 },
    });
    toast.success(`🎉 Toplam ${selected.length} talihli rastgele olarak belirlendi!`);
  };

  // Officially Conclude Giveaway
  const handleFinalizeDraw = async () => {
    if (!drawGiveaway) return;
    if (selectedWinnersList.length === 0) {
      toast.error('Lütfen en az bir kazanan belirleyin veya canlı çekiliş yapın.');
      return;
    }

    const combinedWinners = selectedWinnersList.join(', ');

    try {
      soundEngine.playClick();
      await db.concludeGiveaway(
        drawGiveaway.id,
        combinedWinners,
        undefined,
        winnerNote.trim()
      );

      confetti({
        particleCount: 160,
        spread: 100,
        origin: { y: 0.5 },
      });

      soundEngine.playWin();
      toast.success(
        `"${drawGiveaway.title}" çekilişi başarıyla sonuçlandırıldı ve ${selectedWinnersList.length} talihli ilan edildi!`
      );
      closeDrawModal();
      await refreshAll();
    } catch {
      toast.error('Çekiliş sonuçlandırılırken bir hata oluştu');
    }
  };

  // Reopen Concluded Giveaway
  const handleReopenGiveaway = (giveawayId: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Çekilişi Yeniden Başlat',
      message: 'Bu çekilişi yeniden aktif hale getirmek, ilan edilen kazananları sıfırlamak ve katılımı açmak istiyor musunuz?',
      confirmText: 'Evet, Yeniden Başlat',
      variant: 'warning',
      onConfirm: async () => {
        try {
          await db.reopenGiveaway(giveawayId);
          soundEngine.playClick();
          toast.info('Çekiliş yeniden yayına alındı ve kazanan bilgisi sıfırlandı.');
          closeDrawModal();
          await refreshAll();
        } catch {
          toast.error('Çekiliş sıfırlanamadı');
        }
      },
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Lütfen çekiliş başlığı giriniz.');
      return;
    }
    if (!prizeDetails.trim()) {
      toast.error('Lütfen ödül detayını giriniz.');
      return;
    }

    let validEndAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    if (endAt) {
      const parsed = new Date(endAt);
      if (!isNaN(parsed.getTime())) {
        validEndAt = parsed.toISOString();
      }
    }

    const data: Partial<Giveaway> = {
      title: title.trim(),
      description: description.trim(),
      prize_details: prizeDetails.trim(),
      image_url: imageUrl.trim() || 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=600&h=400&q=80',
      end_at: validEndAt,
      winner_count: Math.max(1, Number(winnerCount) || 1),
      active,
    };

    setIsSaving(true);
    try {
      if (isNew) {
        await db.createGiveaway(data);
        toast.success('🎉 Yeni çekiliş başarıyla oluşturuldu ve yayına alındı!');
      } else if (editingGiveaway?.id) {
        await db.updateGiveaway(editingGiveaway.id, data);
        toast.success('Çekiliş bilgileri güncellendi!');
      }
      setEditingGiveaway(null);
      await refreshAll();
    } catch (err: any) {
      console.error('Giveaway save error:', err);
      toast.error(err?.message || 'İşlem tamamlanamadı. Lütfen tekrar deneyiniz.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (id: string, name: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Çekilişi Sil',
      message: `"${name}" çekilişini ve tüm katılımcı kayıtlarını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`,
      confirmText: 'Evet, Çekilişi Sil',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await db.deleteGiveaway(id);
          toast.success('Çekiliş başarıyla silindi.');
          await refreshAll();
        } catch (err) {
          console.error('Delete giveaway error:', err);
          toast.error('Çekiliş silinirken bir hata oluştu.');
        }
      },
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
            <Gift className="w-7 h-7 text-rose-400" />
            Çekiliş Yönetimi & Manuel Sonuçlandırma
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Topluluk ödül çekilişlerini planlayın, toplam kazanan talihli sayısını belirleyin, canlı çark ile veya manuel olarak kazananları seçin.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap self-start sm:self-auto">
          <button
            onClick={() => setIsTemplateManagerOpen(true)}
            className="px-3.5 py-2.5 rounded-xl bg-violet-900/40 hover:bg-violet-800/60 text-violet-300 border border-violet-700/40 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 shadow-sm"
            title="Şablonları Düzenle & Yönet"
          >
            <Settings2 className="w-4 h-4 text-violet-400" />
            <span>Şablonları Düzenle</span>
          </button>

          <button
            onClick={openNew}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-violet-900/40 flex items-center gap-2 cursor-pointer transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Çekiliş Başlat</span>
          </button>
        </div>
      </div>

      {/* Giveaways Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {giveaways.map((giveaway) => (
          <div
            key={giveaway.id}
            className={`rounded-3xl bg-[#120b24] border overflow-hidden flex flex-col justify-between group transition-all ${
              giveaway.is_completed
                ? 'border-amber-500/40 shadow-lg shadow-amber-950/20'
                : 'border-violet-800/30 hover:border-violet-600/40'
            }`}
          >
            {/* Image Header & Badges */}
            <div className="relative h-44 w-full bg-violet-950/40 overflow-hidden">
              <img
                src={giveaway.image_url}
                alt={giveaway.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#120b24] via-transparent to-black/40" />

              <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                {giveaway.is_completed ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500 text-violet-950 flex items-center gap-1 shadow-md">
                    <Trophy className="w-3 h-3" />
                    SONUÇLANDI
                  </span>
                ) : giveaway.active ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 backdrop-blur-sm">
                    ● Aktif Yayında
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400">
                    Pasif
                  </span>
                )}

                {/* Winner Count Badge */}
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-950/80 border border-purple-500/40 text-purple-300 backdrop-blur-md flex items-center gap-1">
                  <Crown className="w-2.5 h-2.5 text-amber-400" />
                  <span>{giveaway.winner_count || 1} Kazanan</span>
                </span>
              </div>

              <div className="absolute top-3 right-3 px-2 py-1 rounded-lg bg-black/70 backdrop-blur-md text-[10px] text-amber-300 font-bold flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-400" />
                <span>{formatDate(giveaway.end_at)}</span>
              </div>
            </div>

            {/* Body Info */}
            <div className="p-5 flex flex-col flex-1">
              <h3 className="text-base font-bold text-white line-clamp-1">{giveaway.title}</h3>
              <p className="text-xs text-slate-400 mt-1 line-clamp-2">{giveaway.description}</p>

              {/* Prize Badge */}
              <div className="my-3 p-2.5 rounded-xl bg-violet-950/40 border border-violet-900/40 text-xs text-amber-300 font-semibold truncate flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span className="truncate">{giveaway.prize_details}</span>
              </div>

              {/* Winner Announcement Banner if Completed */}
              {giveaway.is_completed && giveaway.winner_username && (
                <div className="mb-3 p-3 rounded-2xl bg-gradient-to-r from-amber-500/20 via-yellow-500/10 to-violet-950/50 border border-amber-500/40 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                    <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Resmi Kazananlar:</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {String(giveaway.winner_username || '')
                      .split(',')
                      .map((winnerName, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md bg-amber-400 text-violet-950 font-black text-xs inline-flex items-center gap-1"
                        >
                          @{winnerName.trim().replace(/^@/, '')}
                        </span>
                      ))}
                  </div>
                  {giveaway.winner_note && (
                    <p className="text-[11px] text-slate-300 italic pl-1">
                      "{giveaway.winner_note}"
                    </p>
                  )}
                </div>
              )}

              {/* Footer Actions */}
              <div className="mt-auto pt-3 border-t border-violet-900/30 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Users className="w-3.5 h-3.5 text-violet-400" />
                  <span>{giveaway.entries_count || 0} Katılımcı</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => openDrawModal(giveaway)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md ${
                      giveaway.is_completed
                        ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40'
                        : 'bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white shadow-pink-950/50'
                    }`}
                    title="Çekilişi Sonuçlandır"
                  >
                    <Trophy className="w-3.5 h-3.5" />
                    <span>{giveaway.is_completed ? 'Sonucu İncele / Yenile' : 'Çekilişi Yap'}</span>
                  </button>

                  <button
                    onClick={() => openEdit(giveaway)}
                    className="p-2 rounded-xl bg-violet-950/60 text-violet-300 hover:text-white border border-violet-800/30 cursor-pointer"
                    title="Düzenle"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleDelete(giveaway.id, giveaway.title)}
                    className="p-2 rounded-xl bg-rose-950/40 text-rose-300 hover:text-white border border-rose-800/30 cursor-pointer"
                    title="Sil"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* DRAW / CONCLUDE WINNER MODAL */}
      {drawGiveaway && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="max-w-xl w-full rounded-3xl bg-[#120b24] border-2 border-amber-500/50 p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-violet-800/40 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300">
                  <Trophy className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Çekilişi Canlı Sonuçlandır</h3>
                  <p className="text-xs text-amber-300/80 font-medium">
                    {drawGiveaway.title} (Ödül: {drawGiveaway.prize_details})
                  </p>
                </div>
              </div>
              <button
                onClick={closeDrawModal}
                className="p-1 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Target Winners Info Box */}
            <div className="p-3.5 rounded-2xl bg-purple-950/40 border border-purple-800/40 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-400" />
                <span className="text-slate-300">
                  Belirlenen Talihli Sayısı:{' '}
                  <strong className="text-amber-300 font-black text-sm">
                    {drawGiveaway.winner_count || 1} Kişi
                  </strong>
                </span>
              </div>
              <div className="text-xs text-slate-400">
                Seçilen:{' '}
                <strong className={selectedWinnersList.length >= (drawGiveaway.winner_count || 1) ? 'text-emerald-400' : 'text-amber-400'}>
                  {selectedWinnersList.length} / {drawGiveaway.winner_count || 1}
                </strong>
              </div>
            </div>

            {/* Live Animated Draw Arena */}
            <div className="p-5 rounded-2xl bg-gradient-to-b from-[#1b1035] to-[#0a0515] border border-amber-500/30 text-center space-y-3 relative overflow-hidden">
              <div className="absolute top-2 right-3 flex items-center gap-1 text-[10px] text-slate-400">
                <Users className="w-3 h-3 text-violet-400" />
                <span>Toplam Katılımcı: {entries.length}</span>
              </div>

              <div className="py-2">
                <span className="text-xs text-amber-400 font-bold uppercase tracking-wider block">
                  {isDrawing ? '🎰 ÇARK DÖNÜYOR...' : 'Rastgele Kazanan Seç'}
                </span>
                <div
                  className={`mt-2 py-3 px-4 rounded-xl border font-black text-lg sm:text-xl transition-all duration-100 ${
                    isDrawing
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300 scale-105 shadow-lg shadow-amber-500/20'
                      : displayedCandidate
                      ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                      : 'bg-black/40 border-violet-800/40 text-slate-500'
                  }`}
                >
                  {isDrawing ? (
                    <span className="animate-pulse flex items-center justify-center gap-2">
                      <Sparkles className="w-5 h-5 text-amber-400 animate-spin" />
                      @{displayedCandidate || 'Katılımcılar taranıyor...'}
                    </span>
                  ) : displayedCandidate ? (
                    <span className="flex items-center justify-center gap-2">
                      <Crown className="w-5 h-5 text-amber-400" />
                      @{displayedCandidate}
                    </span>
                  ) : (
                    'Çekilişi Başlatmak İçin Butona Tıklayın'
                  )}
                </div>
              </div>

              {/* Action Draw Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={startRandomLiveDraw}
                  disabled={isDrawing || entries.length === 0}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-violet-950 font-black text-xs shadow-lg shadow-amber-950/50 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>
                    {selectedWinnersList.length > 0 ? '+ Sıradaki Kazananı Çek' : '🎲 Canlı Çekilişi Başlat'}
                  </span>
                </button>

                {(drawGiveaway.winner_count || 1) > 1 && (
                  <button
                    type="button"
                    onClick={pickAllWinnersRandomly}
                    disabled={isDrawing || entries.length === 0}
                    className="px-3.5 py-2.5 rounded-xl bg-violet-900/60 hover:bg-violet-800 text-violet-200 font-bold text-xs border border-violet-700/50 flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                    title="Tüm talihlileri tek tıkla rastgele belirler"
                  >
                    <Users className="w-3.5 h-3.5 text-amber-400" />
                    <span>Tüm ({drawGiveaway.winner_count || 1}) Kazananı Rastgele Seç</span>
                  </button>
                )}
              </div>
            </div>

            {/* Selected Winners List & Free Input */}
            <div className="space-y-3 bg-[#0d071c] p-4 rounded-2xl border border-violet-900/40">
              <div>
                <label className="block text-slate-300 font-bold mb-1 text-xs flex items-center justify-between">
                  <span>Seçilen Kazanan Talihliler ({selectedWinnersList.length}):</span>
                  {selectedWinnersList.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedWinnersList([])}
                      className="text-[10px] text-rose-400 hover:text-rose-300 underline cursor-pointer"
                    >
                      Tümünü Temizle
                    </button>
                  )}
                </label>

                {/* Selected winner chips */}
                <div className="min-h-[44px] p-2 rounded-xl bg-[#080410] border border-violet-800/40 flex flex-wrap items-center gap-1.5">
                  {selectedWinnersList.length === 0 ? (
                    <span className="text-[11px] text-slate-500 italic">
                      Henüz kazanan seçilmedi. Çarkı çevirin veya aşağıdan katılımcı ekleyin.
                    </span>
                  ) : (
                    selectedWinnersList.map((w, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-lg bg-amber-400 text-violet-950 font-black text-xs flex items-center gap-1.5 shadow-sm"
                      >
                        <Crown className="w-3 h-3 text-violet-950" />
                        <span>@{w}</span>
                        <button
                          type="button"
                          onClick={() => removeWinnerFromList(w)}
                          className="p-0.5 hover:bg-black/20 rounded-full cursor-pointer ml-0.5"
                          title="Kazananı Kaldır"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))
                  )}
                </div>
              </div>

              {/* Add Winner Manually or From Select */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {/* Select from list */}
                <select
                  value=""
                  onChange={(e) => {
                    if (e.target.value) {
                      addWinnerToList(e.target.value);
                    }
                  }}
                  aria-label="Katılımcı listesinden kazanan ekle"
                  className="p-2.5 rounded-xl bg-[#090514] border border-violet-800/40 text-white text-xs"
                >
                  <option value="">Katılımcı Listesinden Ekle...</option>
                  {entries.map((entry) => (
                    <option key={entry.id} value={entry.username || entry.user_id}>
                      @{entry.username || entry.user_id} ({formatDate(entry.created_at)})
                    </option>
                  ))}
                </select>

                {/* Free text input + Add button */}
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={manualWinnerInput}
                    onChange={(e) => setManualWinnerInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addWinnerToList(manualWinnerInput);
                      }
                    }}
                    placeholder="veya kullanıcı adı yazın..."
                    className="flex-1 p-2.5 rounded-xl bg-[#090514] border border-violet-800/40 text-white text-xs placeholder:text-slate-600"
                  />
                  <button
                    type="button"
                    onClick={() => addWinnerToList(manualWinnerInput)}
                    disabled={!manualWinnerInput.trim()}
                    className="px-3 py-2.5 rounded-xl bg-violet-800 hover:bg-violet-700 disabled:opacity-40 text-white font-bold text-xs flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Ekle</span>
                  </button>
                </div>
              </div>

              {/* Announcement Note */}
              <div className="pt-2">
                <label className="block text-slate-300 font-bold mb-1 text-xs">
                  Duyuru Notu / Teslimat Mesajı (İsteğe Bağlı)
                </label>
                <input
                  type="text"
                  value={winnerNote}
                  onChange={(e) => setWinnerNote(e.target.value)}
                  placeholder="Örn: Kazanan üyelerimiz destek hattından iletişime geçerek ödüllerini alabilir."
                  className="w-full p-2.5 rounded-xl bg-[#090514] border border-violet-800/40 text-white text-xs placeholder:text-slate-600"
                />
              </div>
            </div>

            {/* List of Registered Participants Preview */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-400 block">
                Kayıtlı Katılımcılar ({entries.length})
              </span>
              <div className="max-h-28 overflow-y-auto rounded-xl bg-[#090514] border border-violet-900/30 p-2 divide-y divide-violet-900/20 text-xs">
                {loadingEntries ? (
                  <p className="text-center text-slate-500 py-3">Katılımcılar yükleniyor...</p>
                ) : entries.length === 0 ? (
                  <p className="text-center text-slate-500 py-3">Bu çekilişe henüz kimse katılmamış.</p>
                ) : (
                  entries.map((entry, idx) => (
                    <div key={entry.id} className="py-1.5 px-2 flex items-center justify-between text-slate-300 hover:bg-violet-950/30 rounded-lg">
                      <span className="font-semibold flex items-center gap-1.5">
                        <span className="text-slate-500 text-[10px] w-4">{idx + 1}.</span>
                        @{entry.username || entry.user_id}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-500">{formatDate(entry.created_at)}</span>
                        <button
                          type="button"
                          onClick={() => addWinnerToList(entry.username || entry.user_id)}
                          className="px-2 py-0.5 text-[10px] bg-violet-900/50 hover:bg-violet-800 text-violet-300 rounded font-bold cursor-pointer"
                        >
                          Seç
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Final Action Buttons */}
            <div className="pt-3 border-t border-violet-900/30 flex flex-col sm:flex-row items-center justify-between gap-3">
              {drawGiveaway.is_completed ? (
                <button
                  type="button"
                  onClick={() => handleReopenGiveaway(drawGiveaway.id)}
                  className="px-3 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/40 text-rose-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer w-full sm:w-auto justify-center"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Sonucu Sıfırla & Yeniden Başlat</span>
                </button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={closeDrawModal}
                  className="px-4 py-2.5 rounded-xl border border-violet-800 text-slate-300 text-xs font-semibold hover:text-white cursor-pointer"
                >
                  Vazgeç
                </button>
                <button
                  type="button"
                  onClick={handleFinalizeDraw}
                  disabled={selectedWinnersList.length === 0 || isDrawing}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-950/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Resmi Olarak Sonuçlandır ve Yayınla</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT MODAL WITH RICH EDITABLE TEMPLATE SYSTEM & WINNER COUNT */}
      {editingGiveaway && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="max-w-xl w-full rounded-3xl bg-[#120b24] border border-violet-700/50 p-5 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-violet-900/30 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-violet-900/50 border border-violet-700/50 flex items-center justify-center text-violet-300">
                  <Gift className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">
                    {isNew ? 'Yeni Çekiliş Başlat' : 'Çekilişi Düzenle'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Ödül detaylarını, kazanacak kişi sayısını ve süresini belirleyin.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingGiveaway(null)}
                className="p-1 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Templates Bar & Management Controls */}
            <div className="p-3 rounded-2xl bg-[#0a0616] border border-violet-900/40 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] text-slate-300 font-bold flex items-center gap-1.5">
                  <Bookmark className="w-3.5 h-3.5 text-amber-400" />
                  <span>Hızlı Şablonlar:</span>
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleOpenSaveAsTemplateDialog}
                    className="text-[10px] font-bold text-amber-300 hover:text-amber-200 flex items-center gap-1 bg-amber-500/10 hover:bg-amber-500/20 px-2 py-1 rounded-lg border border-amber-500/30 transition-all cursor-pointer"
                    title="Mevcut form alanlarını yeni bir şablon olarak kaydeder"
                  >
                    <BookmarkPlus className="w-3 h-3 text-amber-400" />
                    <span>Şablon Olarak Kaydet</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsTemplateManagerOpen(true)}
                    className="text-[10px] font-bold text-violet-300 hover:text-white flex items-center gap-1 bg-violet-900/40 hover:bg-violet-800/60 px-2 py-1 rounded-lg border border-violet-700/40 transition-all cursor-pointer"
                    title="Şablonları Düzenle ve Yönet"
                  >
                    <Settings2 className="w-3 h-3 text-violet-400" />
                    <span>Düzenle</span>
                  </button>
                </div>
              </div>

              {/* Horizontally scrollable template pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {templates.map((tpl) => (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => applyTemplate(tpl)}
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border whitespace-nowrap cursor-pointer transition-all flex items-center gap-1.5 shrink-0 active:scale-95 ${getBadgeStyle(
                      tpl.badge_color
                    )}`}
                    title={`${tpl.title} (${tpl.prize_details})`}
                  >
                    <span>{tpl.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Giveaway Form */}
            <form onSubmit={handleSave} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Çekiliş Başlığı *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Örn: Haftalık PlayStation 5 & Nakit Çekilişi"
                  className="w-full p-2.5 rounded-xl bg-[#0d0918] border border-violet-800/40 text-white placeholder:text-slate-600 focus:border-violet-500 focus:outline-none text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Ödül Detayları *</label>
                  <input
                    type="text"
                    required
                    value={prizeDetails}
                    onChange={(e) => setPrizeDetails(e.target.value)}
                    placeholder="Örn: 1x iPhone 16 Pro + 50.000 TL"
                    className="w-full p-2.5 rounded-xl bg-[#0d0918] border border-violet-800/40 text-white placeholder:text-slate-600 focus:border-violet-500 focus:outline-none text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Bitiş Tarihi ve Saati *</label>
                  <input
                    type="datetime-local"
                    required
                    value={endAt}
                    onChange={(e) => setEndAt(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-[#0d0918] border border-violet-800/40 text-white focus:border-violet-500 focus:outline-none text-xs"
                  />
                </div>
              </div>

              {/* WINNER COUNT (KAZANACAK KİŞİ SAYISI) */}
              <div className="p-3 rounded-2xl bg-[#0c0818] border border-violet-800/40 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-slate-200 font-bold text-xs flex items-center gap-1.5">
                    <Crown className="w-3.5 h-3.5 text-amber-400" />
                    <span>Kazanacak Toplam Kullanıcı Sayısı (Talihli Sayısı) *</span>
                  </label>
                  <span className="text-[11px] font-black text-amber-300">
                    {winnerCount} Kişi Kazanacak
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <input
                    type="number"
                    min={1}
                    max={100}
                    required
                    value={winnerCount}
                    onChange={(e) => setWinnerCount(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-24 p-2 rounded-xl bg-[#080410] border border-violet-700/60 text-white font-bold text-center text-xs focus:border-amber-400 focus:outline-none"
                  />
                  {/* Preset Buttons */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {[1, 2, 3, 5, 10, 20].map((cnt) => (
                      <button
                        key={cnt}
                        type="button"
                        onClick={() => setWinnerCount(cnt)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          winnerCount === cnt
                            ? 'bg-amber-500 text-violet-950 font-black shadow-md shadow-amber-500/20'
                            : 'bg-violet-950/60 hover:bg-violet-900 text-slate-300 border border-violet-800/50'
                        }`}
                      >
                        {cnt} Kişi
                      </button>
                    ))}
                  </div>
                </div>
                <p className="text-[10px] text-slate-400">
                  Bu çekiliş sonuçlandırılırken seçilecek toplam asil kazanan sayısıdır.
                </p>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Görsel URL *</label>
                <input
                  type="text"
                  required
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full p-2.5 rounded-xl bg-[#0d0918] border border-violet-800/40 text-white placeholder:text-slate-600 focus:border-violet-500 focus:outline-none text-xs"
                />
                {imageUrl && (
                  <div className="mt-1.5 flex items-center gap-2 p-1.5 rounded-xl bg-[#080512] border border-violet-900/30">
                    <img
                      src={imageUrl}
                      alt="Önizleme"
                      className="w-10 h-7 rounded-lg object-cover border border-violet-800/40"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                    <span className="text-[10px] text-slate-400 truncate flex-1">Görsel Önizleme</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Açıklama & Katılım Şartları</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Çekiliş katılım şartları ve detayları..."
                  className="w-full p-2.5 rounded-xl bg-[#0d0918] border border-violet-800/40 text-white placeholder:text-slate-600 focus:border-violet-500 focus:outline-none text-xs"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 text-white font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={(e) => setActive(e.target.checked)}
                    className="rounded accent-violet-600"
                  />
                  <span>Yayında Göster (Aktif)</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-violet-900/30">
                <button
                  type="button"
                  onClick={() => setEditingGiveaway(null)}
                  disabled={isSaving}
                  className="px-4 py-2.5 rounded-xl border border-violet-800 text-slate-300 text-xs font-semibold hover:text-white cursor-pointer"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-violet-950/50 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSaving ? 'Kaydediliyor...' : isNew ? 'Çekilişi Başlat' : 'Güncelle'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TEMPLATE MANAGER MODAL */}
      {isTemplateManagerOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="max-w-2xl w-full rounded-3xl bg-[#120b24] border-2 border-violet-700/60 p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-violet-900/30 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-violet-900/50 border border-violet-700/50 flex items-center justify-center text-violet-300">
                  <Layers className="w-4 h-4 text-violet-400" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Çekiliş Şablonlarını Düzenle & Yönet</h3>
                  <p className="text-[11px] text-slate-400">
                    Sık kullanılan çekiliş şablonlarını ekleyin, düzenleyin veya kaldırın.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsTemplateManagerOpen(false)}
                className="p-1 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Actions top bar */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => openTemplateEditor()}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-950/40 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Yeni Şablon Ekle</span>
              </button>

              <button
                type="button"
                onClick={handleResetTemplates}
                className="px-3 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/40 text-rose-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                title="Tüm şablonları varsayılanlara sıfırlar"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Varsayılanlara Sıfırla</span>
              </button>
            </div>

            {/* Template List Cards */}
            <div className="space-y-2.5 pt-1">
              {templates.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs bg-[#090514] rounded-2xl border border-violet-900/30">
                  Henüz tanımlı şablon bulunmuyor. Yeni şablon ekleyebilir veya varsayılana sıfırlayabilirsiniz.
                </div>
              ) : (
                templates.map((tpl) => (
                  <div
                    key={tpl.id}
                    className="p-3 sm:p-3.5 rounded-2xl bg-[#0a0515] border border-violet-800/40 flex items-center justify-between gap-3 hover:border-violet-600/50 transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`px-2.5 py-1 rounded-xl text-[11px] font-black border shrink-0 ${getBadgeStyle(
                          tpl.badge_color
                        )}`}
                      >
                        {tpl.name}
                      </div>

                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-white truncate">{tpl.title}</h4>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                          <span className="text-amber-300 truncate">Ödül: {tpl.prize_details}</span>
                          <span>•</span>
                          <span>{tpl.duration_days || 7} Gün</span>
                          <span>•</span>
                          <span className="text-purple-300 font-bold">{tpl.winner_count || 1} Kazanan</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => openTemplateEditor(tpl)}
                        className="p-2 rounded-xl bg-violet-900/50 hover:bg-violet-800 text-violet-300 hover:text-white border border-violet-700/40 cursor-pointer"
                        title="Şablonu Düzenle"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteTemplate(tpl.id, tpl.name)}
                        className="p-2 rounded-xl bg-rose-950/50 hover:bg-rose-900 text-rose-300 hover:text-white border border-rose-800/40 cursor-pointer"
                        title="Şablonu Sil"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-violet-900/30 flex justify-end">
              <button
                type="button"
                onClick={() => setIsTemplateManagerOpen(false)}
                className="px-5 py-2 rounded-xl bg-violet-800 hover:bg-violet-700 text-white text-xs font-bold cursor-pointer"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INDIVIDUAL TEMPLATE EDIT / CREATE MODAL */}
      {editingTemplate && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="max-w-md w-full rounded-3xl bg-[#140c28] border-2 border-amber-500/50 p-5 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-violet-900/30 pb-3">
              <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-amber-400" />
                <span>{editingTemplate.id ? 'Şablonu Düzenle' : 'Yeni Şablon Oluştur'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingTemplate(null)}
                className="p-1 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTemplate} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Şablon Buton Adı / Etiketi *
                </label>
                <input
                  type="text"
                  required
                  value={tplName}
                  onChange={(e) => setTplName(e.target.value)}
                  placeholder="Örn: 🎮 PlayStation 5 & Nakit"
                  className="w-full p-2.5 rounded-xl bg-[#090514] border border-violet-800/40 text-white text-xs focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Çekiliş Başlığı *</label>
                <input
                  type="text"
                  required
                  value={tplTitle}
                  onChange={(e) => setTplTitle(e.target.value)}
                  placeholder="Örn: Haftalık PlayStation 5 & Nakit Çekilişi"
                  className="w-full p-2.5 rounded-xl bg-[#090514] border border-violet-800/40 text-white text-xs focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Ödül Detayları *</label>
                <input
                  type="text"
                  required
                  value={tplPrize}
                  onChange={(e) => setTplPrize(e.target.value)}
                  placeholder="Örn: 1x PlayStation 5 + 50.000 TL Nakit"
                  className="w-full p-2.5 rounded-xl bg-[#090514] border border-violet-800/40 text-white text-xs focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Varsayılan Süre (Gün)</label>
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={tplDays}
                    onChange={(e) => setTplDays(parseInt(e.target.value) || 7)}
                    className="w-full p-2.5 rounded-xl bg-[#090514] border border-violet-800/40 text-white text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Kazanacak Kişi</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={tplWinnerCount}
                    onChange={(e) => setTplWinnerCount(parseInt(e.target.value) || 1)}
                    className="w-full p-2.5 rounded-xl bg-[#090514] border border-violet-800/40 text-white text-xs font-bold text-amber-300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Buton Renk Teması</label>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {(['violet', 'rose', 'amber', 'emerald', 'blue', 'cyan', 'fuchsia'] as const).map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setTplColor(color)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-black border uppercase transition-all cursor-pointer ${
                        tplColor === color ? 'ring-2 ring-white scale-105' : 'opacity-70'
                      } ${getBadgeStyle(color)}`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Görsel URL</label>
                <input
                  type="text"
                  value={tplImage}
                  onChange={(e) => setTplImage(e.target.value)}
                  placeholder="https://..."
                  className="w-full p-2.5 rounded-xl bg-[#090514] border border-violet-800/40 text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Açıklama</label>
                <textarea
                  rows={2}
                  value={tplDesc}
                  onChange={(e) => setTplDesc(e.target.value)}
                  placeholder="Şablon açıklaması..."
                  className="w-full p-2.5 rounded-xl bg-[#090514] border border-violet-800/40 text-white text-xs"
                />
              </div>

              <div className="pt-3 border-t border-violet-900/30 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingTemplate(null)}
                  className="px-4 py-2 rounded-xl border border-violet-800 text-slate-300 text-xs font-semibold"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-violet-950 font-black text-xs shadow-md"
                >
                  Şablonu Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK SAVE TEMPLATE NAME PROMPT MODAL (Replaces window.prompt) */}
      {saveTplPrompt && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="max-w-md w-full rounded-3xl bg-[#140c28] border-2 border-amber-500/50 p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-violet-900/30 pb-3">
              <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                <BookmarkPlus className="w-4 h-4 text-amber-400" />
                <span>Hızlı Şablon Olarak Kaydet</span>
              </h3>
              <button
                type="button"
                onClick={() => setSaveTplPrompt(null)}
                className="p-1 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Formdaki mevcut bilgileri hızlı çekiliş şablonlarınıza eklemek için bir buton başlığı belirleyin:
            </p>

            <div>
              <label className="block text-slate-300 font-semibold mb-1 text-xs">
                Şablon Adı / Buton Etiketi *
              </label>
              <input
                type="text"
                autoFocus
                required
                value={customTplName}
                onChange={(e) => setCustomTplName(e.target.value)}
                placeholder="Örn: 🎁 Özel VIP Çekiliş"
                className="w-full p-2.5 rounded-xl bg-[#090514] border border-violet-800/40 text-white text-xs focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-violet-900/30">
              <button
                type="button"
                onClick={() => setSaveTplPrompt(null)}
                className="px-4 py-2 rounded-xl border border-violet-800 text-slate-300 text-xs font-semibold"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={confirmSaveCurrentAsTemplate}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-violet-950 font-black text-xs shadow-md"
              >
                Şablonu Kaydet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION DIALOG (Solves iframe window.confirm restriction) */}
      {confirmModal && confirmModal.isOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="max-w-md w-full rounded-3xl bg-[#150b28] border-2 border-rose-500/50 p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                  confirmModal.variant === 'warning'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                }`}
              >
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">{confirmModal.title}</h3>
                <p className="text-xs text-slate-400 mt-0.5">Lütfen işlemi onaylayın</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-[#0b0517] p-3 rounded-2xl border border-violet-900/30">
              {confirmModal.message}
            </p>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2 rounded-xl border border-violet-800 text-slate-300 text-xs font-semibold hover:text-white cursor-pointer"
              >
                {confirmModal.cancelText || 'Vazgeç'}
              </button>
              <button
                type="button"
                onClick={async () => {
                  const cb = confirmModal.onConfirm;
                  setConfirmModal(null);
                  if (cb) await cb();
                }}
                className={`px-5 py-2 rounded-xl font-bold text-xs shadow-lg cursor-pointer text-white ${
                  confirmModal.variant === 'warning'
                    ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-950/40 text-violet-950 font-black'
                    : 'bg-rose-600 hover:bg-rose-500 shadow-rose-950/40'
                }`}
              >
                {confirmModal.confirmText || 'Evet, Onayla'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
