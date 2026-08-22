import { detectDevice, getSessionId, getVisitorId, DeviceInfo } from './deviceDetector';
import { VisitorLog, VisitorStats } from '../types';

export interface ActivityPayload {
  action_type: 'page_view' | 'login' | 'register' | 'sponsor_click' | 'banner_click' | 'wheel_spin' | 'giveaway_entry' | 'store_purchase' | 'heartbeat' | 'other';
  action_name?: string;
  path?: string;
  page_title?: string;
  referrer?: string;
  user_id?: string | null;
  username?: string | null;
  details?: Record<string, any>;
}

class ActivityTrackerService {
  private deviceInfo: DeviceInfo | null = null;
  private lastTrackedPath = '';
  private lastTrackedTime = 0;

  constructor() {
    if (typeof window !== 'undefined') {
      this.deviceInfo = detectDevice();
    }
  }

  public getDevice(): DeviceInfo {
    if (!this.deviceInfo && typeof window !== 'undefined') {
      this.deviceInfo = detectDevice();
    }
    return this.deviceInfo || detectDevice();
  }

  public async trackActivity(payload: ActivityPayload): Promise<void> {
    if (typeof window === 'undefined') return;

    try {
      const dev = this.getDevice();
      const currentPath = payload.path || window.location.pathname + window.location.search;

      // DO NOT track admin panel routes or admin management actions
      if (
        currentPath.startsWith('/admin') ||
        currentPath.includes('/admin') ||
        payload.details?.is_admin ||
        payload.action_name?.toLowerCase().includes('admin')
      ) {
        return;
      }

      const currentTitle = payload.page_title || document.title || 'Shelby Online';
      const ref = payload.referrer || document.referrer || '';

      // Avoid identical rapid pageview spam within 1 second
      const now = Date.now();
      if (payload.action_type === 'page_view' && this.lastTrackedPath === currentPath && now - this.lastTrackedTime < 1000) {
        return;
      }

      this.lastTrackedPath = currentPath;
      this.lastTrackedTime = now;

      const body = {
        session_id: getSessionId(),
        visitor_id: getVisitorId(),
        user_id: payload.user_id || null,
        username: payload.username || null,
        is_authenticated: Boolean(payload.user_id),
        device_info: dev,
        path: currentPath,
        page_title: currentTitle,
        referrer: ref,
        action_type: payload.action_type,
        action_name: payload.action_name,
        details: payload.details || {},
      };

      // Send to server
      fetch('/api/tracking/activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        keepalive: true,
      }).catch(() => {});
    } catch (err) {
      console.warn('Activity tracker error:', err);
    }
  }

  public async getLiveStatus(): Promise<{
    active_count: number;
    active_visitors: any[];
    device_counts: { mobile: number; desktop: number; tablet: number };
    recent_logs: VisitorLog[];
  }> {
    try {
      const res = await fetch('/api/tracking/live');
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.warn('Error fetching live status:', err);
    }
    return {
      active_count: 1,
      active_visitors: [],
      device_counts: { mobile: 1, desktop: 0, tablet: 0 },
      recent_logs: [],
    };
  }

  public async getStats(params: {
    time_range?: string;
    start_date?: string;
    end_date?: string;
  } = {}): Promise<VisitorStats | null> {
    try {
      const q = new URLSearchParams();
      if (params.time_range) q.set('time_range', params.time_range);
      if (params.start_date) q.set('start_date', params.start_date);
      if (params.end_date) q.set('end_date', params.end_date);

      const res = await fetch(`/api/tracking/stats?${q.toString()}`);
      if (res.ok) {
        const json = await res.json();
        return json.stats;
      }
    } catch (err) {
      console.warn('Error fetching visitor stats:', err);
    }
    return null;
  }

  public async getDailyLogs(days = 60): Promise<{
    success: boolean;
    total_days: number;
    today_unique_visitors: number;
    today_page_views: number;
    yesterday_unique_visitors: number;
    yesterday_page_views: number;
    peak_day: { date: string; visitors: number };
    average_daily_visitors: number;
    total_recorded_visitors: number;
    total_recorded_page_views: number;
    daily_logs: import('../types').DailyVisitorLog[];
  } | null> {
    try {
      const res = await fetch(`/api/tracking/daily?days=${days}`);
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.warn('Error fetching daily visitor logs:', err);
    }
    return null;
  }

  public async getLogs(params: {
    device?: string;
    action?: string;
    search?: string;
    user_type?: string;
    time_range?: string;
    start_date?: string;
    end_date?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ total: number; logs: VisitorLog[] }> {
    try {
      const q = new URLSearchParams();
      if (params.device) q.set('device', params.device);
      if (params.action) q.set('action', params.action);
      if (params.search) q.set('search', params.search);
      if (params.user_type) q.set('user_type', params.user_type);
      if (params.time_range) q.set('time_range', params.time_range);
      if (params.start_date) q.set('start_date', params.start_date);
      if (params.end_date) q.set('end_date', params.end_date);
      if (params.limit) q.set('limit', String(params.limit));
      if (params.offset) q.set('offset', String(params.offset));

      const res = await fetch(`/api/tracking/logs?${q.toString()}`);
      if (res.ok) {
        const data = await res.json();
        return { total: data.total || 0, logs: data.logs || [] };
      }
    } catch (err) {
      console.warn('Error fetching logs:', err);
    }
    return { total: 0, logs: [] };
  }

  public async clearLogs(): Promise<boolean> {
    try {
      const res = await fetch('/api/tracking/clear', { method: 'POST' });
      return res.ok;
    } catch {
      return false;
    }
  }
}

export const activityTracker = new ActivityTrackerService();
