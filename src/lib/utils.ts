import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString?: string): string {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return new Intl.DateTimeFormat('tr-TR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return dateString;
  }
}

export function formatTimeLeft(targetDate?: string): string {
  if (!targetDate) return 'Belirtilmedi';
  try {
    const time = new Date(targetDate).getTime();
    if (isNaN(time)) return 'Süresi Doldu';
    const now = Date.now();
    const diff = time - now;
    if (diff <= 0) return 'Süresi Doldu';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    if (days > 0) return `${days} gün ${hours} saat`;
    if (hours > 0) return `${hours} saat ${minutes} dk`;
    if (minutes > 0) return `${minutes} dk ${seconds} sn`;
    return `${seconds} saniye`;
  } catch {
    return 'Süresi Doldu';
  }
}

export function formatCoin(coins: number): string {
  return new Intl.NumberFormat('tr-TR').format(coins);
}
