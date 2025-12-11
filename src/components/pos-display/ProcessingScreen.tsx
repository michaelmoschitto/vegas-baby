"use client";

import { motion } from "framer-motion";

export default function ProcessingScreen() {
  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 0.6, ease: "easeInOut" }}
      className="h-full w-full flex flex-col items-center justify-center p-12 text-center relative z-10"
    >
      {/* Simplified Loading Animation */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="mb-16"
      >
        <motion.div className="relative mb-12">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{
              duration: 2,
              repeat: Number.POSITIVE_INFINITY,
              ease: "linear",
            }}
            className="w-48 h-48 mx-auto"
          >
            <svg
              width="192"
              height="192"
              viewBox="0 0 192 192"
              className="w-full h-full"
            >
              <circle
                cx="96"
                cy="96"
                r="84"
                stroke="#F3F4F6"
                strokeWidth="12"
                fill="none"
              />
              <circle
                cx="96"
                cy="96"
                r="84"
                stroke="url(#gradient)"
                strokeWidth="12"
                fill="none"
                strokeLinecap="round"
                strokeDasharray="120 420"
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#E53E3E" />
                  <stop offset="100%" stopColor="#EC4899" />
                </linearGradient>
              </defs>
            </svg>
          </motion.div>
        </motion.div>

        <h2 className="text-7xl font-bold text-gray-900 mb-8 tracking-tight">
          Processing Transaction
        </h2>

        {/* <motion.p
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{
            duration: 2,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
          className="text-2xl text-gray-600 font-normal"
        >
          Securing your transaction
        </motion.p> */}
      </motion.div>
    </motion.div>
  );
}
