"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface VendorFormData {
  id?: string;
  name: string;
  type: string;
  defaultPrice?: string;
}

interface VendorResult {
  success: boolean;
  error?: string;
  data?: {
    id: string;
    name: string;
    type: string;
    default_price: number | null;
  };
}

export async function saveVendorConfig(
  formData: VendorFormData
): Promise<VendorResult> {
  try {
    const { id, name, type, defaultPrice } = formData;

    if (!name || !type) {
      return {
        success: false,
        error: "Vendor name and type are required.",
      };
    }

    if (id) {
      // Update by id (including name change)
      const { data, error } = await supabase
        .from("vendors")
        .update({
          name,
          type,
          default_price: defaultPrice ? parseFloat(defaultPrice) : null,
        })
        .eq("id", id)
        .select()
        .single();
      if (error) {
        return {
          success: false,
          error: error.message || "Failed to update vendor config.",
        };
      }
      revalidatePath("/pos/setup");
      return { success: true, data };
    } else {
      // Upsert by name (new vendor)
      const { data, error } = await supabase
        .from("vendors")
        .upsert(
          [
            {
              name,
              type,
              default_price: defaultPrice ? parseFloat(defaultPrice) : null,
            },
          ],
          { onConflict: "name" }
        )
        .select()
        .single();
      if (error) {
        return {
          success: false,
          error: error.message || "Failed to save vendor config.",
        };
      }
      revalidatePath("/pos/setup");
      return { success: true, data };
    }
  } catch (error) {
    console.error("Error saving vendor config:", error);
    return {
      success: false,
      error: "Internal server error",
    };
  }
}

// Fetch all vendors for dropdown
export async function fetchVendors() {
  const { data } = await supabase
    .from("vendors")
    .select("id, name, type, default_price")
    .order("name");
  return data || [];
}

// Fetch a single vendor by name
export async function fetchVendorByName(name: string) {
  const { data, error } = await supabase
    .from("vendors")
    .select("id, name, type, default_price")
    .eq("name", name)
    .single();

  if (error) {
    console.error("Error fetching vendor:", error);
    return null;
  }

  return data;
}
