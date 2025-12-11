import crypto from "crypto";

import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface ApiKey {
  id: string;
  vendor_id: string;
  key_id: string;
  secret_key: string;
  created_at: string;
  last_used_at: string | null;
  is_active: boolean;
}

export async function generateApiKey(vendorId: string): Promise<ApiKey> {
  // Generate a random key ID (32 characters)
  const keyId = crypto.randomBytes(16).toString("hex");

  // Generate a random secret key (64 characters)
  const secretKey = crypto.randomBytes(32).toString("hex");

  // Insert the new API key
  const { data, error } = await supabase
    .from("vendor_api_keys")
    .insert({
      vendor_id: vendorId,
      key_id: keyId,
      secret_key: secretKey,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to generate API key: ${error.message}`);
  }

  return data;
}

export async function listApiKeys(vendorId: string): Promise<ApiKey[]> {
  const { data, error } = await supabase
    .from("vendor_api_keys")
    .select("*")
    .eq("vendor_id", vendorId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to list API keys: ${error.message}`);
  }

  return data;
}

export async function revokeApiKey(keyId: string): Promise<void> {
  const { error } = await supabase
    .from("vendor_api_keys")
    .update({ is_active: false })
    .eq("key_id", keyId);

  if (error) {
    throw new Error(`Failed to revoke API key: ${error.message}`);
  }
}

export async function validateApiKey(keyId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("vendor_api_keys")
    .select("is_active")
    .eq("key_id", keyId)
    .single();

  if (error || !data) {
    return false;
  }

  return data.is_active;
}
