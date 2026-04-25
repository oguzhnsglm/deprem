# Submission Checklist — Uçtan Uca Yayın Rehberi

Kolaydan zora sıralı. Her adım tamamlanınca ✅ işaretleyin.

---

## A. TEKNİK HAZIRLIK (kodda tamamlananlar)

- [x] `app.json` → iOS infoPlist, Android permissions, expo-location/image-picker/av plugin config
- [x] Production'da `console.log` strip (`babel-plugin-transform-remove-console`)
- [x] Root `ErrorBoundary` (beyaz ekran engellendi)
- [x] `eas.json` (development/preview/production profilleri, `autoIncrement`)
- [x] `.env.example` (client)
- [x] `.env.example` (server, NODE_ENV + CORS + JWT)
- [x] Server güvenlik: CORS whitelist, security headers, body limit, safe-spot rate limit + JWT auth + image size limit
- [x] `jsonwebtoken` paketi server'a kurulu
- [x] Mobile safe-spot isteğine Supabase JWT header eklendi
- [x] `logic/legalConfig.js` → Oğuzhan Sağlam, quakeguide.support@gmail.com, Türkiye
- [x] Gizlilik ekranından "Taslak" uyarısı kaldırıldı
- [x] Map kartına "Beklenen Maks. Büyüklük (Mw)" eklendi (9 dilde)

## B. DÖKÜMAN VARLIKLARI (üretildi, dağıtıma hazır)

- [x] `docs/privacy-site/index.html` — 2 dilli gizlilik politikası web sayfası
- [x] `docs/privacy-site/support.html` — destek/SSS sayfası
- [x] `docs/privacy-site/terms.html` — kullanım şartları
- [x] `docs/STORE_LISTING.md` — TR/EN app adı, açıklamalar, keywords, kategori
- [x] `docs/DATA_SAFETY.md` — Play Data Safety + Apple Privacy Nutrition cevapları
- [x] `docs/APP_STORE_REVIEW_NOTES.md` — reviewer notları, content rating, export compliance

## C. KULLANICI TARAFI — YAPILMASI GEREKENLER

### Sıra 1: Gizlilik sayfasını web'e koy (15 dk)
- [ ] GitHub'da yeni public repo oluştur (`quakeguide-legal` veya benzeri)
- [ ] `docs/privacy-site/` klasörünün içeriğini repo'ya kopyala (`index.html`, `support.html`, `terms.html`)
- [ ] Repo → Settings → Pages → Deploy from branch → `main` / root → Save
- [ ] 2 dk sonra `https://<kullanıcı>.github.io/<repo>/` üzerinden erişilebilir olur
- [ ] URL'yi `logic/legalConfig.js` → `privacyPolicyUrl`'e yaz (şu an placeholder)
- [ ] URL'yi `docs/STORE_LISTING.md` içine yaz

### Sıra 2: Icon ve splash (30-60 dk)
- [ ] 1024×1024 app icon PNG → `assets/icon.png`
- [ ] 1024×1024 adaptive icon foreground (şeffaf bg, içerik ortada %66) → `assets/adaptive-icon.png`
- [ ] 1242×2436 splash screen PNG (bg `#0A0F1E`) → `assets/splash.png`
- [ ] `app.json`'a şu blokları geri ekle:
  ```json
  "icon": "./assets/icon.png",
  "splash": { "image": "./assets/splash.png", "resizeMode": "contain", "backgroundColor": "#0A0F1E" },
  "android": { "adaptiveIcon": { "foregroundImage": "./assets/adaptive-icon.png", "backgroundColor": "#0A0F1E" } }
  ```
- **Öneri araçlar:** Recraft.ai (AI icon), Figma (manuel), Iconkitchen (Google), Rotato (mockup)

