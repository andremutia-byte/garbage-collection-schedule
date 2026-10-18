/**
 * Philippine phone number utilities.
 *
 * Valid formats:
 * - 09XXXXXXXXX (11 digits, starts with 09)
 * - +639XXXXXXXXX (13 characters, starts with +639)
 * - 639XXXXXXXXX (12 digits, starts with 639)
 * - Allows common formatting characters like spaces, dashes, and parentheses.
 */

export interface PhoneValidationResult {
  valid: boolean;
  normalized?: string;
  error?: string;
}

export function validatePhilippinePhone(input: string): PhoneValidationResult {
  if (!input || typeof input !== "string" || input.trim() === "") {
    return {
      valid: false,
      error: "Contact number is required.",
    };
  }

  // Remove spaces, hyphens, and parentheses
  const sanitized = input.trim().replace(/[\s\-()]/g, "");

  // Match 09XXXXXXXXX (11 digits)
  if (/^09\d{9}$/.test(sanitized)) {
    return {
      valid: true,
      normalized: sanitized,
    };
  }

  // Match +639XXXXXXXXX (13 characters)
  if (/^\+639\d{9}$/.test(sanitized)) {
    return {
      valid: true,
      normalized: sanitized,
    };
  }

  // Match 639XXXXXXXXX without leading + (12 digits) -> normalize with leading +
  if (/^639\d{9}$/.test(sanitized)) {
    return {
      valid: true,
      normalized: `+${sanitized}`,
    };
  }

  return {
    valid: false,
    error: "Invalid phone number. Please enter a valid Philippine mobile number (e.g., 09XXXXXXXXX or +639XXXXXXXXX).",
  };
}

/**
 * Format a Philippine phone number for clean UI display.
 */
export function formatPhoneDisplay(phone: string | null | undefined): string {
  if (!phone) return "—";
  const sanitized = phone.trim().replace(/[\s\-()]/g, "");

  if (/^09\d{9}$/.test(sanitized)) {
    return `${sanitized.slice(0, 4)} ${sanitized.slice(4, 7)} ${sanitized.slice(7)}`;
  }

  if (/^\+639\d{9}$/.test(sanitized)) {
    return `+63 ${sanitized.slice(3, 6)} ${sanitized.slice(6, 9)} ${sanitized.slice(9)}`;
  }

  return phone;
}
