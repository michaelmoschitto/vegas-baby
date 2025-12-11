"use client";

import { RotateCw, Camera } from "lucide-react";
import { useState, useEffect, useCallback } from "react";

import { CardScanner } from "@/components/card-scanner";
import { TransactionsTable } from "@/components/shared/TransactionsTable";
import { useVendor } from "@/components/shared/VendorContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { validateCardUid } from "@/lib/mezo-id";
import { supabase } from "@/lib/supabase";
import { useLatestCardScan } from "@/lib/useCardScans";

import { processTransaction } from "./actions";

// Define transaction type
interface Transaction {
  id: string;
  timestamp: string;
  card_uid: string;
  amount: number;
  description: string;
}

export default function POSPage() {
  const { vendorName, defaultPrice, setDefaultPrice } = useVendor();
  const [cardUid, setCardUid] = useState("");
  const [balance, setBalance] = useState<number | null>(null);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [cardLoading, setCardLoading] = useState(false);
  const [txnLoading, setTxnLoading] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);
  const [txnError, setTxnError] = useState<string | null>(null);
  const [txnSuccess, setTxnSuccess] = useState<string | null>(null);
  const [vendor, setVendor] = useState<{
    id: string;
    default_price: number | null;
  } | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const latestScan = useLatestCardScan(vendor?.id || "");
  const [cardScanTrigger, setCardScanTrigger] = useState(0);
  const [isManualInput, setIsManualInput] = useState(false);
  const [cardUidError, setCardUidError] = useState<string | null>(null);

  useEffect(() => {
    if (!latestScan) return;
    setCardUid(latestScan.card_uid);
    setIsManualInput(false);
    setCardUidError(null);
    setCardScanTrigger((t) => t + 1); // increment to force effect

    // Also broadcast the current price when a card is scanned
    if (vendor?.id) {
      // Get the current amount value without adding it as a dependency
      const currentAmount = amount;
      if (currentAmount && currentAmount !== "") {
        const numericAmount = parseFloat(currentAmount);
        if (!isNaN(numericAmount) && numericAmount > 0) {
          console.log(
            `[POS] Card scanned - sending current price to display: $${numericAmount}`
          );

          // Send price update to display via broadcast
          const channel = supabase.channel(
            `vendor-${vendor.id}-display-control`
          );
          channel.subscribe(async (status) => {
            console.log(
              `[POS] Card scan price broadcast subscription status: ${status}`
            );
            if (status === "SUBSCRIBED") {
              const broadcastResult = await channel.send({
                type: "broadcast",
                event: "price-update",
                payload: {
                  amount: numericAmount,
                  vendorId: vendor.id,
                },
              });
              console.log(
                "[POS] Card scan price broadcast result:",
                broadcastResult
              );

              // Clean up channel after a short delay
              setTimeout(() => {
                supabase.removeChannel(channel);
              }, 1000);
            }
          });
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latestScan, vendor?.id]);

  // Update this effect to only trigger on card scans
  useEffect(() => {
    if (cardUid && !isManualInput) {
      handleCardLookup();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardUid, cardScanTrigger]);

  // Fetch vendor by name from context
  useEffect(() => {
    async function fetchVendor() {
      if (!vendorName) {
        setVendor(null);
        return;
      }
      setTxnLoading(true);
      const { data, error } = await supabase
        .from("vendors")
        .select("id, default_price")
        .eq("name", vendorName)
        .single();
      setTxnLoading(false);
      if (error || !data) {
        setVendor(null);
      } else {
        setVendor({ id: data.id, default_price: data.default_price ?? null });
        // Update default price in context
        setDefaultPrice(data.default_price);
        // Set amount to default price if available
        if (data.default_price !== undefined && data.default_price !== null) {
          setAmount(String(data.default_price));
        } else {
          setAmount("");
        }
      }
    }
    fetchVendor();
  }, [vendorName, setDefaultPrice]);

  // Update amount when defaultPrice changes
  useEffect(() => {
    if (defaultPrice !== null && defaultPrice !== undefined) {
      setAmount(String(defaultPrice));
    }
  }, [defaultPrice]);

  // Fetch transactions for vendor
  const fetchTransactions = useCallback(async () => {
    if (!vendor?.id) return;
    setTransactionsLoading(true);
    const { data } = await supabase
      .from("transactions")
      .select("id, timestamp, card_uid, amount, description")
      .eq("vendor_id", vendor.id)
      .order("timestamp", { ascending: false })
      .limit(25);
    if (data) {
      setTransactions(data);
    }
    setTransactionsLoading(false);
  }, [vendor]);

  useEffect(() => {
    if (vendor?.id) {
      fetchTransactions();
    }
  }, [vendor?.id, fetchTransactions]);

  // Fetch card balance
  const handleCardLookup = async () => {
    setCardError(null);
    setBalance(null);

    const currentCardUid = cardUid;
    if (!currentCardUid) {
      return;
    }

    const minSpinnerTime = 500;
    const start = Date.now();
    setCardLoading(true);

    try {
      const { data, error } = await supabase
        .from("card_activations")
        .select("balance, activated")
        .eq("card_uid", currentCardUid)
        .single();

      if (error || !data) {
        setCardError("Card not found.");
        setBalance(null);
        return;
      }

      if (!data.activated) {
        setCardError("Card not activated.");
        setBalance(null);
        return;
      }

      setBalance(Number(data.balance));
    } catch (error) {
      setCardError("Error looking up card.");
      console.error("Error looking up card:", error);
      setBalance(null);
    } finally {
      const elapsed = Date.now() - start;
      if (elapsed < minSpinnerTime) {
        setTimeout(() => setCardLoading(false), minSpinnerTime - elapsed);
      } else {
        setCardLoading(false);
      }
    }
  };

  // Process transaction
  const handleProcessTransaction = async () => {
    setTxnError(null);
    setTxnSuccess(null);
    if (!cardUid || !amount || Number(amount) <= 0) {
      setTxnError("Enter a valid card and amount.");
      return;
    }
    if (balance === null) {
      setTxnError("Lookup card balance first.");
      return;
    }
    if (Number(amount) > balance) {
      setTxnError("Insufficient balance.");
      return;
    }
    if (!vendor?.id) {
      setTxnError("Vendor not found. Please set up your vendor profile.");
      return;
    }
    setTxnLoading(true);

    const result = await processTransaction({
      cardUid,
      amount: Number(amount),
      description,
      vendorId: vendor.id,
    });

    setTxnLoading(false);
    if (!result.success) {
      setTxnError(result.error || "Failed to process transaction.");
      return;
    }

    setTxnSuccess(`Transaction successful! $${amount} charged.`);
    if (result.newBalance !== undefined) {
      setBalance(result.newBalance);
    }

    // Send transaction success message to POS display
    console.log(
      `[POS] Sending transaction success to display. Vendor ID: ${vendor.id}`
    );
    const channel = supabase.channel(`vendor-${vendor.id}-display-control`);
    channel.subscribe(async (status) => {
      console.log(`[POS] Channel subscription status: ${status}`);
      if (status === "SUBSCRIBED") {
        const broadcastResult = await channel.send({
          type: "broadcast",
          event: "transaction-success",
          payload: {
            cardBalance: result.newBalance || 0,
            transactionAmount: Number(amount),
            transactionDescription: description || `${vendorName}`,
          },
        });
        console.log("[POS] Broadcast result:", broadcastResult);

        // Clean up channel after a short delay
        setTimeout(() => {
          supabase.removeChannel(channel);
        }, 1000);
      }
    });

    // Only clear amount/description if not using default price
    if (defaultPrice === null || defaultPrice === undefined) {
      setAmount("");
    }
    setDescription("");
    // Clear card UID for next transaction
    setCardUid("");
    // Refresh transactions after successful transaction
    fetchTransactions();
  };

  const handleCardUidChange = (value: string) => {
    const lower = value.toLowerCase();
    setCardUid(lower);
    setIsManualInput(true);
    const validation = validateCardUid(lower);
    setCardUidError(validation.isValid ? null : validation.error || null);
  };

  // Subscribe to transaction confirmations from POSDisplay
  useEffect(() => {
    if (!vendor?.id) return;

    const channel = supabase
      .channel(`vendor-${vendor.id}-transactions`)
      .on("broadcast", { event: "confirm-transaction" }, async (payload) => {
        console.log("Received transaction confirmation:", payload);

        // Set the transaction data from the confirmation
        setCardUid(payload.payload.cardUid);
        setAmount(String(payload.payload.amount));
        setDescription(payload.payload.description || "");
        setBalance(payload.payload.cardBalance);

        // Process the transaction automatically
        setTimeout(() => {
          handleProcessTransaction();
        }, 100); // Small delay to ensure state is updated
      })
      .on("broadcast", { event: "cancel-transaction" }, () => {
        console.log("Received transaction cancellation");

        // Reset the POS form
        setCardUid("");
        setBalance(null);
        setDescription("");
        setCardError(null);
        setTxnError(null);
        setTxnSuccess(null);
        setCardLoading(false);
        setTxnLoading(false);

        // Use default price from context
        if (defaultPrice !== null && defaultPrice !== undefined) {
          setAmount(String(defaultPrice));
        } else {
          setAmount("");
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [vendor?.id, handleProcessTransaction]);

  return (
    <div className="max-w-none mx-auto px-6 py-6 min-h-screen">
      {showScanner && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-4 w-full max-w-2xl shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Scan Card</h2>
              <button
                onClick={() => setShowScanner(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors duration-200"
              >
                Close
              </button>
            </div>
            <CardScanner
              onCardDetected={(cardNumber) => {
                setCardUid(cardNumber);
                setShowScanner(false);
              }}
            />
          </div>
        </div>
      )}
      <div className="grid gap-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-4xl font-bold text-rose-600">Point of Sale</h1>
          <div className="flex gap-4">
            <Button
              onClick={async () => {
                setCardUid("");
                setBalance(null);
                setDescription("");
                setCardError(null);
                setTxnError(null);
                setTxnSuccess(null);
                setCardLoading(false);
                setTxnLoading(false);

                // Use default price from context
                if (defaultPrice !== null && defaultPrice !== undefined) {
                  setAmount(String(defaultPrice));
                } else {
                  setAmount("");
                }
              }}
              className="text-md button-primary"
            >
              New Transaction
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Card Scanner/Input Section */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Card Input</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 mt-6">
                <div className="relative">
                  <button
                    type="button"
                    className="absolute left-2 top-1/2 -translate-y-1/2 z-10 p-1 icon-button"
                    onClick={() => setShowScanner(true)}
                    tabIndex={0}
                    aria-label="Scan Card"
                  >
                    <Camera className="h-5 w-5" />
                  </button>
                  <Input
                    placeholder="e.g. 0497940abf1e90"
                    value={cardUid}
                    onChange={(e) => handleCardUidChange(e.target.value)}
                    onBlur={() => {
                      if (isManualInput && !cardUidError) {
                        handleCardLookup();
                      }
                    }}
                    disabled={cardLoading}
                    className="text-center pr-10 pl-10 input-styled"
                    maxLength={14}
                  />
                </div>
                {cardUidError && (
                  <div className="text-sm text-red-500 mt-1">
                    {cardUidError}
                  </div>
                )}
                <div className="flex items-center justify-center gap-2 mt-2">
                  <button
                    type="button"
                    onClick={handleCardLookup}
                    disabled={cardLoading || !cardUid}
                    className="mr-2 p-1 rounded hover:bg-gray-100 disabled:opacity-50 transition-colors duration-200"
                    aria-label="Refresh Balance"
                  >
                    <RotateCw className="text-black" size={18} />
                  </button>
                  <span className="text-md font-semibold text-rose-600">
                    Card Balance:
                  </span>
                  {cardLoading ? (
                    <span className="inline-block align-middle">
                      <span className="w-4 h-4 border-2 border-rose-500 border-t-transparent rounded-full animate-spin inline-block" />
                    </span>
                  ) : cardError ? (
                    <span className="text-sm font-semibold text-rose-600">
                      {cardError}
                    </span>
                  ) : (
                    <span className="text-sm font-semibold text-rose-600">
                      {balance !== null ? `$${balance.toFixed(2)}` : "$0.00"}
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Transaction Section */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Transaction</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="amount"
                      className="block text-md font-semibold text-rose-600"
                    >
                      Amount
                    </label>
                    <Input
                      id="amount"
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      disabled={txnLoading}
                      className="text-rose-600 input-styled mt-1"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="description"
                      className="block text-md font-semibold text-rose-600"
                    >
                      Description
                    </label>
                    <Input
                      id="description"
                      type="text"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Transaction description"
                      disabled={txnLoading}
                      className="input-styled mt-1"
                    />
                  </div>
                </div>
                {/* Button Row: Send Price to Display, Manual Scan, Process Transaction */}
                <div className="flex flex-col sm:flex-row gap-4 mt-4">
                  <Button
                    onClick={async () => {
                      if (!vendor?.id || !amount || amount === "") return;
                      const numericAmount = parseFloat(amount);
                      if (isNaN(numericAmount) || numericAmount <= 0) return;

                      console.log(
                        `[POS] Sending price to display: $${numericAmount}`
                      );

                      // Update the current_transaction_amount in the database
                      await supabase
                        .from("vendors")
                        .update({
                          current_transaction_amount: numericAmount,
                        })
                        .eq("id", vendor.id);

                      // Send price update to display via broadcast
                      const channel = supabase.channel(
                        `vendor-${vendor.id}-display-control`
                      );
                      channel.subscribe(async (status) => {
                        console.log(
                          `[POS] Price update channel subscription status: ${status}`
                        );
                        if (status === "SUBSCRIBED") {
                          const broadcastResult = await channel.send({
                            type: "broadcast",
                            event: "price-update",
                            payload: {
                              amount: numericAmount,
                              vendorId: vendor.id,
                            },
                          });
                          console.log(
                            "[POS] Price update broadcast result:",
                            broadcastResult
                          );

                          // Clean up channel after a short delay
                          setTimeout(() => {
                            supabase.removeChannel(channel);
                          }, 1000);
                        }
                      });
                    }}
                    disabled={!amount || !vendor?.id || txnLoading}
                    className="flex-1 w-full h-12 button-secondary"
                  >
                    Update Display Price
                  </Button>
                  <Button
                    className="flex-1 w-full h-12 button-outline"
                    onClick={async () => {
                      if (!vendor?.id || !cardUid) return;

                      console.log("[POS] Manual Scan button clicked");

                      // Insert a card scan record to trigger the display
                      const { error } = await supabase
                        .from("card_scans")
                        .insert({
                          card_uid: cardUid,
                          vendor_id: vendor.id,
                          reader_name: "manual",
                          processed: false,
                        });

                      if (error) {
                        console.error(
                          "[POS] Error inserting manual card scan:",
                          error
                        );
                      }
                    }}
                    disabled={
                      !cardUid || !amount || !!cardUidError || !!cardError
                    }
                  >
                    Manual Scan
                  </Button>
                  <Button
                    className="flex-1 w-full h-12 button-primary"
                    onClick={handleProcessTransaction}
                    disabled={
                      txnLoading ||
                      !cardUid ||
                      !amount ||
                      !vendor?.id ||
                      !!cardUidError ||
                      !!cardError
                    }
                  >
                    {txnLoading ? "Processing..." : "Process Transaction"}
                  </Button>
                </div>
                {txnError && (
                  <div className="text-center text-rose-600 text-sm font-medium">
                    {txnError}
                  </div>
                )}
                {txnSuccess && (
                  <div className="text-center text-green-600 text-sm font-medium">
                    {txnSuccess}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      {/* Transactions Table */}
      <div className="mt-8 table-container rounded-2xl">
        <h2 className="text-xl font-bold text-rose-600 mb-2">
          Recent Transactions
        </h2>
        <TransactionsTable
          transactions={transactions}
          loading={transactionsLoading}
        />
      </div>
    </div>
  );
}
