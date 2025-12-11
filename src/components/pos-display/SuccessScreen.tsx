"use client";

import { motion } from "framer-motion";
import { useEffect } from "react";

interface TransactionData {
  cardBalance: number;
  transactionAmount: number;
  transactionDescription: string;
}

interface SuccessScreenProps {
  data: TransactionData;
}

export default function SuccessScreen({ data }: SuccessScreenProps) {
  // Auto-return to welcome screen after 15 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      window.location.href = "/pos/display";
    }, 15000); // 15 seconds

    // Cleanup timer if component unmounts
    return () => clearTimeout(timer);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.6, ease: "easeInOut" }}
      className="h-screen w-full flex flex-col"
    >
      {/* Main content container */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        {/* Success Message */}
        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="text-gray-900 font-bold italic mb-4"
          style={{
            fontSize: "clamp(3rem, 8vw, 6rem)",
            lineHeight: "1",
            letterSpacing: "-0.02em",
          }}
        >
          Success!
        </motion.h1>

        {/* Transaction message */}
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="text-2xl text-gray-600 font-normal mb-8"
        >
          Your transaction has been completed
        </motion.p>

        {/* Balance display container */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100"
        >
          <p className="text-lg text-gray-600 mb-2 text-center">
            Remaining Balance
          </p>
          <p className="text-4xl font-bold text-green-600 text-center">
            ${data.cardBalance.toFixed(2)}
          </p>
        </motion.div>
      </div>

      {/* Done Button - Bottom section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.6 }}
        className="p-8 flex justify-center"
      >
        <button
          onClick={() => {
            window.location.href = "/pos/display";
          }}
          className="bg-white p-4 rounded-2xl shadow-lg px-16 py-4 border border-gray-100 text-black font-semibold text-xl hover:shadow-xl transition-all"
        >
          Done
        </button>
      </motion.div>
    </motion.div>
  );
}
