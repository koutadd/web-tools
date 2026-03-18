'use client';

import { useEffect } from 'react';

export default function OwnerPageLogger({
  storeId,
  phase,
}: {
  storeId: string;
  phase: string;
}) {
  useEffect(() => {
    fetch(`/api/stores/${storeId}/event-logs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventType: 'screen_viewed',
        actorType: 'owner',
        phase,
        metaJson: JSON.stringify({ screen: 'owner_dashboard' }),
      }),
    }).catch(() => {/* fire-and-forget */});
  }, [storeId, phase]);

  return null;
}
