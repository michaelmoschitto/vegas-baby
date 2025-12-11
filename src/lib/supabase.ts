import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
    // Add reconnection configuration
    reconnectAfterMs: (attemptNumber: number) => {
      // Exponential backoff: 1s, 2s, 4s, 8s, then every 10s
      return Math.min(1000 * Math.pow(2, attemptNumber - 1), 10000);
    },
  },
  // Add global error handler
  global: {
    headers: {
      "x-application-name": "vegas-baby-pos",
    },
  },
});

// Export a helper to check connection status
export const checkSupabaseConnection = async () => {
  try {
    const { error } = await supabase.from("vendors").select("id").limit(1);
    return !error;
  } catch {
    return false;
  }
};
