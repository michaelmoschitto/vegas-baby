export interface MezoIdValidationResult {
  isValid: boolean;
  error?: string;
}

export function validateMezoId(mezoId: string): MezoIdValidationResult {
  if (!mezoId) {
    return {
      isValid: false,
      error: "Mezo ID is required",
    };
  }

  if (!mezoId.endsWith(".mezo")) {
    return {
      isValid: false,
      error: "Mezo ID must end with .mezo",
    };
  }

  const baseId = mezoId.slice(0, -5);

  if (baseId.length > 15) {
    return {
      isValid: false,
      error: "Mezo ID must be 15 characters or less (excluding .mezo)",
    };
  }

  if (!/^[A-Za-z]/.test(baseId)) {
    return {
      isValid: false,
      error: "Mezo ID must start with a letter",
    };
  }

  if (!/^[A-Za-z]([A-Za-z0-9-]*[A-Za-z0-9])?$/.test(baseId)) {
    return {
      isValid: false,
      error:
        "Mezo ID can only contain letters, numbers, and hyphens, and must end with a letter or number",
    };
  }

  if (baseId.includes("0x")) {
    return {
      isValid: false,
      error: "Mezo ID cannot contain '0x'",
    };
  }

  if (/^(?:bc1|tb1|[a-z]pub|[a-z]priv)/.test(baseId)) {
    return {
      isValid: false,
      error: "Mezo ID cannot start with Bitcoin-related prefixes",
    };
  }

  if (/^m[0-9]+/.test(baseId)) {
    return {
      isValid: false,
      error: "Mezo ID cannot start with 'm' followed by numbers",
    };
  }

  return { isValid: true };
}

export interface CardUidValidationResult {
  isValid: boolean;
  error?: string;
}

export function validateCardUid(uid: string): CardUidValidationResult {
  if (!uid) {
    return { isValid: false, error: "Card UID is required" };
  }
  if (uid.length !== 14) {
    return {
      isValid: false,
      error: "Card UID must be exactly 14 characters long",
    };
  }
  if (!/^[0-9a-f]+$/.test(uid)) {
    return {
      isValid: false,
      error:
        "Card UID must be lowercase hexadecimal (0-9, a-f) with no spaces or special characters",
    };
  }
  return { isValid: true };
}
