"use client";

import { Camera, Check, X } from "lucide-react";
import type React from "react";
import { useState, useEffect, useCallback } from "react";

import {
  activateCard,
  checkMezoIdAvailability,
} from "@/app/(mobile)/activate/actions";
import { riformaLL } from "@/app/fonts";
import { CardScanner } from "@/components/card-scanner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { validateMezoId, validateCardUid } from "@/lib/mezo-id";
import { cn } from "@/lib/utils";

interface CardActivationFormProps {
  showScanner?: boolean;
}

export function CardActivationForm({
  showScanner = true,
}: CardActivationFormProps) {
  const [step, setStep] = useState<
    "details" | "confirmation" | "success" | "error"
  >("details");
  const [formData, setFormData] = useState({
    cardNumber: "",
    fullName: "",
    email: "",
    mezoId: "",
  });
  const [isScanning, setIsScanning] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [mezoIdError, setMezoIdError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [fullNameError, setFullNameError] = useState<string | null>(null);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  const [isCheckingMezoId, setIsCheckingMezoId] = useState(false);
  const [cardNumberError, setCardNumberError] = useState<string | null>(null);
  const [cardNumberVerification, setCardNumberVerification] = useState<
    string | null
  >(null);
  const [scannerTimeout, setScannerTimeout] = useState(false);

  // Add validation state tracking
  const validateForm = useCallback(() => {
    const isCardNumberValid =
      !cardNumberError && formData.cardNumber.length > 0;
    const isFullNameValid =
      !fullNameError && formData.fullName.trim().length > 0;
    const isEmailValid = !emailError && formData.email.length > 0;
    const isMezoIdValid = !mezoIdError && formData.mezoId.length > 0;

    setIsFormValid(
      isCardNumberValid && isFullNameValid && isEmailValid && isMezoIdValid
    );
  }, [formData, emailError, mezoIdError, cardNumberError, fullNameError]);

  // Update validation on any form change
  useEffect(() => {
    validateForm();
  }, [
    formData,
    emailError,
    mezoIdError,
    cardNumberError,
    fullNameError,
    validateForm,
  ]);

  // Debounced email check
  const checkEmailUniqueness = useCallback(async (email: string) => {
    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      setEmailError("Please enter a valid email address");
      return;
    }

    setIsCheckingEmail(true);
    try {
      const response = await fetch("/api/check-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();

      if (!data.available) {
        setEmailError("This email is already registered");
      } else {
        setEmailError(null);
      }
    } catch (error) {
      console.error("Error checking email:", error);
    } finally {
      setIsCheckingEmail(false);
    }
  }, []);

  // Debounce effect for email check
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.email) {
        checkEmailUniqueness(formData.email);
      }
    }, 500); // Wait 500ms after user stops typing

    return () => clearTimeout(timer);
  }, [formData.email, checkEmailUniqueness]);

  // Remove the debounced Mezo ID check effect
  const checkMezoIdUniqueness = useCallback(async (mezoId: string) => {
    setIsCheckingMezoId(true);
    try {
      // Always append .mezo for the backend check
      const fullMezoId = mezoId.includes(".mezo") ? mezoId : `${mezoId}.mezo`;
      const result = await checkMezoIdAvailability(fullMezoId);
      if (!result.available) {
        setMezoIdError(result.error || "Mezo ID is not available");
      } else {
        setMezoIdError(null);
      }
    } catch (error) {
      console.error("Error checking Mezo ID:", error);
      setMezoIdError("Failed to check Mezo ID availability");
    } finally {
      setIsCheckingMezoId(false);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (name === "cardNumber") {
      // Only allow alphanumeric characters
      if (!/^[a-zA-Z0-9\s]*$/.test(value)) {
        return;
      }
      // Convert to lowercase
      const formatted = value.toLowerCase();
      setFormData((prev) => ({ ...prev, [name]: formatted }));
      // Validate card number
      const validation = validateCardUid(formatted);
      setCardNumberError(validation.isValid ? null : validation.error || null);
      setCardNumberVerification(null); // Clear verification message when user types
    } else if (name === "fullName") {
      // Validate full name format
      const fullNameRegex = /^[A-Za-z\s-]{2,100}$/;
      if (!fullNameRegex.test(value)) {
        setFullNameError(
          "Name can only contain letters, spaces, and hyphens (2-100 characters)"
        );
      } else {
        setFullNameError(null);
      }
      setFormData((prev) => ({ ...prev, [name]: value }));
    } else if (name === "mezoId") {
      // Strip .mezo if user enters it
      let cleanValue = value;
      if (value.includes(".mezo")) {
        cleanValue = value.replace(/\.mezo/g, "");
      }

      // Only allow alphanumeric characters, hyphens, underscores, and dots (but not .mezo)
      if (!/^[a-zA-Z0-9._-]*$/.test(cleanValue)) {
        return;
      }

      setFormData((prev) => ({ ...prev, [name]: cleanValue }));

      // Validate the ID part only (without .mezo)
      if (cleanValue.length < 3) {
        setMezoIdError("Mezo ID must be at least 3 characters");
      } else if (cleanValue.length > 30) {
        setMezoIdError("Mezo ID must be less than 30 characters");
      } else if (!/^[a-zA-Z][a-zA-Z0-9._-]*$/.test(cleanValue)) {
        setMezoIdError(
          "Mezo ID must start with a letter and contain only letters, numbers, dots, hyphens, or underscores"
        );
      } else {
        setMezoIdError(null);
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

    // Clear errors when user starts typing
    if (name === "email") {
      setEmailError(null);
    }
  };

  const handleMezoIdBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const mezoId = e.target.value;
    if (mezoId && mezoId.length >= 3 && !mezoIdError) {
      checkMezoIdUniqueness(mezoId);
    }
  };

  const handleCardNumberDetected = (cardNumber: string) => {
    if (!cardNumber) {
      // Handle timeout case
      setIsScanning(false);
      return;
    }
    // Strip all whitespace and convert to lowercase
    const formatted = cardNumber.replace(/\s/g, "").toLowerCase();
    setFormData((prev) => ({ ...prev, cardNumber: formatted }));
    setIsScanning(false);
    setCardNumberVerification("Please ensure scanning correctness");
    setCardNumberError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if there are any validation errors
    if (mezoIdError || emailError || fullNameError || cardNumberError) {
      return;
    }

    // Ensure Mezo ID meets minimum requirements
    if (formData.mezoId.length < 3) {
      setMezoIdError("Mezo ID must be at least 3 characters");
      return;
    }

    // Email format is already validated in real-time, but we'll do a final check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setEmailError("Please enter a valid email address");
      return;
    }

    setStep("confirmation");
  };

  const confirmActivation = async () => {
    // Call the server action to activate the card
    setErrorMsg(null);
    setEmailError(null);
    const result = await activateCard({
      cardUid: formData.cardNumber,
      mezoId: `${formData.mezoId}.mezo`, // Append .mezo here
      email: formData.email,
      fullName: formData.fullName,
    });
    if (result.success) {
      setStep("success");
    } else {
      if (result.error?.includes("Email is already registered")) {
        setEmailError(result.error);
        setStep("details");
      } else {
        setErrorMsg(result.error || "Activation failed");
        setStep("error");
      }
    }
  };

  const formatCardNumber = (value: string) => {
    // Return the uppercase value for display
    return value.toUpperCase();
  };

  // Reset scannerTimeout when opening scanner
  useEffect(() => {
    if (isScanning) setScannerTimeout(false);
  }, [isScanning]);

  if (step === "success") {
    return (
      <Card className="w-full shadow-sm">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-6 sm:py-8">
            <div className="rounded-full bg-green-100 p-3 mb-4">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h2
              className={cn(
                "text-xl sm:text-2xl font-bold text-center",
                riformaLL.className
              )}
            >
              Card Activated!
            </h2>
            <p className="text-sm sm:text-base text-gray-600 text-center mt-2 px-2">
              Your debit card has been successfully activated and is ready to
              use.
            </p>
            <Button
              className="mt-6 w-full sm:w-auto"
              type="button"
              onClick={() => (window.location.href = "https://mezo.org/")}
            >
              Done
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (step === "confirmation") {
    return (
      <Card className="w-full shadow-sm">
        <CardHeader className="pb-3">
          <h2
            className={cn(
              "text-lg sm:text-xl font-semibold",
              riformaLL.className
            )}
          >
            Confirm Card Activation
          </h2>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label className="text-xs sm:text-sm text-gray-500">
                Card Number
              </Label>
              <p className={cn("font-medium text-base", riformaLL.className)}>
                {formatCardNumber(formData.cardNumber)}
              </p>
            </div>
            <div>
              <Label className="text-xs sm:text-sm text-gray-500">
                Full Name
              </Label>
              <p className={cn("font-medium text-base", riformaLL.className)}>
                {formData.fullName}
              </p>
            </div>
            <div>
              <Label className="text-xs sm:text-sm text-gray-500">Email</Label>
              <p className={cn("font-medium text-base", riformaLL.className)}>
                {formData.email}
              </p>
            </div>
            <div>
              <Label className="text-xs sm:text-sm text-gray-500">
                Mezo ID
              </Label>
              <p className={cn("font-medium text-base", riformaLL.className)}>
                {formData.mezoId}.mezo
              </p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button
            variant="outline"
            onClick={() => setStep("details")}
            className="w-full sm:w-auto order-2 sm:order-1"
          >
            <X className="mr-2 h-4 w-4" />
            Edit Details
          </Button>
          <Button
            onClick={confirmActivation}
            className="w-full sm:w-auto order-1 sm:order-2"
          >
            <Check className="mr-2 h-4 w-4" />
            Confirm Activation
          </Button>
        </CardFooter>
      </Card>
    );
  }

  if (step === "error") {
    return (
      <Card className="w-full shadow-sm">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-6 sm:py-8">
            <div className="rounded-full bg-red-100 p-3 mb-4">
              <X className="h-8 w-8 text-red-600" />
            </div>
            <h2
              className={cn(
                "text-xl sm:text-2xl font-bold text-center text-red-700",
                riformaLL.className
              )}
            >
              Activation Failed
            </h2>
            <p className="text-sm sm:text-base text-gray-600 text-center mt-2 px-2">
              {errorMsg}
            </p>
            <Button
              className="mt-6 w-full sm:w-auto"
              onClick={() => setStep("details")}
            >
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full shadow-sm">
      <CardContent className="pt-5">
        {isScanning && showScanner ? (
          <div className="relative space-y-4">
            <button
              type="button"
              className="absolute -top-4 right-0 z-20 p-2 rounded-full bg-white shadow hover:bg-gray-100 focus:outline-none"
              onClick={() => setIsScanning(false)}
              aria-label="Close Scanner"
            >
              <X
                className={`h-5 w-5 ${
                  scannerTimeout ? "text-red-500" : "text-gray-500"
                }`}
              />
            </button>
            <CardScanner
              onCardDetected={handleCardNumberDetected}
              onTimeout={() => setScannerTimeout(true)}
            />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label
                htmlFor="cardNumber"
                className={cn("text-sm", riformaLL.className)}
              >
                Card Number
              </Label>
              <div className="relative">
                {showScanner && (
                  <button
                    type="button"
                    className="absolute left-2 top-1/2 -translate-y-1/2 z-10 p-1 text-gray-400 hover:text-rose-500 focus:outline-none"
                    onClick={() => setIsScanning(true)}
                    tabIndex={0}
                    aria-label="Scan Card"
                  >
                    <Camera className="h-5 w-5" />
                  </button>
                )}
                <Input
                  id="cardNumber"
                  name="cardNumber"
                  placeholder="eg. 0497940ABF1E90"
                  value={formData.cardNumber}
                  onChange={handleInputChange}
                  required
                  maxLength={14}
                  className={cn(
                    "h-12 font-mono",
                    showScanner ? "pl-10" : "",
                    "uppercase",
                    riformaLL.className
                  )}
                  style={{ textTransform: "uppercase" }}
                />
              </div>
              {cardNumberError && (
                <p className={cn("text-sm text-red-500", riformaLL.className)}>
                  {cardNumberError}
                </p>
              )}
              {cardNumberVerification && (
                <p className={cn("text-sm text-gray-500", riformaLL.className)}>
                  {cardNumberVerification}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="mezoId"
                className={cn("text-sm", riformaLL.className)}
              >
                Mezo ID
              </Label>
              <div className="relative flex items-center">
                <Input
                  id="mezoId"
                  name="mezoId"
                  value={formData.mezoId}
                  onChange={handleInputChange}
                  onBlur={handleMezoIdBlur}
                  placeholder="joey"
                  className={cn(
                    "flex-1 h-12",
                    riformaLL.className,
                    mezoIdError && "border-red-500 focus-visible:ring-red-500"
                  )}
                  style={{ paddingRight: "4.5rem" }}
                />
                {/* Container for suffix and indicators */}
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  {/* .mezo suffix */}
                  <span className="text-gray-400 mr-2">.mezo</span>
                  {/* Loading/validation indicators */}
                  {isCheckingMezoId && (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
                  )}
                  {!isCheckingMezoId && mezoIdError && (
                    <X className="h-4 w-4 text-red-500" />
                  )}
                  {!isCheckingMezoId &&
                    !mezoIdError &&
                    formData.mezoId &&
                    formData.mezoId.length >= 3 && (
                      <Check className="h-4 w-4 text-green-500" />
                    )}
                </div>
              </div>
              {mezoIdError && (
                <p className={cn("text-sm text-red-500", riformaLL.className)}>
                  {mezoIdError}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="fullName"
                className={cn("text-sm", riformaLL.className)}
              >
                Full Name
              </Label>
              <Input
                id="fullName"
                name="fullName"
                placeholder="joey smith"
                value={formData.fullName}
                onChange={handleInputChange}
                required
                className={cn("h-12", riformaLL.className, {
                  "border-red-500 focus-visible:ring-red-500": fullNameError,
                })}
              />
              {fullNameError && (
                <p className={cn("text-sm text-red-500", riformaLL.className)}>
                  {fullNameError}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className={cn("text-sm", riformaLL.className)}
              >
                Email Address
              </Label>
              <div className="relative">
                <Input
                  id="email"
                  name="email"
                  type="email"
                  inputMode="email"
                  placeholder="joey@mezo.org"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className={cn("h-12", riformaLL.className, {
                    "border-red-500 focus-visible:ring-red-500": emailError,
                  })}
                />
                {isCheckingEmail && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="w-4 h-4 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
                {!isCheckingEmail &&
                  !emailError &&
                  formData.email &&
                  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Check className="h-4 w-4 text-green-500" />
                    </div>
                  )}
              </div>
              {emailError && (
                <p
                  className={cn(
                    "text-sm text-red-500 mt-1",
                    riformaLL.className
                  )}
                >
                  {emailError}
                </p>
              )}
            </div>
            <Button
              type="submit"
              className={cn("w-full h-12 text-base mt-2", riformaLL.className)}
              disabled={!isFormValid || !!cardNumberError}
            >
              Activate Card
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
