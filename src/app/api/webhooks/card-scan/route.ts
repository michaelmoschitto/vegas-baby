import { createHmac } from "crypto";

import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { z } from "zod";

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Request validation schema
const cardScanSchema = z.object({
  vendor_id: z.string().uuid(),
  card_uid: z.string().min(1),
  reader_name: z.string().optional(),
  key_id: z.string().min(32).max(32),
  signature: z.string().min(1),
  timestamp: z.string().min(1),
});

// Validate HMAC signature
async function validateSignature(
  keyId: string,
  signature: string,
  timestamp: string,
  body: string
): Promise<boolean> {
  try {
    // Get the secret key from the database
    const { data: apiKey, error } = await supabase
      .from("vendor_api_keys")
      .select("secret_key, is_active")
      .eq("key_id", keyId)
      .single();

    if (error || !apiKey || !apiKey.is_active) {
      return false;
    }

    // Parse the body and remove the signature field for validation
    const bodyObj = JSON.parse(body);
    const { signature: _, ...bodyWithoutSignature } = bodyObj;
    const bodyForValidation = JSON.stringify(bodyWithoutSignature);

    // Create HMAC signature
    const hmac = createHmac("sha256", apiKey.secret_key);
    const message = `${timestamp}:${bodyForValidation}`;
    hmac.update(message);
    const expectedSignature = hmac.digest("hex");

    // Update last_used_at
    await supabase
      .from("vendor_api_keys")
      .update({ last_used_at: new Date().toISOString() })
      .eq("key_id", keyId);

    return signature === expectedSignature;
  } catch (error) {
    console.error("Signature validation error:", error);
    return false;
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const data = JSON.parse(body);

    // Log incoming request
    console.warn("\n=== Card Scan Webhook Received ===");
    console.warn("Timestamp:", new Date().toISOString());
    const { signature: _, ...bodyWithoutSignature } = data;
    console.warn("Body:", JSON.stringify(bodyWithoutSignature));
    console.warn("===============================\n");

    // Validate request body
    const result = cardScanSchema.safeParse(data);
    if (!result.success) {
      console.warn(
        "Validation Error:",
        JSON.stringify(result.error.format(), null, 2)
      );
      return NextResponse.json(
        { error: "Invalid request format", details: result.error.format() },
        { status: 400 }
      );
    }

    // Validate signature
    const isValid = await validateSignature(
      result.data.key_id,
      result.data.signature,
      result.data.timestamp,
      body
    );

    if (!isValid) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // Insert card scan into Supabase
    const { data: scanData, error } = await supabase
      .from("card_scans")
      .insert({
        vendor_id: result.data.vendor_id,
        card_uid: result.data.card_uid,
        reader_name: result.data.reader_name,
        processed: false,
      })
      .select()
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to store card scan" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Card scan received and stored",
        data: scanData,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Card scan webhook error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
