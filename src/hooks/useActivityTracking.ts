import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { logDevError } from '@/lib/log';

export function useActivityTracking() {
  const { user } = useAuth();

  const trackEvent = useCallback(async (eventType: string, eventData?: Record<string, unknown>) => {
    if (!user) return;
    try {
      await supabase.from('user_activity_log').insert({
        user_id: user.id,
        event_type: eventType,
        // event_data is a JSON column; the supabase-js typings want a Json shape
        // and we only ever pass plain key/value records here.
        event_data: (eventData ?? {}) as never,
      });
    } catch (err) {
      // Tracking is best-effort and must never block UX, but log in dev so
      // schema/permission regressions surface during development.
      logDevError('useActivityTracking', err);
    }
  }, [user]);

  return { trackEvent };
}

