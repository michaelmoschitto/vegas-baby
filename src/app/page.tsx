// Next.js imports
import Image from "next/image";

// Local imports
import { riformaLL } from "./fonts";

export default function Home() {
  return (
    <div
      className={`min-h-screen flex flex-col bg-gradient-to-br from-rose-50 to-white items-center justify-center ${riformaLL.variable}`}
    >
      {/* Fixed Mezo logo in top left */}
      <div className="fixed top-4 left-4 z-10">
        <Image
          src="/mezologo.png"
          alt="Mezo Logo"
          width={120}
          height={40}
          priority
        />
      </div>
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 py-12 md:py-24 w-full">
        <div className="relative w-full max-w-2xl mx-auto">
          {/* Optional background accent */}
          <div className="absolute right-0 top-[-60px] hidden md:block">
            <div className="w-48 h-48 bg-rose-100 rounded-full opacity-60 blur-2xl" />
          </div>
          <h1 className="text-6xl md:text-8xl font-[var(--font-riforma)] font-extrabold leading-tight mb-4 bg-gradient-to-r from-rose-600 to-rose-300 bg-clip-text text-transparent">
            <span>Spend MUSD.</span>
            <br />
            <span>Save BTC.</span>
          </h1>
          <p className="text-lg md:text-2xl text-gray-800 mb-8 font-medium tracking-wide">
            Redeem Mezo&apos;s Bitcoin-backed stablecoin, MUSD, for swag,
            coffee, and more at BTC Vegas
          </p>
          <a
            href="/activate"
            className="inline-block bg-rose-600 text-white px-8 py-4 rounded-xl text-lg font-semibold shadow hover:bg-black transition"
          >
            Activate Card
          </a>
        </div>
      </main>
    </div>
  );
}
