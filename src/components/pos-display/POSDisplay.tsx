"use client";

import { RealtimeChannel } from "@supabase/supabase-js";
import { useEffect, useState, useRef, useCallback } from "react";

import { useVendor } from "@/components/shared/VendorContext";
import { supabase, checkSupabaseConnection } from "@/lib/supabase";

import ProcessingScreen from "./ProcessingScreen";
import SuccessScreen from "./SuccessScreen";
import TransactionScreen from "./TransactionScreen";
import WelcomeScreen from "./WelcomeScreen";

type Screen = "welcome" | "transaction" | "processing" | "success";

interface TransactionData {
  cardUid: string;
  transactionAmount: number;
  vendorName: string;
  transactionDescription: string;
}

export default function POSDisplay() {
  const { vendorName, vendorId } = useVendor();
  const [currentScreen, setCurrentScreen] = useState<Screen>("welcome");
  const [transactionData, setTransactionData] =
    useState<TransactionData | null>(null);
  const [successData, setSuccessData] = useState<{
    cardBalance: number;
    transactionAmount: number;
    transactionDescription: string;
  } | null>(null);
  const [currentTransactionAmount, setCurrentTransactionAmount] =
    useState<number>(0);

  // Refs to store subscription channels
  const cardScanChannelRef = useRef<RealtimeChannel | null>(null);
  const displayControlChannelRef = useRef<RealtimeChannel | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const connectionCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Add reconnection attempt tracking
  const reconnectAttemptsRef = useRef({
    cardScan: 0,
    displayControl: 0,
  });
  const lastReconnectTimeRef = useRef({
    cardScan: 0,
    displayControl: 0,
  });

  console.log(
    "[POSDisplay] vendorName:",
    vendorName,
    "vendorId:",
    vendorId,
    "currentTransactionAmount:",
    currentTransactionAmount
  );

  // Fetch and subscribe to vendor's current transaction amount
  useEffect(() => {
    if (!vendorId) return;

    // Initial fetch
    async function fetchCurrentAmount() {
      const { data } = await supabase
        .from("vendors")
        .select("current_transaction_amount, default_price")
        .eq("id", vendorId)
        .single();

      if (data) {
        setCurrentTransactionAmount(
          data.current_transaction_amount || data.default_price || 0
        );
      }
    }
    fetchCurrentAmount();
  }, [vendorId]);

  // Ensure transactionData updates with new price if screen is open
  useEffect(() => {
    console.log(
      `[POSDisplay] Price update effect triggered. Screen: ${currentScreen}, Amount: ${currentTransactionAmount}`
    );
    if (currentScreen === "transaction") {
      setTransactionData((prevData) => {
        if (
          prevData &&
          prevData.transactionAmount !== currentTransactionAmount
        ) {
          console.log(
            `[POSDisplay] Updating transaction amount from ${prevData.transactionAmount} to ${currentTransactionAmount}`
          );
          return {
            ...prevData,
            transactionAmount: currentTransactionAmount,
          };
        }
        return prevData;
      });
    }
  }, [currentTransactionAmount, currentScreen]);

  // Handle transition from processing to success
  useEffect(() => {
    if (currentScreen === "processing" && transactionData) {
      // Random delay between 0.5-2 seconds
      const delay = Math.random() * 1500 + 500; // 500-2000ms

      const timer = setTimeout(() => {
        // If successData wasn't set, something went wrong with the transaction
        if (!successData) {
          console.error(
            "[POSDisplay] No success data received for transaction"
          );
          setCurrentScreen("welcome");
          return;
        }
        setCurrentScreen("success");
      }, delay);

      return () => clearTimeout(timer);
    }
  }, [currentScreen, transactionData, successData]);

  // Function to set up card scan subscription
  const setupCardScanSubscription = useCallback(() => {
    if (!vendorName || !vendorId) {
      console.log(
        "[POSDisplay] Missing vendor info, not subscribing to card scans"
      );
      return;
    }

    // Clean up existing subscription
    if (cardScanChannelRef.current) {
      supabase.removeChannel(cardScanChannelRef.current);
      cardScanChannelRef.current = null;
    }

    console.log(
      "[POSDisplay] Setting up card scan subscription for vendor:",
      vendorId
    );

    // Subscribe to card scans for this vendor
    const channel = supabase
      .channel(`pos-display-${vendorId}-${Date.now()}`) // Unique channel name
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "card_scans",
          filter: `vendor_id=eq.${vendorId}`,
        },
        async (payload) => {
          console.log("[POSDisplay] Card scan received:", payload);

          // Get the card UID from the scan
          const cardUid = payload.new.card_uid;

          setTransactionData({
            cardUid: cardUid,
            transactionAmount: currentTransactionAmount,
            vendorName,
            transactionDescription: `${vendorName}`,
          });
          setCurrentScreen("transaction");
        }
      )
      .subscribe((status) => {
        console.log("[POSDisplay] Card scan subscription status:", status);
        if (status === "CLOSED" || status === "CHANNEL_ERROR") {
          // Track reconnection attempts
          const now = Date.now();
          const timeSinceLastAttempt =
            now - lastReconnectTimeRef.current.cardScan;

          // Reset attempt counter if it's been more than 30 seconds since last attempt
          if (timeSinceLastAttempt > 30000) {
            reconnectAttemptsRef.current.cardScan = 0;
          }

          reconnectAttemptsRef.current.cardScan++;
          lastReconnectTimeRef.current.cardScan = now;

          // Calculate backoff delay: 3s, 6s, 12s, 24s, then max 30s
          const backoffDelay = Math.min(
            3000 * Math.pow(2, reconnectAttemptsRef.current.cardScan - 1),
            30000
          );

          // Clear any existing timeout
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
          }

          console.log(
            `[POSDisplay] Card scan disconnected. Reconnecting in ${
              backoffDelay / 1000
            }s (attempt ${reconnectAttemptsRef.current.cardScan})`
          );

          reconnectTimeoutRef.current = setTimeout(() => {
            console.log(
              "[POSDisplay] Attempting to reconnect card scan subscription..."
            );
            setupCardScanSubscription();
          }, backoffDelay);
        } else if (status === "SUBSCRIBED") {
          // Reset attempts on successful connection
          reconnectAttemptsRef.current.cardScan = 0;
        }
      });

    cardScanChannelRef.current = channel;
  }, [vendorName, vendorId, currentTransactionAmount]);

  // Function to set up display control subscription
  const setupDisplayControlSubscription = useCallback(() => {
    if (!vendorId) {
      console.log(
        "[POSDisplay] Missing vendor ID, not subscribing to display control"
      );
      return;
    }

    // Clean up existing subscription
    if (displayControlChannelRef.current) {
      supabase.removeChannel(displayControlChannelRef.current);
      displayControlChannelRef.current = null;
    }

    console.log(
      "[POSDisplay] Setting up display control subscription for vendor:",
      vendorId
    );

    const channel = supabase
      .channel(`vendor-${vendorId}-display-control`) // Remove timestamp - must match POS sender
      .on("broadcast", { event: "transaction-success" }, (payload) => {
        console.log("[POSDisplay] Received transaction-success event", payload);
        // Set success data and show success screen
        setSuccessData({
          cardBalance: payload.payload.cardBalance,
          transactionAmount: payload.payload.transactionAmount,
          transactionDescription: payload.payload.transactionDescription,
        });
        setCurrentScreen("success");
      })
      .on("broadcast", { event: "price-update" }, (payload) => {
        console.log("[POSDisplay] Received price-update event", payload);
        // Update the current transaction amount
        const newAmount = payload.payload.amount;
        setCurrentTransactionAmount(newAmount);

        // Update transaction data if we're on the transaction screen
        if (currentScreen === "transaction") {
          setTransactionData((prevData) => {
            if (prevData) {
              console.log(
                `[POSDisplay] Updating transaction amount from ${prevData.transactionAmount} to ${newAmount}`
              );
              return {
                ...prevData,
                transactionAmount: newAmount,
              };
            }
            return prevData;
          });
        }
      })
      .subscribe((status) => {
        console.log(
          "[POSDisplay] Display control subscription status:",
          status
        );
        if (status === "CLOSED" || status === "CHANNEL_ERROR") {
          // Track reconnection attempts
          const now = Date.now();
          const timeSinceLastAttempt =
            now - lastReconnectTimeRef.current.displayControl;

          // Reset attempt counter if it's been more than 30 seconds since last attempt
          if (timeSinceLastAttempt > 30000) {
            reconnectAttemptsRef.current.displayControl = 0;
          }

          reconnectAttemptsRef.current.displayControl++;
          lastReconnectTimeRef.current.displayControl = now;

          // Calculate backoff delay: 3s, 6s, 12s, 24s, then max 30s
          const backoffDelay = Math.min(
            3000 * Math.pow(2, reconnectAttemptsRef.current.displayControl - 1),
            30000
          );

          // Clear any existing timeout
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
          }

          console.log(
            `[POSDisplay] Display control disconnected. Reconnecting in ${
              backoffDelay / 1000
            }s (attempt ${reconnectAttemptsRef.current.displayControl})`
          );

          reconnectTimeoutRef.current = setTimeout(() => {
            console.log(
              "[POSDisplay] Attempting to reconnect display control subscription..."
            );
            setupDisplayControlSubscription();
          }, backoffDelay);
        } else if (status === "SUBSCRIBED") {
          // Reset attempts on successful connection
          reconnectAttemptsRef.current.displayControl = 0;
        }
      });

    displayControlChannelRef.current = channel;
  }, [vendorId, currentScreen]);

  // Set up subscriptions
  useEffect(() => {
    setupCardScanSubscription();
    return () => {
      if (cardScanChannelRef.current) {
        supabase.removeChannel(cardScanChannelRef.current);
        cardScanChannelRef.current = null;
      }
    };
  }, [setupCardScanSubscription]);

  useEffect(() => {
    setupDisplayControlSubscription();
    return () => {
      if (displayControlChannelRef.current) {
        supabase.removeChannel(displayControlChannelRef.current);
        displayControlChannelRef.current = null;
      }
    };
  }, [setupDisplayControlSubscription]);

  // Periodic connection health check
  useEffect(() => {
    const checkConnection = async () => {
      const connected = await checkSupabaseConnection();
      if (!connected) {
        console.warn(
          "[POSDisplay] Connection lost, attempting to reconnect..."
        );
        // Re-setup subscriptions
        setupCardScanSubscription();
        setupDisplayControlSubscription();
      }
    };

    // Check connection every 30 seconds
    connectionCheckIntervalRef.current = setInterval(checkConnection, 30000);

    // Initial check
    checkConnection();

    return () => {
      if (connectionCheckIntervalRef.current) {
        clearInterval(connectionCheckIntervalRef.current);
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [setupCardScanSubscription, setupDisplayControlSubscription]);

  // Log vendor context changes for debugging
  useEffect(() => {
    console.log("[POSDisplay] Vendor context changed:", {
      vendorName,
      vendorId,
    });
    if (!vendorName || !vendorId) {
      console.warn("[POSDisplay] Vendor context is incomplete!");
    }
  }, [vendorName, vendorId]);

  return (
    <div className="min-h-screen w-full">
      {currentScreen === "welcome" && <WelcomeScreen />}
      {currentScreen === "transaction" &&
        transactionData &&
        (() => {
          console.log(
            "[POSDisplay] Rendering TransactionScreen with data:",
            transactionData
          );
          return (
            <TransactionScreen
              data={transactionData}
              onScreenChange={(screen, cardBalance) => {
                if (screen === "welcome") {
                  setCurrentScreen("welcome");
                  setTransactionData(null);
                  setSuccessData(null);
                } else if (screen === "processing") {
                  // Store the card balance for the success screen
                  if (cardBalance !== undefined) {
                    const remainingBalance =
                      cardBalance - transactionData.transactionAmount;
                    setSuccessData({
                      cardBalance: remainingBalance,
                      transactionAmount: transactionData.transactionAmount,
                      transactionDescription:
                        transactionData.transactionDescription,
                    });
                  }
                  setCurrentScreen("processing");
                }
              }}
            />
          );
        })()}
      {currentScreen === "processing" && <ProcessingScreen />}
      {currentScreen === "success" && successData && (
        <SuccessScreen data={successData} />
      )}
    </div>
  );
}
