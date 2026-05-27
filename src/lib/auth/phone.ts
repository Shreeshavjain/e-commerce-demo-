// Firebase phone auth expects E.164 formatting, so this helper keeps the input normalized before we hand it off.
export function normalizePhoneNumber(phoneNumber: string) {
  const trimmed = phoneNumber.trim().replace(/[()\-\s.]/g, "");

  if (!trimmed) {
    return "";
  }

  if (trimmed.startsWith("+")) {
    return trimmed;
  }

  if (trimmed.startsWith("00")) {
    return `+${trimmed.slice(2)}`;
  }

  return `+${trimmed}`;
}