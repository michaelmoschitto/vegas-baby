import { useEffect, useState } from "react";

import { supabase } from "@/lib/supabase";

type CardScan = {
  id: string;
  vendor_id: string;
  card_uid: string;
  reader_name: string | null;
  processed: boolean;
  created_at: string;
  processed_at: string | null;
  error_message: string | null;
};

export function useLatestCardScan(vendorId: string | null) {
  const [scan, setScan] = useState<CardScan | null>(null);

  useEffect(() => {
    if (!vendorId) return;

    // Only subscribe to new inserts, no initial fetch
    const channel = supabase
      .channel("realtime:card_scans")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "card_scans",
          filter: `vendor_id=eq.${vendorId}`,
        },
        (payload) => {
          setScan(payload.new as CardScan);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [vendorId]);

  return scan;
}
