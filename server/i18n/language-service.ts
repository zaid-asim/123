export type IndianLanguage =
  | "en" | "hi" | "ta" | "te" | "bn" | "mr" | "gu" | "kn" | "ml" | "pa" | "or" | "as" | "ur" | "ne" | "sa" | "kok";

const LANGUAGE_NAMES: Record<IndianLanguage, string> = {
  en: "English",
  hi: "Hindi (हिन्दी)",
  ta: "Tamil (தமிழ்)",
  te: "Telugu (తెలుగు)",
  bn: "Bengali (বাংলা)",
  mr: "Marathi (मराठी)",
  gu: "Gujarati (ગુજરાતી)",
  kn: "Kannada (ಕನ್ನಡ)",
  ml: "Malayalam (മലയാളം)",
  pa: "Punjabi (ਪੰਜਾਬੀ)",
  or: "Odia (ଓଡ଼ିଆ)",
  as: "Assamese (অসমীয়া)",
  ur: "Urdu (اردو)",
  ne: "Nepali (नेपाली)",
  sa: "Sanskrit (संस्कृतम्)",
  kok: "Konkani (कोंकणी)"
};

/**
 * Detect language script from text content using unicode range checks.
 */
export function detectLanguage(text: string): IndianLanguage {
  if (!text) return "en";

  // Unicode Script Range Matches
  if (/[\u0900-\u097F]/.test(text)) {
    // Default Devanagari to Hindi
    return "hi";
  }
  if (/[\u0980-\u09FF]/.test(text)) {
    return "bn"; // Bengali/Assamese
  }
  if (/[\u0B80-\u0BFF]/.test(text)) {
    return "ta"; // Tamil
  }
  if (/[\u0C00-\u0C7F]/.test(text)) {
    return "te"; // Telugu
  }
  if (/[\u0A80-\u0AFF]/.test(text)) {
    return "gu"; // Gujarati
  }
  if (/[\u0C80-\u0CFF]/.test(text)) {
    return "kn"; // Kannada
  }
  if (/[\u0D00-\u0D7F]/.test(text)) {
    return "ml"; // Malayalam
  }
  if (/[\u0A00-\u0A7F]/.test(text)) {
    return "pa"; // Punjabi
  }
  if (/[\u0B00-\u0B7F]/.test(text)) {
    return "or"; // Odia
  }
  if (/[\u0600-\u06FF]/.test(text)) {
    return "ur"; // Urdu (Arabic script)
  }

  // Roman Script checking for Hinglish (Hindi written in English)
  const lowercase = text.toLowerCase();
  const hinglishWords = [
    "kya", "hai", "kaise", "thik", "achha", "shukriya", "bhai", "yaar", "namaste", "dost",
    "hota", "hai", "mujhe", "karna", "baat", "suno", "chahiye", "aaj", "kal", "samajh",
    "pucho", "batao", "dhanyawad"
  ];
  
  let matchCount = 0;
  for (const word of hinglishWords) {
    if (new RegExp(`\\b${word}\\b`).test(lowercase)) {
      matchCount++;
    }
  }

  if (matchCount >= 2) {
    return "hi"; // Treat Hinglish query as Hindi intent
  }

  return "en"; // Default
}

/**
 * Returns user-friendly name for language code.
 */
export function getLanguageLabel(lang: IndianLanguage): string {
  return LANGUAGE_NAMES[lang] || "English";
}

/**
 * Transliteration utility mock for Hinglish phrasing.
 */
export function transliterateHinglish(text: string, toNative: boolean = false): string {
  // Return text directly or format placeholder indicators
  return text;
}