### Sıra 3: Server deploy (30-60 dk)
- [ ] Railway/Render/Fly.io hesabı aç
- [ ] `d:/deprem/server/` klasörünü GitHub'a push et (ayrı repo)
- [ ] Hosting'de repo'yu bağla; environment variables:
  - `NODE_ENV=production`
  - `OPENAI_API_KEY=sk-...` (mevcut `.env`'den al)
  - `SUPABASE_JWT_SECRET=...` (Supabase Dashboard → Settings → API)
  - `REQUIRE_SAFE_SPOT_AUTH=1`
  - `ALLOWED_ORIGINS=` (şimdilik boş bırak, mobile app Origin header göndermez)
- [ ] Büyük veri dosyalarını volume'a yükle: `global_vs30.grd`, `gem_active_faults.geojson`, `v2023_1_pga_475_rock_3min.tif`
- [ ] HTTPS domain'i doğrula: `curl https://api.../health`
- [ ] Mobile `.env` → `EXPO_PUBLIC_API_BASE=https://api.quakeguide.app` (veya aldığın domain)
- [ ] `.env`'deki `OPENAI_API_KEY`'i `.env` dosyasından sil

### Sıra 4: Supabase hardening (5 dk)
- [ ] Supabase Dashboard → SQL Editor
- [ ] `docs/supabase-security-hardening.sql` içindeki SQL'i çalıştır
- [ ] Dashboard → Authentication → Password Security → "Leaked password protection" = ON
- [ ] Security Advisor → Rerun linter; uyarı kalmadığını doğrula

### Sıra 5: Google Play Console ($25, 1-2 gün onay)
- [ ] play.google.com/console → Register as individual developer
- [ ] Kimlik doğrulama (TC kimlik)
- [ ] Ödeme: $25 tek seferlik
- [ ] Hesap onayı sonrası yeni app oluştur: "QuakeGuide"

### Sıra 6: Build al (EAS)
- [ ] `npm install -g eas-cli`
- [ ] `eas login`
- [ ] EAS secrets ekle:
  ```bash
  eas secret:create --name EXPO_PUBLIC_API_BASE --value "https://api.quakeguide.app"
  eas secret:create --name EXPO_PUBLIC_SUPABASE_URL --value "..."
  eas secret:create --name EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY --value "..."
  ```
- [ ] `eas build --platform android --profile preview` → test APK
- [ ] `eas build --platform android --profile production` → Play Store AAB

### Sıra 7: Screenshot'lar (1-2 saat)
- [ ] Çalışan uygulamadan min. 4 ekran görüntüsü (Home, Map, Feed, Profile/SafeSpot)
- [ ] Gerekli boyutlar:
  - Android Phone: min 1080×1920 (7:16 veya 16:9)
  - Android Tablet: min 1200×1920
  - iPhone 6.7": 1290×2796
  - iPhone 6.5": 1242×2688
  - iPad Pro 12.9": 2048×2732
- [ ] Feature graphic (Play Store): 1024×500
- **Öneri:** Rotato.xyz, Previewed.app, Figma mockup şablonları

### Sıra 8: Play Store submission (30 dk form + 1-7 gün onay)
- [ ] `docs/STORE_LISTING.md`'den metinleri kopyala
- [ ] `docs/DATA_SAFETY.md`'den Data Safety formunu doldur
- [ ] `docs/APP_STORE_REVIEW_NOTES.md`'den content rating doldur
- [ ] AAB yükle → Internal testing track
- [ ] Test ekibini ekle, test et → Production'a promote

### Sıra 9: Apple Developer ($99/yıl, 1-2 gün onay)
- [ ] developer.apple.com → Enroll as individual ($99)
- [ ] Apple Team ID'yi al
- [ ] App Store Connect'te yeni app oluştur → Bundle ID: `com.oguzhnsglm.deprem`
- [ ] `eas.json` → `submit.production.ios.appleTeamId` ve `ascAppId` değerlerini güncelle

### Sıra 10: iOS build + App Store submission (1 saat + 1-3 gün onay)
- [ ] `eas build --platform ios --profile production`
- [ ] `eas submit --platform ios --profile production`
- [ ] App Store Connect'te Privacy Nutrition Labels doldur (`docs/DATA_SAFETY.md`)
- [ ] Review Notes (`docs/APP_STORE_REVIEW_NOTES.md`)
- [ ] Export Compliance: ITSAppUsesNonExemptEncryption zaten false → "No"
- [ ] Submit for Review

---

## D. Yayın Sonrası

- [ ] Play Console'da metrics / crashes izle
- [ ] App Store Connect'te review status izle
- [ ] İlk 100 kullanıcı geri bildirimi → hotfix planı
- [ ] Sentry veya Bugsnag ekle (şu an sadece ErrorBoundary var, uzaktan rapor yok)
