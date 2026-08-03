# 📌 Dube Debter (ዱቤ ደብተር) - Project State & Architecture Document

## 1. Project Overview
- **App Name:** Dube Debter (ዱቤ ደብተር)
- **Target Audience:** Micro-retailers (local kiosks / ሱቅ) in Ethiopia.
- **Core Problem:** Manual paper notebooks for tracking informal customer credit (ዕዳ) cause math errors, lost pages, and uncollected debt. Shopkeepers are too busy to type entries manually.
- **Solution:** Offline-first, voice-powered digital credit ledger using Amharic/Oromiffa speech-to-text, a 3-second "Zero-Typo" human confirmation screen, and 1-tap localized payment links (Telebirr / CBE Birr).

---

## 2. Tech Stack & Infrastructure
- **Frontend Framework:** React Native / Expo (Dark theme default `#0E2417` green palette)
- **Backend & Database:** Supabase (PostgreSQL with Row-Level Security)
- **Voice Engine:** `expo-av` audio recording ➔ OpenAI Whisper API (Amharic transcription)
- **Offline Storage:** Local storage (`AsyncStorage` / SQLite) synced to Supabase when connected
- **Auth & Tokens:** Phone/Password via Supabase Auth stored in `expo-secure-store`
- **Build & Store Deployment:** Expo Application Services (EAS) for Google Play (.aab) & Apple App Store (.ipa)

---

## 3. Core App Features
1. **Voice Input Sequence:** Record voice (e.g., *"Abebe 50 Birr oil on credit"*) ➔ Transcribe ➔ Parse fields.
2. **Zero-Typo Confirmation Card:** 6-second card showing Parsed Name, Amount, Type (ዕዳ/ክፍያ) with `[❌ አርም]` and `[✅ አጽድቅ]` buttons + Haptic feedback.
3. **1-Tap Digital Reminders:** Pre-filled Amharic SMS/WhatsApp messages with Telebirr/CBE payment links.
4. **Offline Sync Indicator:** Green dot for "Synced", Orange dot for "Offline Mode".

---

## 4. Current Folder Structure (`DUBE/`)