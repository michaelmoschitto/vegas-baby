"use client";

import { useEffect, useState, useRef } from "react";
import Tesseract, { RecognizeResult, PSM } from "tesseract.js";

import { validateCardUid } from "@/lib/mezo-id";

interface Word {
  text: string;
  bbox: {
    x0: number;
    y0: number;
    x1: number;
    y1: number;
  };
}

interface Page {
  text: string;
  words: Word[];
}

interface CardScannerProps {
  onCardDetected: (cardNumber: string) => void;
  scanInterval?: number; // ms
  stabilityCount?: number;
  maxDuration?: number; // seconds
  onTimeout?: () => void;
}

export function CardScanner({
  onCardDetected,
  scanInterval = 250,
  stabilityCount = 2,
  maxDuration = 12,
  onTimeout,
}: CardScannerProps) {
  const [error, setError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [ocrResult, setOcrResult] = useState<string | null>(null);
  const [hexOnly, setHexOnly] = useState<string | null>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const scanTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stableNumber, setStableNumber] = useState<string | null>(null);
  const [revealedDigits, setRevealedDigits] = useState<number>(0);
  const [shimmerDone, setShimmerDone] = useState<boolean>(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [recentDetections, setRecentDetections] = useState<string[]>([]);
  const BUFFER_SIZE = 5;

  // Guide box dimensions (relative to video/canvas size)
  const GUIDE_BOX = {
    widthPct: 0.6, // 60% of width
    heightPct: 0.2, // 20% of height
  };

  // Start camera on mount
  useEffect(() => {
    let stream: MediaStream | null = null;
    setError(null);
    setIsScanning(true);

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "environment",
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;

          // Try to enable torch/flash
          const videoTracks = stream.getVideoTracks();
          if (videoTracks.length > 0) {
            const track = videoTracks[0];

            // Check if torch capability is available
            const capabilities = track.getCapabilities();
            if (capabilities && "torch" in capabilities) {
              try {
                await track.applyConstraints({
                  advanced: [{ torch: true } as any],
                });
                console.log("Torch enabled successfully");
              } catch (error) {
                console.warn("Failed to enable torch:", error);
              }
            } else {
              console.log("Torch capability not available on this device");
            }
          }
        }
      } catch {
        setError("Camera access denied or unavailable.");
        setIsScanning(false);
      }
    };
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      setIsScanning(false);
    };
  }, []);

  // Automatic scanning effect
  useEffect(() => {
    if (!isScanning) return;
    setError(null);
    setOcrResult(null);
    let elapsed = 0;
    const interval = scanInterval;
    const duration = maxDuration;

    const doScan = async () => {
      await handleCapture(true); // pass true to indicate auto-scan
    };
    doScan(); // initial scan immediately
    scanIntervalRef.current = setInterval(() => {
      elapsed++;
      if (elapsed >= duration * (1000 / interval)) {
        clearInterval(scanIntervalRef.current!);
        setError("Scanning timed out. Please try again.");
        if (onTimeout) onTimeout();
        // Wait 2 seconds before closing scanner
        setTimeout(() => {
          onCardDetected(""); // Pass empty string to indicate failure
        }, 2000);
        return;
      }
      doScan();
    }, interval);
    scanTimeoutRef.current = setTimeout(() => {
      clearInterval(scanIntervalRef.current!);
      setError("Scanning timed out. Please try again.");
      if (onTimeout) onTimeout();
      // Wait 2 seconds before closing scanner
      setTimeout(() => {
        onCardDetected(""); // Pass empty string to indicate failure
      }, 2000);
    }, duration * 1000);
    return () => {
      clearInterval(scanIntervalRef.current!);
      clearTimeout(scanTimeoutRef.current!);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isScanning, scanInterval, maxDuration]);

  // Modified handleCapture to optionally stop auto-scan on success
  const handleCapture = async (autoScan = false) => {
    setError(null);
    setOcrResult(null);
    if (!videoRef.current || !canvasRef.current) {
      console.warn("[DEBUG] videoRef or canvasRef not ready");
      return;
    }
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      console.warn("[DEBUG] Canvas context not available");
      return;
    }

    // Guard: skip if video or canvas is not ready
    if (
      video.videoWidth === 0 ||
      video.videoHeight === 0 ||
      canvas.width === 0 ||
      canvas.height === 0
    ) {
      console.warn(
        "[DEBUG] Skipping scan: video or canvas not ready (width/height is 0)"
      );
      return;
    }

    // Log video and canvas size for debugging
    console.warn("[DEBUG] Video size:", video.videoWidth, video.videoHeight);
    console.warn("[DEBUG] Canvas size:", canvas.width, canvas.height);

    // Draw the video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Calculate guide box region
    const boxWidth = Math.floor(canvas.width * GUIDE_BOX.widthPct);
    const boxHeight = Math.floor(canvas.height * GUIDE_BOX.heightPct);
    const boxX = Math.floor((canvas.width - boxWidth) / 2);
    const boxY = Math.floor((canvas.height - boxHeight) / 2);

    // Crop the guide box region from the canvas
    const boxImageData = ctx.getImageData(boxX, boxY, boxWidth, boxHeight);
    // Create a temp canvas for the cropped region
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = boxWidth;
    tempCanvas.height = boxHeight;
    const tempCtx = tempCanvas.getContext("2d");
    if (!tempCtx) {
      console.warn("[DEBUG] Temp canvas context not available");
      return;
    }
    tempCtx.putImageData(boxImageData, 0, 0);
    const processedImageData = tempCanvas.toDataURL("image/png");
    console.warn(
      "[DEBUG] Base64 image for OCR:",
      processedImageData.slice(0, 100) + "..."
    );

    try {
      console.warn("[DEBUG] Creating Tesseract worker...");
      const worker = await Tesseract.createWorker("eng");
      console.warn("[DEBUG] Tesseract worker created");

      // Configure Tesseract for better number recognition
      await worker.setParameters({
        tessedit_char_whitelist: "0123456789abcdefABCDEF", // Allow both upper and lowercase hex
        tessedit_pageseg_mode: PSM.SINGLE_BLOCK, // More flexible layout
        tessjs_create_pdf: "0",
        tessjs_create_hocr: "0",
        tessjs_create_tsv: "0",
        tessjs_create_box: "0",
        tessjs_create_unlv: "0",
        tessjs_create_osd: "0",
      });

      console.warn("[DEBUG] Starting OCR recognition...");
      const result = (await worker.recognize(
        processedImageData
      )) as RecognizeResult;
      const { text, words } = result.data as unknown as Page;
      await worker.terminate();

      // Log the raw OCR result for debugging
      console.warn("[DEBUG] Raw OCR text:", text);
      console.warn("[DEBUG] Detected words:", words);

      setOcrResult(text);

      // Extract all hex characters (both upper and lowercase) and convert to lowercase
      const processedHex = text.replace(/[^0-9a-fA-F]/g, "").toLowerCase();
      setHexOnly(processedHex);
      if (!text.trim()) {
        console.warn("[DEBUG] No text detected by OCR");
      }

      // Look for sequences of 14 hex characters
      const match = processedHex.match(/[0-9a-f]{14}/);
      if (match) {
        const cardUid = match[0];
        // Validate the card UID
        const validation = validateCardUid(cardUid);
        if (validation.isValid) {
          // Add to recent detections buffer
          setRecentDetections((prev) => {
            const updated = [...prev, cardUid].slice(-BUFFER_SIZE);
            // Check if the same number appears at least stabilityCount times
            const occurrences = updated.filter((num) => num === cardUid).length;
            if (occurrences >= stabilityCount && !stableNumber) {
              setStableNumber(cardUid);
              setRevealedDigits(0);
              setShimmerDone(false);
              if (scanIntervalRef.current)
                clearInterval(scanIntervalRef.current);
              if (scanTimeoutRef.current) clearTimeout(scanTimeoutRef.current);
              // Start progressive shimmer
              let i = 0;
              const revealInterval = setInterval(() => {
                i++;
                setRevealedDigits(i);
                if (i >= 14) {
                  clearInterval(revealInterval);
                  setShimmerDone(true);
                  // Wait 6s after full reveal, then proceed
                  setTimeout(() => {
                    onCardDetected(cardUid);
                  }, 6000);
                }
              }, 20);
            }
            return updated;
          });
        } else {
          console.warn("[DEBUG] Invalid card UID format:", validation.error);
        }
      } else if (!autoScan) {
        setError("No valid card UID detected. Please try again.");
        console.warn("[DEBUG] No valid card UID detected in OCR result");
      }
    } catch (error) {
      console.error("[DEBUG] OCR Error:", error);
      setError("Failed to process image. Please try again.");
    }
  };

  return (
    <div className="w-full aspect-video rounded-lg overflow-hidden mx-auto relative">
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="relative w-full h-full flex items-center justify-center">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover rounded"
          >
            <track kind="captions" src="" label="Card Scanner Video" />
          </video>
          <canvas ref={canvasRef} style={{ display: "none" }} />
          {/* Guide box overlay */}
          <div
            className="absolute border-2 border-black rounded-lg z-20 pointer-events-none"
            style={{
              width: `${GUIDE_BOX.widthPct * 100}%`,
              height: `${GUIDE_BOX.heightPct * 100}%`,
              left: `${(1 - GUIDE_BOX.widthPct) * 50}%`,
              top: `${(1 - GUIDE_BOX.heightPct) * 50}%`,
            }}
          />
          {/* Shimmering numbers overlay, only if 16 digits detected */}
          {stableNumber && (
            <div
              className="absolute flex items-center justify-center z-10"
              style={{
                width: `${GUIDE_BOX.widthPct * 100}%`,
                left: `${(1 - GUIDE_BOX.widthPct) * 50}%`,
                top: `calc(${
                  (1 - GUIDE_BOX.heightPct) * 50 + GUIDE_BOX.heightPct * 100
                }% + 12px)`, // below the box with margin
                pointerEvents: "none",
              }}
            >
              <span className="text-2xl sm:text-4xl font-mono font-bold flex">
                {stableNumber
                  .toUpperCase()
                  .replace(/\s/g, "")
                  .split("")
                  .map((digit, idx) => {
                    if (idx < revealedDigits) {
                      // Solid revealed digit
                      return (
                        <span
                          key={idx}
                          className="text-black opacity-100 transition-opacity duration-100"
                        >
                          {digit}
                        </span>
                      );
                    } else if (idx === revealedDigits && !shimmerDone) {
                      // Shimmering digit
                      return (
                        <span
                          key={idx}
                          className="shimmer-text-black fade-in-digit"
                        >
                          {digit}
                        </span>
                      );
                    } else {
                      // Hidden digit
                      return (
                        <span key={idx} style={{ opacity: 0 }}>
                          {digit}
                        </span>
                      );
                    }
                  })}
              </span>
            </div>
          )}
        </div>
        {/* Debug output for OCR */}
        <div className="w-full flex flex-col items-center mt-2 min-h-[48px]">
          {error && (
            <p className="text-sm text-red-500 text-center px-4">{error}</p>
          )}
        </div>
      </div>
      {/* Add black shimmer effect and fade-in for the numbers */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .shimmer-text-black {
          background: linear-gradient(
            90deg,
            #222 0%,
            #000 40%,
            #000 60%,
            #222 100%
          );
          background-size: 200% 100%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimmer-black 0.5s infinite linear;
          opacity: 1;
        }
        .fade-in-digit {
          animation: fade-in-digit 0.1s cubic-bezier(0.4, 0, 0.2, 1) forwards;
          opacity: 0;
        }
        @keyframes shimmer-black {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }
        @keyframes fade-in-digit {
          0% {
            opacity: 0;
          }
          100% {
            opacity: 1;
          }
        }
      `,
        }}
      />
    </div>
  );
}
