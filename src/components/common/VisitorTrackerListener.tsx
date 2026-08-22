import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { activityTracker } from '../../lib/activityTracker';

export const VisitorTrackerListener: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();

  // 1. Track Page View on every route change
  useEffect(() => {
    // Ignore all admin panel paths so admin activities do not pollute visitor logs
    if (location.pathname.startsWith('/admin')) {
      return;
    }

    // Delay slightly to let document.title and page render
    const timeout = setTimeout(() => {
      activityTracker.trackActivity({
        action_type: 'page_view',
        path: location.pathname + location.search,
        page_title: document.title,
        user_id: user?.id || null,
        username: user?.username || null,
      });
    }, 150);

    return () => clearTimeout(timeout);
  }, [location.pathname, location.search, user?.id, user?.username]);

  // 2. Periodic Heartbeat every 45 seconds while tab is active to calculate real-time live visitors
  useEffect(() => {
    // Ignore all admin panel paths
    if (location.pathname.startsWith('/admin')) {
      return;
    }

    const heartbeatInterval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        activityTracker.trackActivity({
          action_type: 'heartbeat',
          path: location.pathname + location.search,
          page_title: document.title,
          user_id: user?.id || null,
          username: user?.username || null,
        });
      }
    }, 45000);

    return () => clearInterval(heartbeatInterval);
  }, [location.pathname, location.search, user?.id, user?.username]);

  return null;
};
