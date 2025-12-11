import localFont from "next/font/local";

export const riformaLL = localFont({
  src: [
    {
      path: "../../public/fonts/Riforma Fonts/Riforma LL/Riforma LL - Latin - Web Fonts/Fonts/RiformaLLWeb-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/Riforma Fonts/Riforma LL/Riforma LL - Latin - Web Fonts/Fonts/RiformaLLWeb-Bold.woff2",
      weight: "700",
      style: "normal",
    },
    {
      path: "../../public/fonts/Riforma Fonts/Riforma LL/Riforma LL - Latin - Web Fonts/Fonts/RiformaLLWeb-Heavy.woff2",
      weight: "900",
      style: "normal",
    },
  ],
  variable: "--font-riforma",
});
