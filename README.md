# Deprem Rehberi

Deprem Rehberi, React Native (Expo) tabanlÄ± bir mobil uygulamadÄ±r. GerÃ§ek zamanlÄ± deprem verilerini takip etmenizi, zemin ve fay analizi yapmanÄ±zÄ±, gÃ¼venli alan tespiti iÃ§in AI destekli fotoÄŸraf analizi kullanmanÄ±zÄ± ve acil durumda yakÄ±nlarÄ±nÄ±za anÄ±nda bildirim gÃ¶ndermenizi saÄŸlar.

---

## Ä°Ã§indekiler

- [Ã–zellikler](#Ã¶zellikler)
- [Mimari](#mimari)
- [Kurulum](#kurulum)
- [Ortam DeÄŸiÅŸkenleri (.env)](#ortam-deÄŸiÅŸkenleri-env)
- [Supabase Kurulumu](#supabase-kurulumu)
- [VS30 / Fay Analizi Sunucusu](#vs30--fay-analizi-sunucusu)
- [Ekranlar ve ModÃ¼ller](#ekranlar-ve-modÃ¼ller)
- [Veri KaynaklarÄ±](#veri-kaynaklarÄ±)
- [Bildirim Sistemi](#bildirim-sistemi)
- [WhatsApp Bildirim ModÃ¼lÃ¼](#whatsapp-bildirim-modÃ¼lÃ¼)
- [Notlar ve KÄ±sÄ±tlamalar](#notlar-ve-kÄ±sÄ±tlamalar)

---

## Ã–zellikler

| Ã–zellik | AÃ§Ä±klama |
|---|---|
| GerÃ§ek zamanlÄ± deprem akÄ±ÅŸÄ± | USGS, Kandilli, IRIS kaynaklarÄ±ndan 2 dakikada bir gÃ¼ncellenen veri |
| Zemin analizi (VS30) | Haritada uzun basÄ±lan noktanÄ±n zemin sÄ±nÄ±fÄ±nÄ± ve deprem ivmesi risk bilgisini gÃ¶sterir |
| Fay uzaklÄ±ÄŸÄ± | GEM kÃ¼resel fay veri tabanÄ±na gÃ¶re seÃ§ilen noktanÄ±n en yakÄ±n aktif faya mesafesi |
| AI gÃ¼venli alan analizi | Kamera veya galeriden Ã§ekilen fotoÄŸrafÄ± OpenAI GPT-4o ile analiz ederek gÃ¼venli/riskli bÃ¶lgeleri iÅŸaretler |
| Acil durum yÃ¶netimi | Panik adÄ±mlarÄ±, acil numaralar ve WhatsApp Ã¼zerinden yakÄ±n bildirimi |
| Profil ve bildirim eÅŸiÄŸi | KullanÄ±cÄ± adÄ±, ÅŸehir ve magnitude eÅŸiÄŸi Supabase'de saklanÄ±r; eÅŸik aÅŸÄ±ldÄ±ÄŸÄ±nda uygulama iÃ§i bildirim gelir |
| Acil durum kiÅŸileri | Supabase'e kaydedilen kiÅŸiler acil durumda WhatsApp Ã¼zerinden sÄ±rayla bilgilendirilir |
| KaydÄ±rma navigasyonu | Ekranlar arasÄ±nda yatay kaydÄ±rma ile geÃ§iÅŸ yapÄ±labilir |

---

## Mimari

```
deprem/
â”œâ”€â”€ App.js                        # Uygulama kÃ¶k bileÅŸeni, auth baÅŸlatma
â”œâ”€â”€ app.json                      # Expo konfigÃ¼rasyonu
â”œâ”€â”€ .env                          # Ortam deÄŸiÅŸkenleri (git'e dahil deÄŸil)
â”‚
â”œâ”€â”€ screens/                      # Ekran bileÅŸenleri
â”‚   â”œâ”€â”€ HomeScreen.js             # Ana ekran â€” son depremler + hÄ±zlÄ± iÅŸlemler
â”‚   â”œâ”€â”€ EarthquakeFeedScreen.js   # Deprem geÃ§miÅŸi listesi + sayfalama
â”‚   â”œâ”€â”€ MapExplorerScreen.js      # Harita + VS30 + fay analizi
â”‚   â”œâ”€â”€ SafeSpotScreen.js         # AI destekli gÃ¼venli alan analizi
â”‚   â”œâ”€â”€ EmergencyStatusScreen.js  # Panik adÄ±mlarÄ± ekranÄ±
â”‚   â”œâ”€â”€ AlertScreen.js            # Acil durum durumu + WhatsApp bildirimi
â”‚   â”œâ”€â”€ ContactsScreen.js         # Acil durum kiÅŸileri yÃ¶netimi
â”‚   â””â”€â”€ ProfileScreen.js          # Profil gÃ¶rÃ¼ntÃ¼leme ve dÃ¼zenleme
â”‚
â”œâ”€â”€ components/                   # Yeniden kullanÄ±labilir UI bileÅŸenleri
â”‚   â”œâ”€â”€ BottomNavBar.js           # Alt navigasyon Ã§ubuÄŸu
â”‚   â”œâ”€â”€ ScreenWrapper.js          # Ortak ekran sarmalayÄ±cÄ±sÄ±
â”‚   â”œâ”€â”€ PrimaryButton.js          # Birincil buton bileÅŸeni
â”‚   â”œâ”€â”€ ContactCard.js            # KiÅŸi kartÄ± bileÅŸeni
â”‚   â””â”€â”€ SafeSpotAdvice.js         # GÃ¼venli alan tavsiye kartÄ±
â”‚
â”œâ”€â”€ logic/                        # Ä°ÅŸ mantÄ±ÄŸÄ± ve servisler
â”‚   â”œâ”€â”€ earthquakeSources.js      # USGS/Kandilli/IRIS veri Ã§ekme + Ã¶nbellekleme
â”‚   â”œâ”€â”€ safeSpotAnalyzer.js       # OpenAI GPT-4o ile fotoÄŸraf analizi
â”‚   â”œâ”€â”€ notificationService.js    # Uygulama iÃ§i bildirim yÃ¶netimi
â”‚   â”œâ”€â”€ authStore.js              # Supabase anonim kimlik doÄŸrulama
â”‚   â”œâ”€â”€ profileService.js         # Profil Supabase CRUD
â”‚   â”œâ”€â”€ profileStore.js           # Senkron profil Ã¶nbelleÄŸi
â”‚   â”œâ”€â”€ contactsService.js        # KiÅŸi Supabase CRUD
â”‚   â”œâ”€â”€ contactsStore.js          # In-memory kiÅŸi Ã¶nbelleÄŸi
â”‚   â”œâ”€â”€ provinces.js              # TÃ¼rkiye il listesi
â”‚   â””â”€â”€ placesService.js          # Google Places entegrasyonu
â”‚
â”œâ”€â”€ lib/
â”‚   â””â”€â”€ supabase.js               # Supabase istemcisi (SecureStore oturum adaptÃ¶rÃ¼)
â”‚
â”œâ”€â”€ navigation/
â”‚   â”œâ”€â”€ StackNavigator.js         # React Navigation yÄ±ÄŸÄ±n navigatÃ¶rÃ¼
â”‚   â””â”€â”€ tabOrder.js               # KaydÄ±rma navigasyonu sÄ±rasÄ± hesaplamasÄ±
â”‚
â””â”€â”€ server/                       # Yerel Node.js API sunucusu
    â”œâ”€â”€ src/
    â”‚   â”œâ”€â”€ index.js              # Express sunucusu â€” /vs30 ve /api/fault-distance
    â”‚   â””â”€â”€ data/
    â”‚       â””â”€â”€ gem_active_faults.geojson  # GEM kÃ¼resel fay veri seti
    â””â”€â”€ global_vs30.grd           # USGS kÃ¼resel VS30 raster veri seti
```

---

## Kurulum

### Gereksinimler

- Node.js 18+
- npm
- Expo Go uygulamasÄ± (iOS / Android) veya fiziksel/sanal cihaz

### AdÄ±mlar

```bash
# BaÄŸÄ±mlÄ±lÄ±klarÄ± yÃ¼kle
npm install

# .env dosyasÄ±nÄ± oluÅŸtur (aÅŸaÄŸÄ±daki deÄŸiÅŸkenleri doldur)
cp .env.example .env   # veya manuel oluÅŸtur

# UygulamayÄ± baÅŸlat
npx expo start
```

Expo Go uygulamasÄ±yla terminal veya tarayÄ±cÄ±da gÃ¶sterilen QR kodu okutun. Uygulama ve cihazÄ±n **aynÄ± Wi-Fi aÄŸÄ±nda** olmasÄ± gerekir.

---

## Ortam DeÄŸiÅŸkenleri (.env)

`.env` dosyasÄ±nÄ± proje kÃ¶kÃ¼nde oluÅŸturun:

```env
# Harita â€” Google Maps (isteÄŸe baÄŸlÄ±, yoksa varsayÄ±lan harita kullanÄ±lÄ±r)
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key


# Yerel VS30 / Fay sunucusu â€” bilgisayarÄ±nÄ±zÄ±n yerel IP adresi
# Windows: ipconfig â†’ "IPv4 Address" deÄŸerini kullanÄ±n
EXPO_PUBLIC_VS30_API_BASE=http://192.168.1.xxx:4000
EXPO_PUBLIC_MAP_API_BASE=http://192.168.1.xxx:4000
EXPO_PUBLIC_API_BASE=http://192.168.1.xxx:4000

# Supabase
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```

> **Not:** IP adresi aÄŸ deÄŸiÅŸtiÄŸinde deÄŸiÅŸebilir. `ipconfig` (Windows) veya `ifconfig` (Mac/Linux) ile gÃ¼ncel IP'yi kontrol edin ve `.env`'yi gÃ¼ncelleyip Expo'yu yeniden baÅŸlatÄ±n.

---

## Supabase Kurulumu

### 1. Proje OluÅŸturma

[supabase.com](https://supabase.com) â†’ New Project â†’ proje adÄ± ve bÃ¶lge seÃ§in.

### 2. TablolarÄ± OluÅŸturma

Supabase Dashboard â†’ SQL Editor'de aÅŸaÄŸÄ±daki SQL'i Ã§alÄ±ÅŸtÄ±rÄ±n:

```sql
-- KullanÄ±cÄ± profilleri
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  surname TEXT,
  age INTEGER,
  address TEXT,
  city TEXT DEFAULT 'Ä°stanbul',
  threshold NUMERIC DEFAULT 3.0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Acil durum kiÅŸileri
CREATE TABLE emergency_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  relation TEXT,
  phone TEXT,
  email TEXT,
  closeness TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "KullanÄ±cÄ± kendi profilini yÃ¶netir" ON profiles
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "KullanÄ±cÄ± kendi kiÅŸilerini yÃ¶netir" ON emergency_contacts
  FOR ALL USING (auth.uid() = user_id);
```

### 3. Anonim Kimlik DoÄŸrulamayÄ± AktifleÅŸtirme

Supabase Dashboard â†’ Authentication â†’ Providers â†’ **Anonymous** â†’ Enable.

### 4. Credentials

Dashboard â†’ Project Settings â†’ API:
- **Project URL** â†’ `EXPO_PUBLIC_SUPABASE_URL`
- **anon / public key** â†’ `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

---

## VS30 / Fay Analizi Sunucusu

Harita ekranÄ±ndaki zemin sÄ±nÄ±fÄ± ve fay uzaklÄ±ÄŸÄ± analizleri iÃ§in yerel bir Node.js sunucusu gereklidir.

### Gerekli Veri DosyalarÄ±

| Dosya | Boyut | Kaynak |
|---|---|---|
| `server/global_vs30.grd` | ~200 MB | [USGS VS30 Veri Seti](https://earthquake.usgs.gov/data/vs30/) |
| `server/src/data/gem_active_faults.geojson` | ~10 MB | [GEM Foundation](https://github.com/GEMScienceTools/gem-global-active-faults) |

### Sunucuyu BaÅŸlatma

```bash
cd d:\deprem\server
npm install
node src/index.js       # veya: npm run dev (nodemon ile)
```

Sunucu `http://localhost:4000` adresinde baÅŸlar.

### API UÃ§ NoktalarÄ±

```
GET /health
â†’ { ok: true, now: "..." }

GET /api/earthquakes?country=IT&lookbackDays=2&minMagnitude=1.2
â†’ { events: [...], sourceMeta: [...], attribution: [...] }

POST /api/safe-spot/analyze
-> { summary: "...", safeZones: [...], risks: [...] }

GET /vs30?lat=41.01&lon=28.97
â†’ { vs30: 360, soilClass: "C", lat: 41.01, lon: 28.97 }

GET /api/fault-distance?lat=41.01&lon=28.97
â†’ { distance_km: 12.4, proximity_score: 88, level: "YÃ¼ksek" }
```

> **Ã–nemli:** Sunucu yalnÄ±zca bilgisayarÄ±nÄ±zda Ã§alÄ±ÅŸÄ±r. Mobil cihazÄ±n sunucuya ulaÅŸabilmesi iÃ§in her ikisinin de aynÄ± yerel aÄŸda olmasÄ± gerekir. `.env`'deki IP'nin bilgisayarÄ±nÄ±zÄ±n yerel IP'siyle eÅŸleÅŸtiÄŸini kontrol edin.

---

## Ekranlar ve ModÃ¼ller

### Ana Ekran (`HomeScreen`)

- Son 48 saatteki depremleri USGS'den Ã§eker (M1.2+)
- En fazla 3 olay gÃ¶sterir; "Daha fazla gÃ¶ster" ile Deprem GeÃ§miÅŸi'ne yÃ¶nlendirir
- HÄ±zlÄ± iÅŸlem butonlarÄ±: GÃ¼venli Alan Analizi, Acil Durum, Acil Durum KiÅŸileri
- Pull-to-refresh desteÄŸi

### Deprem GeÃ§miÅŸi (`EarthquakeFeedScreen`)

- Åehir filtresi veya "TÃ¼m Åehirler" seÃ§eneÄŸi
- Son 2 gÃ¼nlÃ¼k M1.2+ deprem listesi (USGS + Kandilli + IRIS)
- 10'ar kayÄ±t sayfalama: "Daha Fazla GÃ¶ster (X kaldÄ±)" butonu
- Ã–nbellek: 60 saniye TTL â€” gereksiz API Ã§aÄŸrÄ±larÄ± engellenir

### Harita Gezgini (`MapExplorerScreen`)

- `react-native-maps` ile interaktif harita (iOS/Android native, Web destekli deÄŸil)
- Haritaya **uzun basarak** zemin ve fay analizi baÅŸlatÄ±lÄ±r
- **VS30 Zemin KartÄ±:** Vs30 deÄŸeri (m/s), zemin sÄ±nÄ±fÄ± (Aâ€“E), deprem risk yorumu
- **Fay YakÄ±nlÄ±k KartÄ±:** En yakÄ±n aktif faya km cinsinden mesafe ve risk seviyesi
- Konum izni verildiÄŸinde kullanÄ±cÄ±nÄ±n konumuna odaklanÄ±r; verilmediÄŸinde haritada manuel gezinme mÃ¼mkÃ¼ndÃ¼r

### GÃ¼venli Alan Analizi (`SafeSpotScreen`)

- Kamera veya galeriden fotoÄŸraf seÃ§ilir
- **OpenAI GPT-4o** ile fotoÄŸraf analiz edilir
- GÃ¼venli alanlar (yeÅŸil kutu) ve riskli bÃ¶lgeler (kÄ±rmÄ±zÄ± kutu) gÃ¶rsel olarak iÅŸaretlenir
- Her alan iÃ§in gÃ¼ven yÃ¼zdesi ve rehberlik metni gÃ¶sterilir
- AI eriÅŸilemezse Ã¶rnek tavsiyeler gÃ¶sterilir

### Acil Durum (`EmergencyStatusScreen`)

- Deprem anÄ± iÃ§in 6 adÄ±mlÄ± panik protokolÃ¼ (Ã¶nemli ifadeler vurgulanmÄ±ÅŸ)
- "YardÄ±ma ihtiyacÄ±m var" butonu â†’ Alert ekranÄ±na yÃ¶nlendirir

### Acil Durum UyarÄ±sÄ± (`AlertScreen`)

- Durum rozeti (seÃ§ilen acil durum statÃ¼sÃ¼)
- Acil hatlar: **AFAD 122**, **112 Acil**, **Alo Deprem 184** â€” tek dokunuÅŸla arama
- **"YakÄ±nlarÄ±ma bildirim gÃ¶nder"** butonu â†’ WhatsApp modÃ¼lÃ¼nÃ¼ baÅŸlatÄ±r
- Birden fazla kiÅŸi varsa "SÄ±radaki kiÅŸi (2/3)" butonu ile sÄ±rayla her birine mesaj gÃ¶nderilir

### Acil Durum KiÅŸileri (`ContactsScreen`)

- Supabase'e kayÄ±tlÄ± kiÅŸiler listelenir
- Yeni kiÅŸi formu: Ad, Ä°liÅŸki, Telefon (+90 formatÄ±), E-posta, YakÄ±nlÄ±k derecesi
- KiÅŸi silme desteÄŸi
- NasÄ±l Ã§alÄ±ÅŸÄ±r bilgi kartÄ±

### Profil (`ProfileScreen`)

- **GÃ¶rÃ¼ntÃ¼leme modu:** Ad, yaÅŸ, ÅŸehir, adres, bildirim eÅŸiÄŸi satÄ±r satÄ±r gÃ¶sterilir
- **DÃ¼zenleme modu:** "DÃ¼zenle" butonuyla aktifleÅŸir, "VazgeÃ§" ile iptal edilir
- Bildirim eÅŸiÄŸi seÃ§imi: M1.0 / M2.0 / M3.0 / M4.0 / M5.0 chip'ler
- Profil Supabase'e kaydedilir; uygulama aÃ§Ä±ldÄ±ÄŸÄ±nda otomatik yÃ¼klenir

---

## Veri KaynaklarÄ±

### USGS Real-Time Feed

Uygulama, USGS'nin her dakika gÃ¼ncellenen GeoJSON akÄ±ÅŸlarÄ±nÄ± kullanÄ±r:

| AkÄ±ÅŸ | EÅŸik | URL |
|---|---|---|
| `all_week` | M1.2+ | `earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson` |
| `2.5_week` | M2.5+ | `earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_week.geojson` |
| `4.5_week` | M4.5+ | `earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_week.geojson` |

EÅŸik deÄŸerine gÃ¶re en uygun akÄ±ÅŸ otomatik seÃ§ilir.

### Kandilli Rasathanesi

`http://www.koeri.boun.edu.tr/` â€” TÃ¼rkiye'ye Ã¶zgÃ¼ deprem verileri. DÃ¼z metin formatÄ±nda parse edilir.

### IRIS (Incorporated Research Institutions for Seismology)

`https://service.iris.edu/fdsnws/event/1/` â€” FDSN standart web servisi. KÃ¼resel kapsam.

### Ã–nbellekleme

TÃ¼m kaynaklar 60 saniyelik TTL ile Ã¶nbelleÄŸe alÄ±nÄ±r. AynÄ± parametrelerle 60 saniye iÃ§inde yapÄ±lan istekler API'ye gitmez.

---

## Bildirim Sistemi

Uygulama iÃ§i push bildirimleri `expo-notifications` ile yÃ¶netilir.

- Uygulama ilk aÃ§Ä±ldÄ±ÄŸÄ±nda bildirim izni istenir
- Android'de `earthquake-alerts` kanalÄ± oluÅŸturulur (maksimum Ã¶nem, titreÅŸim, kilit ekranÄ±nda gÃ¶rÃ¼nÃ¼r)
- Deprem eÅŸiÄŸi (profilde seÃ§ilen M deÄŸeri) aÅŸÄ±ldÄ±ÄŸÄ±nda bildirim tetiklenir
- AynÄ± deprem iÃ§in birden fazla bildirim gÃ¶nderilmez (tekilleÅŸtirme)

> **Not:** Expo Go'da remote (uzak) push bildirimleri desteklenmez. Yerel (uygulama iÃ§i) bildirimler Ã§alÄ±ÅŸÄ±r. Tam push bildirim desteÄŸi iÃ§in development build gereklidir.

---

## WhatsApp Bildirim ModÃ¼lÃ¼

Acil durumda kayÄ±tlÄ± kiÅŸilere WhatsApp mesajÄ± gÃ¶nderilir.

### Ã‡alÄ±ÅŸma MantÄ±ÄŸÄ±

1. "YakÄ±nlarÄ±ma bildirim gÃ¶nder" butonuna basÄ±lÄ±r
2. Supabase'den kayÄ±tlÄ± acil durum kiÅŸileri Ã§ekilir
3. Konum izni varsa mevcut GPS koordinatlarÄ± alÄ±nÄ±r, yoksa "Konum izni verilmedi" yazÄ±lÄ±r
4. Her kiÅŸi iÃ§in ÅŸu formatta mesaj oluÅŸturulur:
   ```
   [Ad Soyad] [tarih/saat] saatinde acil durumda ve sizden yardÄ±m bekliyor.
   Konum: 41.01234, 28.97500 (https://maps.google.com/?q=41.01234,28.97500)
   ```
5. Ä°lk kiÅŸi iÃ§in `whatsapp://send?phone=90xxxxxxxxxx&text=...` deep link'i aÃ§Ä±lÄ±r
6. KullanÄ±cÄ± WhatsApp'ta "GÃ¶nder"e basar â†’ uygulamaya dÃ¶ner â†’ "SÄ±radaki kiÅŸi" butonuyla devam eder

### Teknik Notlar

- WhatsApp kurulu deÄŸilse `https://api.whatsapp.com/send?...` web fallback'i kullanÄ±lÄ±r
- Telefon numaralarÄ± otomatik `905xxxxxxxxx` formatÄ±na dÃ¶nÃ¼ÅŸtÃ¼rÃ¼lÃ¼r
- iOS'ta `whatsapp` scheme iÃ§in `app.json`'da `LSApplicationQueriesSchemes` tanÄ±mlÄ±dÄ±r
- Uygulama mesajÄ± otomatik **gÃ¶nderemez** â€” WhatsApp'Ä± aÃ§Ä±p hazÄ±r getirir, kullanÄ±cÄ± onaylar

---

## Kimlik DoÄŸrulama

Uygulama, oturum aÃ§ma formu gerektirmeyen **anonim kimlik doÄŸrulama** kullanÄ±r:

1. Uygulama aÃ§Ä±lÄ±rken `initAuth()` Ã§aÄŸrÄ±lÄ±r
2. Mevcut oturum varsa kullanÄ±lÄ±r
3. Oturum yoksa Supabase `signInAnonymously()` ile yeni anonim kullanÄ±cÄ± oluÅŸturulur
4. Oturum `expo-secure-store` ile cihazda ÅŸifreli olarak saklanÄ±r (AsyncStorage yerine â€” Expo Go uyumlu)
5. TÃ¼m Supabase tablolarÄ±nda RLS (Row Level Security) aktiftir; kullanÄ±cÄ±lar yalnÄ±zca kendi verilerine eriÅŸebilir

---

## Notlar ve KÄ±sÄ±tlamalar

- **Sunucu gerekliliÄŸi:** VS30 zemin ve fay analizi iÃ§in `server/` dizinindeki Node.js sunucusunun Ã§alÄ±ÅŸÄ±yor olmasÄ± gerekir. Sunucu kapalÄ±ysa harita ekranÄ± zaman aÅŸÄ±mÄ±na uÄŸrar.
- **Yerel aÄŸ:** Mobil cihaz ve sunucu bilgisayarÄ± aynÄ± Wi-Fi aÄŸÄ±nda olmalÄ±dÄ±r. FarklÄ± aÄŸdaysa `.env`'deki IP gÃ¼ncellenmeli ve Expo yeniden baÅŸlatÄ±lmalÄ±dÄ±r.
- **Expo Go kÄ±sÄ±tlamalarÄ±:** Remote push bildirimleri Expo Go'da Ã§alÄ±ÅŸmaz (SDK 53+). Tam bildirim desteÄŸi iÃ§in `expo run:android` veya `expo run:ios` ile development build oluÅŸturun.
- **OpenAI API:** GÃ¼venli alan analizi Ã¼cretli OpenAI API'sini kullanÄ±r. Anahtar yoksa veya limit doluysa Ã¶rnek tavsiyeler gÃ¶sterilir.
- **Deprem verileri sorumluluk reddi:** USGS, Kandilli ve IRIS verileri bilgilendirme amaÃ§lÄ±dÄ±r. Kritik kararlar iÃ§in resmi AFAD duyurularÄ±nÄ± ve yerel yÃ¶netim bildirimlerini takip edin.


