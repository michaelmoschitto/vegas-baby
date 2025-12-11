"use client";

import { motion } from "framer-motion";
import { CreditCard } from "lucide-react";

export default function WelcomeScreen() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 0.6, ease: "easeInOut" }}
      className="min-h-screen w-full relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #fce4ec 0%, #ffccbc 100%)",
      }}
    >
      {/* Hero Text - positioned higher */}
      <motion.h1
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.8 }}
        className="text-gray-900 font-bold text-center absolute w-full"
        style={{
          fontSize: "clamp(4rem, 10vw, 8rem)",
          lineHeight: "1",
          letterSpacing: "-0.02em",
          top: "20%",
        }}
      >
        Bank on yourself.
      </motion.h1>

      {/* Card Tap Area - centered and smaller */}
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.8 }}
        className="absolute w-full flex justify-center"
        style={{
          top: "50%",
          transform: "translateY(-50%)",
        }}
      >
        <motion.div
          animate={{
            scale: [1, 1.02, 1],
            boxShadow: [
              "0 0 0 0 rgba(229, 62, 62, 0.3)",
              "0 0 0 30px rgba(229, 62, 62, 0)",
              "0 0 0 0 rgba(229, 62, 62, 0)",
            ],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="bg-white rounded-3xl shadow-xl flex flex-col items-center justify-center"
          style={{
            width: "400px",
            height: "300px",
            border: "3px solid rgba(255, 255, 255, 0.9)",
          }}
        >
          {/* Icon Container */}
          <div
            className="rounded-xl flex items-center justify-center mb-6"
            style={{
              background: "linear-gradient(135deg, #ec4899 0%, #ef4444 100%)",
              width: "80px",
              height: "80px",
            }}
          >
            <CreditCard
              className="text-white"
              style={{ width: "40px", height: "40px" }}
            />
          </div>

          {/* Text */}
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Tap Your Card
          </h2>
          <p className="text-lg text-gray-600">Ready to pay</p>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
