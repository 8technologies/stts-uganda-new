export function isValidUgandanPhoneNumber(phone_number) {
  if (!phone_number) return false;

  const cleaned = String(phone_number).trim().replace(/[\s-]/g, "");

  // Accepts: 0701234567 (10 digits, starts with 0)
  //          +256701234567 or 256701234567 (starts with country code)
  // Valid Uganda mobile prefixes after the leading 0/256: 7, 3, 4 (e.g. 070, 077, 078, 075, 074, 039, 020...)
  const localPattern = /^0[7346]\d{8}$/;
  const intlPattern = /^(\+?256)[7346]\d{8}$/;

  return localPattern.test(cleaned) || intlPattern.test(cleaned);
}

