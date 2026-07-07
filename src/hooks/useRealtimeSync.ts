import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

type TableName = string;

interface Options {
  /** Tables to subscribe to. */
  tables: TableName[];
  /** Called (debounced) whenever any change arrives on any subscribed table. */
  onChange: () => void;
  /** Optional workspace filter — if provided, only changes with matching workspace_id trigger onChange. */
  workspaceId?: string | null;
  /** Debounce window in ms (default 300). */
  debounceMs?: number;
  /** Extra deps to force re-subscription (default: none). */
  enabled?: boolean;
}

/**
 * Subscribe to Postgres changes on a set of tables and call `onChange` (debounced)
 * whenever a relevant row is inserted/updated/deleted.
 *
 * Uses a single Supabase channel per hook instance. Cleans up on unmount.
 */
export function useRealtimeSync({
  tables,
  onChange,
  workspaceId,
  debounceMs = 300,
  enabled = true,
}: Options) {
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const key = tables.join(',');

  useEffect(() => {
    if (!enabled || !workspaceId || tables.length === 0) return;

    let timer: ReturnType<typeof setTimeout> | null = null;
    const schedule = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        timer = null;
        onChangeRef.current();
      }, debounceMs);
    };

    const channelName = `rt-${workspaceId}-${key}-${Math.random().toString(36).slice(2, 8)}`;
    let channel = supabase.channel(channelName);

    for (const table of tables) {
      channel = (channel as any).on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        (payload: any) => {
          // Client-side workspace filter — RLS already restricts, but this avoids
          // needless refetches when a global (workspace-less) table changes.
          const rowWs =
            payload?.new?.workspace_id ?? payload?.old?.workspace_id ?? null;
          if (rowWs && rowWs !== workspaceId) return;
          schedule();
        },
      );
    }

    channel.subscribe();

    return () => {
      if (timer) clearTimeout(timer);
      supabase.removeChannel(channel);
    };
  }, [workspaceId, key, debounceMs, enabled]);
}
