"use client";

import { useCallback, useEffect, useState } from "react";

import { DashboardShell } from "@/components/dashboard/shell/DashboardShell";
import { ReviewsManager } from "@/components/dashboard/ReviewsManager";

export function ReviewsDashboard() {
  const [viewerEmail, setViewerEmail] = useState<string | null>(null);
  const noopRefresh = useCallback(async () => {}, []);

  useEffect(() => {
    void fetch("/api/dashboard/auth/me", { credentials: "include" })
      .then(async (r) => (r.ok ? ((await r.json()) as { email?: string }) : null))
      .then((d) => { if (d?.email) setViewerEmail(d.email); })
      .catch(() => {});
  }, []);

  return (
    <DashboardShell
      bindScrollRef={() => {}}
      refreshing={false}
      onRefresh={noopRefresh}
      payload={null}
      lastSyncIso={null}
      pwaSlot={null}
      viewerEmail={viewerEmail}
    >
      <ReviewsManager />
    </DashboardShell>
  );
}
