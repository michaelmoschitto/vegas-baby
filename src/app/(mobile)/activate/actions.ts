"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import fetch from "node-fetch";

const CARD_DEFAULT_BALANCE = 25.0;

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface ActivationFormData {
  cardUid: string;
  mezoId: string;
  email: string;
  fullName: string;
}

interface ActivationResult {
  success: boolean;
  error?: string;
  data?:
    | {
        id: string;
        card_uid: string;
        mezo_id: string;
        email: string;
        full_name: string;
        activated: boolean;
        balance: number;
        last_modified: string;
        created_at: string;
      }[]
    | null;
}

async function checkMezoIdRemote(mezoId: string): Promise<boolean> {
  try {
    const response = await fetch(`https://api.mezo.org/accounts/${mezoId}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (response.status === 404) {
      return true;
    }

    if (response.ok) {
      return false;
    }

    return false;
  } catch (error) {
    console.error("Error checking Mezo ID:", error);
    return false;
  }
}

export async function activateCard(
  formData: ActivationFormData
): Promise<ActivationResult> {
  try {
    const { cardUid, mezoId, email, fullName } = formData;

    // Validate input
    if (!cardUid || !mezoId || !email || !fullName) {
      return {
        success: false,
        error: "Missing required fields",
      };
    }

    // Check if card is already activated
    const { data: existingCard } = await supabase
      .from("card_activations")
      .select("card_uid")
      .eq("card_uid", cardUid)
      .single();

    if (existingCard) {
      return {
        success: false,
        error: "Card is already activated",
      };
    }

    // Check if Mezo ID is already taken
    const { data: existingMezoId } = await supabase
      .from("card_activations")
      .select("mezo_id")
      .eq("mezo_id", mezoId)
      .single();

    if (existingMezoId) {
      return {
        success: false,
        error: "Mezo ID is already taken",
      };
    }

    // Check if email is already registered
    const { data: existingEmail } = await supabase
      .from("card_activations")
      .select("email")
      .eq("email", email)
      .single();

    if (existingEmail) {
      return {
        success: false,
        error: "Email is already registered",
      };
    }

    // Check if Mezo ID is available in the Mezo system
    const isValidMezoId = await checkMezoIdRemote(mezoId);

    if (!isValidMezoId) {
      return {
        success: false,
        error: "Mezo ID is already taken in the Mezo system",
      };
    }

    // Insert new card activation
    const { data, error } = await supabase.from("card_activations").insert([
      {
        card_uid: cardUid,
        mezo_id: mezoId,
        email: email,
        full_name: fullName,
        activated: true,
        balance: CARD_DEFAULT_BALANCE,
      },
    ]);

    if (error) {
      console.error("Database error:", error);
      return {
        success: false,
        error: "Failed to activate card",
      };
    }

    // Revalidate the cache
    revalidatePath("/activate");

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error("Activation error:", error);
    return {
      success: false,
      error: "Internal server error",
    };
  }
}

export async function checkMezoIdAvailability(
  mezoId: string
): Promise<{ available: boolean; error?: string }> {
  try {
    if (!mezoId) {
      return { available: false, error: "Mezo ID is required" };
    }

    // Check if Mezo ID is already taken in our database
    const { data: existingMezoId } = await supabase
      .from("card_activations")
      .select("mezo_id")
      .eq("mezo_id", mezoId)
      .single();

    if (existingMezoId) {
      return { available: false, error: "Mezo ID is already taken" };
    }

    // Check if Mezo ID is available in the Mezo system
    const isValidMezoId = await checkMezoIdRemote(mezoId);
    if (!isValidMezoId) {
      return {
        available: false,
        error: "Mezo ID is already taken.",
      };
    }

    return { available: true };
  } catch (error) {
    console.error("Error checking Mezo ID availability:", error);
    return { available: false, error: "Failed to check Mezo ID availability" };
  }
}
