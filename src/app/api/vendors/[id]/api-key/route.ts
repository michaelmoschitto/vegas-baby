import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

import { generateApiKey } from "@/lib/api-keys";

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: vendorId } = await params;

    // Verify vendor exists
    const { data: vendor, error: vendorError } = await supabase
      .from("vendors")
      .select("id")
      .eq("id", vendorId)
      .single();

    if (vendorError || !vendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }

    // Check if API key already exists for this vendor
    const { data: existingKey } = await supabase
      .from("vendor_api_keys")
      .select("vendor_id, key_id, secret_key")
      .eq("vendor_id", vendorId)
      .single();

    if (existingKey) {
      return NextResponse.json({
        success: true,
        data: {
          vendor_id: existingKey.vendor_id,
          key_id: existingKey.key_id,
          secret_key: existingKey.secret_key,
        },
      });
    }

    // If not, generate new API key
    const apiKey = await generateApiKey(vendorId);

    return NextResponse.json({
      success: true,
      data: {
        vendor_id: apiKey.vendor_id,
        key_id: apiKey.key_id,
        secret_key: apiKey.secret_key,
      },
    });
  } catch (error) {
    console.error("Error generating API key:", error);
    return NextResponse.json(
      { error: "Failed to generate API key" },
      { status: 500 }
    );
  }
}
