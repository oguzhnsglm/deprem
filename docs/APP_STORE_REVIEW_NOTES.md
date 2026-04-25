# Apple App Store / Google Play — Reviewer Notes

Store inceleme ekipleri için hazırlanan bilgilendirme. Submission sırasında "App Review Information" / "Notes for reviewer" alanına kopyalayın.

---

## App Review Information (Apple)

### Demo account
Uygulama anonim oturum açar — ayrı bir demo hesaba gerek yoktur. Açılışta Supabase üzerinden otomatik anonim giriş yapılır ve tüm özellikler erişilebilir olur.

### Notes for reviewer

```
Thank you for reviewing QuakeGuide.

GENERAL
- QuakeGuide is an earthquake awareness and emergency preparedness app.
- The app uses anonymous Supabase authentication on launch, so a reviewer does not need to sign up; all features are immediately accessible.

KEY FEATURES TO TEST
1. Home / Earthquake Feed: live quake list from USGS, Kandilli (TR), INGV (IT), JMA (JP), GeoNet (NZ), BMKG (ID). Pull to refresh.
2. Map Explorer: long-press any point on the map to see Vs30 soil class, fault distance, expected maximum magnitude (Mw range), and regional hazard score. The hazard overlay toggle shows a color-coded PGA map.
3. Safe Spot (AI): take/pick a room photo; a server endpoint forwards it to OpenAI Vision to mark safe vs. risky zones. Image is processed ephemerally and is not stored.
4. Profile: multilingual (9 languages), change country/city preferences, magnitude threshold, emergency contacts.
5. Privacy Policy + Data Sources screens are linked from the Profile screen.

PERMISSIONS (rationale)
- NSLocationWhenInUseUsageDescription: required for point-based soil/fault analysis and for preparing an emergency share message.
- NSCameraUsageDescription / NSPhotoLibraryUsageDescription: required for Safe Spot room photo analysis.
- NSMicrophoneUsageDescription / NSSpeechRecognitionUsageDescription: reserved for voice-activated emergency commands.

DATA & PRIVACY
- No third-party advertising or tracking SDKs.
- OpenAI API key is server-side only; no keys are bundled in the client.
- Detailed privacy policy at: https://quakeguide.support/privacy
- Deletion requests: quakeguide.support@gmail.com (processed within 30 days).

CONTACT
- Developer: Oğuzhan Sağlam
- Email: quakeguide.support@gmail.com
```

---

## Google Play — Internal testing notes

```
This build is intended for closed testing.
- Anonymous Supabase login; no sign-up required.
- Location permission is optional; the app works without it (map features limited).
- Backend: https://<YOUR_DEPLOYED_API>   ← production URL'yi buraya yazın
- Privacy policy: https://quakeguide.support/privacy
```

---

## Content Rating / Yaş Sınıfı

- **Apple:** 4+ (şiddet/korku içermez; yalnızca bilgi sunar)
- **Google Play IARC:** Everyone / 3+ (Türkiye PEGI 3)
- Soru akışında "Violence, profanity, sexual content, realistic violence, crude humor" gibi başlıklar → hepsi **None**.
- "Users can interact" (UGC / chat) → No.
- "Shares user's location with other users" → No. *(Kullanıcı kendi kişilerine WhatsApp/SMS ile paylaşır, uygulama üzerinden diğer kullanıcılara değil.)*

---

## Export Compliance (Apple)

`app.json` içinde zaten tanımlı: `ITSAppUsesNonExemptEncryption = false`.
App Store Connect → Encryption Documentation sorusuna **"No, the app does not use encryption beyond what is standard iOS/Android"** yanıtı verilebilir. Sadece HTTPS kullanılıyor.

---

## Advertising ID / App Tracking Transparency

- **Reklam:** Yok. AdMob / Facebook Ads SDK yüklü değil.
- **ATT prompt:** Gösterilmez (tracking yapılmadığı için gerekmez).
- Apple Privacy → "Data Used to Track You" → **None**.
