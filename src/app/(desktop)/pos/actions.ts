"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

// Initialize Supabase client with service role key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface TransactionData {
  cardUid: string;
  amount: number;
  description?: string;
  vendorId: string;
}

export async function processTransaction(data: TransactionData) {
  try {
    const { cardUid, amount, description, vendorId } = data;

    // Validate input
    if (!cardUid || !amount || amount <= 0 || !vendorId) {
      return {
        success: false,
        error: "Invalid transaction data",
      };
    }

    // Get current card balance
    const { data: cardData, error: cardError } = await supabase
      .from("card_activations")
      .select("balance, activated")
      .eq("card_uid", cardUid)
      .single();

    if (cardError || !cardData) {
      return {
        success: false,
        error: "Card not found",
      };
    }

    if (!cardData.activated) {
      return {
        success: false,
        error: "Card is not activated",
      };
    }

    if (amount > cardData.balance) {
      return {
        success: false,
        error: "Insufficient balance",
      };
    }

    // Start a transaction
    const { error: txError } = await supabase.from("transactions").insert({
      card_uid: cardUid,
      amount,
      description,
      vendor_id: vendorId,
    });

    if (txError) {
      return {
        success: false,
        error: "Failed to record transaction",
      };
    }

    // Update card balance
    const { error: balError } = await supabase
      .from("card_activations")
      .update({ balance: cardData.balance - amount })
      .eq("card_uid", cardUid);

    if (balError) {
      return {
        success: false,
        error: "Failed to update card balance",
      };
    }

    // Revalidate the POS page
    revalidatePath("/pos");

    return {
      success: true,
      newBalance: cardData.balance - amount,
    };
  } catch (error) {
    console.error("Transaction error:", error);
    return {
      success: false,
      error: "Internal server error",
    };
  }
}
