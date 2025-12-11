"use client";

import { motion } from "framer-motion";
import { X, Check } from "lucide-react";
import { useEffect, useState } from "react";

import { useVendor } from "@/components/shared/VendorContext";
import { supabase } from "@/lib/supabase";

interface TransactionData {
  cardUid: string;
  transactionAmount: number;
  vendorName: string;
  transactionDescription: string;
}

interface TransactionScreenProps {
  data: TransactionData;
  onScreenChange: (
    screen: "welcome" | "processing",
    cardBalance?: number
  ) => void;
}

export default function TransactionScreen({
  data,
  onScreenChange,
}: TransactionScreenProps) {
  console.log("[TransactionScreen] Component rendered with data:", data);

  const { vendorId } = useVendor();
  console.log("[TransactionScreen] vendorId from context:", vendorId);

  const [cardBalance, setCardBalance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  console.log("[TransactionScreen] Current state:", {
    cardBalance,
    isLoading,
    error,
  });

  useEffect(() => {
    console.log(
      "[TransactionScreen] useEffect triggered - vendorId:",
      vendorId,
      "cardUid:",
      data.cardUid
    );
    if (!vendorId) {
      console.error(
        "[TransactionScreen] vendorId is missing! This should not happen."
      );
      return;
    }
    if (!data.cardUid) {
      console.error("[TransactionScreen] cardUid is missing!");
      return;
    }
    async function fetchCardData() {
      console.log(
        "[TransactionScreen] Running fetchCardData for cardUid:",
        data.cardUid
      );
      try {
        // Get card balance from card_activations table
        console.log(
          "[TransactionScreen] Querying card_activations for:",
          data.cardUid
        );
        const { data: cardData, error: cardError } = await supabase
          .from("card_activations")
          .select("balance, activated")
          .eq("card_uid", data.cardUid)
          .single();

        console.log("[TransactionScreen] Card query result:", {
          cardData,
          cardError,
        });

        if (cardError || !cardData) {
          console.error("[TransactionScreen] Card lookup failed:", {
            cardUid: data.cardUid,
            error: cardError,
            data: cardData,
          });
          throw new Error("Card not found");
        }

        if (!cardData.activated) {
          throw new Error("Card not activated");
        }

        console.log(
          "[TransactionScreen] Setting card balance to:",
          Number(cardData.balance)
        );
        setCardBalance(Number(cardData.balance));
      } catch (err) {
        console.error("[TransactionScreen] Error fetching card data:", err);
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setIsLoading(false);
      }
    }

    if (data.cardUid && vendorId) {
      fetchCardData();
    }
  }, [data.cardUid, vendorId]);

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Loading...</h1>
          <p className="text-gray-600">Fetching card information</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Error</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 0.6, ease: "easeInOut" }}
      className="min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 text-center relative z-10"
    >
      {/* Transaction Info */}
      <motion.div
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="mb-3 sm:mb-4"
      >
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
          Transaction
        </h1>
        <p className="text-base sm:text-lg text-gray-600">
          {data.transactionDescription}
        </p>
      </motion.div>

      {/* Transaction Amount - Larger and on top */}
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.6 }}
        className="bg-gradient-to-r from-red-500 to-pink-500 rounded-3xl shadow-xl p-6 sm:p-8 md:p-10 text-white mb-4 sm:mb-6 min-w-[18rem] sm:min-w-[22rem] md:min-w-[28rem]"
      >
        <h3 className="text-lg sm:text-xl font-semibold mb-2">
          Transaction Amount
        </h3>
        <div className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight">
          {data.transactionAmount > 0
            ? `$${data.transactionAmount.toFixed(2)}`
            : ""}
        </div>
      </motion.div>

      {/* Balance Display - Smaller and below */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.8 }}
        className="bg-white rounded-3xl shadow-xl p-4 sm:p-6 md:p-8 mb-4 sm:mb-6 border border-gray-100 relative overflow-hidden min-w-[18rem] md:min-w-[22rem]"
      >
        {/* Subtle background pattern */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-red-50 to-transparent rounded-full -mr-12 -mt-12" />

        <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
          Your Balance
        </h2>

        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{
            delay: 0.8,
            duration: 0.8,
            type: "spring",
            bounce: 0.4,
          }}
          className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-1 tracking-tight"
        >
          ${cardBalance?.toFixed(2) ?? "0.00"}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.6 }}
          className="text-sm sm:text-base text-gray-500 font-medium"
        >
          Available on your card
        </motion.div>
      </motion.div>

      {/* Insufficient funds message */}
      {cardBalance !== null && data.transactionAmount > cardBalance && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1, duration: 0.4 }}
          className="text-red-600 text-base sm:text-lg font-medium mb-2"
        >
          Insufficient balance for this transaction
        </motion.div>
      )}

      {/* Confirmation Buttons */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.6 }}
        className="flex gap-4 sm:gap-6 mt-4 sm:mt-6"
      >
        {data.transactionAmount > 0 && (
          <>
            <button
              onClick={async () => {
                // Send cancel message to POS to reset
                const channel = supabase.channel(
                  `vendor-${vendorId}-transactions`
                );

                channel.subscribe(async (status) => {
                  if (status === "SUBSCRIBED") {
                    await channel.send({
                      type: "broadcast",
                      event: "cancel-transaction",
                      payload: {},
                    });

                    // Clean up channel after a short delay
                    setTimeout(() => {
                      supabase.removeChannel(channel);
                    }, 100);
                  }
                });

                // Return to welcome screen
                onScreenChange("welcome");
              }}
              className="flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gray-100 text-gray-600 border-4 border-gray-300"
              aria-label="Cancel"
            >
              <X className="w-7 h-7 sm:w-9 sm:h-9" />
            </button>
            <button
              onClick={async () => {
                // Don't process if insufficient funds
                if (data.transactionAmount > (cardBalance ?? 0)) return;

                // Publish transaction confirmation to the POS
                const channel = supabase.channel(
                  `vendor-${vendorId}-transactions`
                );

                // Subscribe to ensure channel is active
                channel.subscribe(async (status) => {
                  if (status === "SUBSCRIBED") {
                    await channel.send({
                      type: "broadcast",
                      event: "confirm-transaction",
                      payload: {
                        cardUid: data.cardUid,
                        amount: data.transactionAmount,
                        description: data.transactionDescription,
                        cardBalance: cardBalance,
                      },
                    });

                    // Move to processing screen
                    onScreenChange("processing", cardBalance ?? undefined);

                    // Clean up channel after a short delay
                    setTimeout(() => {
                      supabase.removeChannel(channel);
                    }, 1000);
                  }
                });
              }}
              disabled={data.transactionAmount > (cardBalance ?? 0)}
              className={`flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 transition-all ${
                data.transactionAmount > (cardBalance ?? 0)
                  ? "bg-gray-200 text-gray-400 border-gray-300 cursor-not-allowed opacity-50"
                  : "bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200"
              }`}
              aria-label="Confirm"
            >
              <Check className="w-7 h-7 sm:w-9 sm:h-9" />
            </button>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}
