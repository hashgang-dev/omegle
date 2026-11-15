/**
 * ============================================================================
 * 🛡️ HashGANG Chat - Global Multilingual Content Moderation Engine
 * ============================================================================
 * Provides high-speed (0.01ms) client-side profanity filtering with Unicode
 * Script Gating across 12+ Global and Indian regional languages:
 * 1. Global: English, Spanish, French, German, Arabic
 * 2. Indian: Telugu, Hindi, Tamil, Kannada, Malayalam, Marathi, Bengali
 * (Covers both native scripts and Romanized transliteration / Tanglish / Hinglish)
 * ============================================================================
 */

(function (root, factory) {
  if (typeof define === "function" && define.amd) {
    define([], factory);
  } else if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.HashGangModeration = factory();
    root.containsUnparliamentaryWords = root.HashGangModeration.containsUnparliamentaryWords;
    root.normalizeForProfanity = root.HashGangModeration.normalizeText;
  }
}(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  // Leetspeak & repeated-character normalizer
  function normalizeText(str) {
    if (!str || typeof str !== "string") return "";
    let s = str.toLowerCase();
    s = s.replace(/[@]/g, "a")
         .replace(/[0]/g, "o")
         .replace(/[1!|]/g, "i")
         .replace(/[3]/g, "e")
         .replace(/[$5]/g, "s");
    s = s.replace(/(.)\1{2,}/g, "$1$1");
    return s;
  }

  // Unicode Script Gates (Instant boolean test to bypass irrelevant language blocks)
  const HAS_TELUGU = /[\u0C00-\u0C7F]/;
  const HAS_DEVANAGARI = /[\u0900-\u097F]/;
  const HAS_TAMIL = /[\u0B80-\u0BFF]/;
  const HAS_KANNADA = /[\u0C80-\u0CFF]/;
  const HAS_MALAYALAM = /[\u0D00-\u0D7F]/;
  const HAS_BENGALI = /[\u0980-\u09FF]/;
  const HAS_ARABIC = /[\u0600-\u06FF]/;

  // Latin Script Patterns (English, Spanish, French, German, and Romanized Indian Transliterations)
  const LATIN_PATTERNS = [
    // English (Notice: "suck" is intentionally excluded per design)
    /\b(f+u+c+k\w*|f+u+k\w*|s+h+i+t\w*|b+i+t+c+h\w*|d+i+c+k\w*|p+u+s+s+y\w*|c+o+c+k\w*|c+u+n+t\w*|w+h+o+r+e\w*|s+l+u+t\w*|b+a+s+t+a+r+d\w*|a+s+s+h+o+l+e\w*|d+i+l+d+o\w*|p+o+r+n\w*|n+u+d+e+s|b+o+o+b+s|m+o+t+h+e+r+f+u+c+k\w*)\b/i,

    // Telugu (Tanglish / Roman Script)
    /\b(l+a+n+j+\w*|d+e+n+g+u(?!e)\w*|d+e+n+g+i\w*|d+h+e+n+g+u(?!e)\w*|m+o+d+d+a\w*|p+u+k+u\w*|p+o+o+k+u\w*|g+u+d+h+a\w*|g+u+d+d+a\w*|m+u+n+d+a\w*|s+u+l+l+i\w*|e+r+r+i+p+u+k+\w*|e+r+r+i+p+o+o+k+\w*|e+r+r+i+m+u+n+d+a\w*|k+o+j+j+a\w*|k+o+j+j+o+d+\w*|n+a+k+o+d+a+k+\w*|n+a+a+k+o+d+a+k+\w*)\b/i,

    // Hindi & Marathi (Hinglish / Roman Script)
    /\b(m+a+d+a+r+c+h+o+d\w*|b+h+e+n+c+h+o+d\w*|b+e+h+e+n+c+h+o+d\w*|c+h+u+t+i+y+a\w*|b+h+o+s+d+i\w*|b+s+d+k|b+o+s+d+k|g+a+a+n+d\w*|g+a+n+d+u\w*|l+a+u+d+e\w*|l+a+v+d+e\w*|l+u+n+d\w*|c+h+o+o+t\w*|c+h+u+t\b|r+a+a+n+d\w*|r+a+n+d+i\w*|h+a+r+a+m+i\w*|c+h+o+d+u\w*|c+h+o+d\b)\b/i,

    // South Indian Regional Transliterations (Tamil, Kannada, Malayalam in Roman Script)
    /\b(t+h+e+v+i+d+i+y+a\w*|o+o+m+b+u\w*|s+u+n+n+i\w*|p+u+n+d+a\w*|k+o+o+t+h+i\w*|s+u+l+e+m+a+g+a\w*|b+o+l+i+m+a+g+a\w*|m+y+r+e\w*|m+y+p+r+u\w*|t+h+a+y+o+l+i\w*)\b/i,

    // Spanish
    /\b(p+u+t+a\w*|m+i+e+r+d+a\w*|c+o+ñ+o\w*|c+o+n+o\w*|p+e+n+d+e+j+o\w*|c+a+b+r+o+n\w*|g+i+l+i+p+o+l+l+a+s\w*)\b/i,

    // French
    /\b(m+e+r+d+e\w*|p+u+t+a+i+n\w*|c+o+n+n+a+r+d\w*|s+a+l+o+p+e\w*|c+h+i+e+n+n+e\w*|b+a+t+a+r+d\w*|e+n+c+u+l+e\w*)\b/i,

    // German
    /\b(a+r+s+c+h+l+o+c+h\w*|s+c+h+e+i+s+s+e\w*|s+c+h+e+i+ß+e\w*|h+u+r+e+n+s+o+h+n\w*|f+o+t+z+e\w*|w+i+c+h+s+e+r\w*)\b/i,

    // Arabic (Transliterated)
    /\b(s+h+a+r+m+o+u+t+a\w*|k+u+s+s\w*|m+a+n+y+o+o+k\w*)\b/i
  ];

  // Native Script Patterns (Evaluated ONLY when corresponding script is detected)
  const NATIVE_SCRIPT_PATTERNS = {
    telugu: /(లంజ|దెంగు|దెంగి|లెంజ|మొడ్డ|పూకు|పుకు|గుద్ద|గుద|ముండ|ముండమోపి|సుల్లి|ఎర్రిపూకు|ఎర్రిపుకు|కొజ్జా|నాకొడక)/u,
    devanagari: /(मादरचోద|मादरचोद|भेंचोद|बहनचोद|चूतिया|चूत|भोसड़ी|भोसड़ी|गांड|गाండు|लंड|लौड़े|लौड़े|रांड|रंडी|झाटू|भडवे|रांड्या|झवल्या)/u,
    tamil: /(தேவிடியா|ஓம்பு|புண்ட|கூதி|சுண்ணி)/u,
    kannada: /(ಸೂಳೆ|ಬೋಳಿಮಗ|ತುಲ್ಲು|ಶಟ|ಹುಚ್ಚನಾಯಿ)/u,
    malayalam: /(മൈര്|പൂറ്|കുണ്ണ|തന്തയില്ലാത്തവൻ|പട്ടി)/u,
    bengali: /(মাদারচোদ|ভোদাত|খানকি|চুদা|বাল)/u,
    arabic: /(شرموطة|كس|ابن الكلب|عاهر|منيوك)/u
  };

  // Compressed Substring Matchers for spaced / punctuated trick variations
  const COMPRESSED_SUBSTRING_WORDS = [
    "lanja", "dhengu", "modda", "puku", "pooku", "gudha", "gudda", "mundamopi",
    "madarchod", "bhenchod", "behenchod", "chutiya", "bhosdike", "bhosdiwala", "gandu",
    "fuck", "bitch", "cunt", "asshole", "motherfuck", "pendejo", "cabron", "putain", "arschloch", "hurensohn"
  ];

  function containsUnparliamentaryWords(text) {
    if (!text || typeof text !== "string") return false;
    const norm = normalizeText(text);

    // 1. Check Latin / Global patterns
    for (let i = 0; i < LATIN_PATTERNS.length; i++) {
      if (LATIN_PATTERNS[i].test(norm) || LATIN_PATTERNS[i].test(text)) {
        return true;
      }
    }

    // 2. Script-gated checks (0 microsecond exit if script not present)
    if (HAS_TELUGU.test(text) && NATIVE_SCRIPT_PATTERNS.telugu.test(text)) return true;
    if (HAS_DEVANAGARI.test(text) && NATIVE_SCRIPT_PATTERNS.devanagari.test(text)) return true;
    if (HAS_TAMIL.test(text) && NATIVE_SCRIPT_PATTERNS.tamil.test(text)) return true;
    if (HAS_KANNADA.test(text) && NATIVE_SCRIPT_PATTERNS.kannada.test(text)) return true;
    if (HAS_MALAYALAM.test(text) && NATIVE_SCRIPT_PATTERNS.malayalam.test(text)) return true;
    if (HAS_BENGALI.test(text) && NATIVE_SCRIPT_PATTERNS.bengali.test(text)) return true;
    if (HAS_ARABIC.test(text) && NATIVE_SCRIPT_PATTERNS.arabic.test(text)) return true;

    // 3. Spaced / punctuated trick bypass check
    let compressed = norm.replace(/[\s\.\-_,\*\+\#\!]/g, "");
    const safeDengue = compressed.replace(/dengue/g, "");
    if (safeDengue.includes("dengu")) return true;

    for (let j = 0; j < COMPRESSED_SUBSTRING_WORDS.length; j++) {
      if (compressed.includes(COMPRESSED_SUBSTRING_WORDS[j])) return true;
    }

    return false;
  }

  return {
    normalizeText: normalizeText,
    containsUnparliamentaryWords: containsUnparliamentaryWords
  };
}));

