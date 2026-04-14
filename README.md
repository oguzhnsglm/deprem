# Deprem Rehberi

Deprem Rehberi, React Native (Expo) tabanlı bir mobil uygulamadır. Gerçek zamanlı deprem verilerini takip etmenizi, zemin ve fay analizi yapmanızı, güvenli alan tespiti için AI destekli fotoğraf analizi kullanmanızı ve acil durumda yakınlarınıza anında bildirim göndermenizi sağlar.

---

## İçindekiler

- [Özellikler](#özellikler)
- [Mimari](#mimari)
- [Kurulum](#kurulum)
- [Ortam Değişkenleri (.env)](#ortam-değişkenleri-env)
- [Supabase Kurulumu](#supabase-kurulumu)
- [VS30 / Fay Analizi Sunucusu](#vs30--fay-analizi-sunucusu)
- [Ekranlar ve Modüller](#ekranlar-ve-modüller)
- [Veri Kaynakları](#veri-kaynakları)
- [Bildirim Sistemi](#bildirim-sistemi)
- [WhatsApp Bildirim Modülü](#whatsapp-bildirim-modülü)
- [Notlar ve Kısıtlamalar](#notlar-ve-kısıtlamalar)

---

## Özellikler

| Özellik | Açıklama |
|---|---|
| Gerçek zamanlı deprem akışı | USGS, Kandilli, IRIS kaynaklarından 2 dakikada bir güncellenen veri |
| Zemin analizi (VS30) | Haritada uzun basılan noktanın zemin sınıfını ve deprem ivmesi risk bilgisini gösterir |
| Fay uzaklığı | GEM küresel fay veri tabanına göre seçilen noktanın en yakın aktif faya mesafesi |
| AI güvenli alan analizi | Kamera veya galeriden çekilen fotoğrafı OpenAI GPT-4o ile analiz ederek güvenli/riskli bölgeleri işaretler |
| Acil durum yönetimi | Panik adımları, acil numaralar ve WhatsApp üzerinden yakın bildirimi |
| Profil ve bildirim eşiği | Kullanıcı adı, şehir ve magnitude eşiği Supabase'de saklanır; eşik aşıldığında uygulama içi bildirim gelir |
| Acil durum kişileri | Supabase'e kaydedilen kişiler acil durumda WhatsApp üzerinden sırayla bilgilendirilir |
| Kaydırma navigasyonu | Ekranlar arasında yatay kaydırma ile geçiş yapılabilir |

---

## Mimari

```
deprem/
├── App.js                        # Uygulama kök bileşeni, auth başlatma
├── app.json                      # Expo konfigürasyonu
├── .env                          # Ortam değişkenleri (git'e dahil değil)
│
├── screens/                      # Ekran bileşenleri
│   ├── HomeScreen.js             # Ana ekran — son depremler + hızlı işlemler
│   ├── EarthquakeFeedScreen.js   # Deprem geçmişi listesi + sayfalama
│   ├── MapExplorerScreen.js      # Harita + VS30 + fay analizi
│   ├── SafeSpotScreen.js         # AI destekli güvenli alan analizi
│   ├── EmergencyStatusScreen.js  # Panik adımları ekranı
│   ├── AlertScreen.js            # Acil durum durumu + WhatsApp bildirimi
│   ├── ContactsScreen.js         # Acil durum kişileri yönetimi
│   └── ProfileScreen.js          # Profil görüntüleme ve düzenleme
│
├── components/                   # Yeniden kullanılabilir UI bileşenleri
│   ├── BottomNavBar.js           # Alt navigasyon çubuğu
│   ├── ScreenWrapper.js          # Ortak ekran sarmalayıcısı
│   ├── PrimaryButton.js          # Birincil buton bileşeni
│   ├── ContactCard.js            # Kişi kartı bileşeni
│   └── SafeSpotAdvice.js         # Güvenli alan tavsiye kartı
│
├── logic/                        # İş mantığı ve servisler
│   ├── earthquakeSources.js      # USGS/Kandilli/IRIS veri çekme + önbellekleme
│   ├── safeSpotAnalyzer.js       # OpenAI GPT-4o ile fotoğraf analizi
│   ├── notificationService.js    # Uygulama içi bildirim yönetimi
│   ├── authStore.js              # Supabase anonim kimlik doğrulama
│   ├── profileService.js         # Profil Supabase CRUD
│   ├── profileStore.js           # Senkron profil önbelleği
│   ├── contactsService.js        # Kişi Supabase CRUD
│   ├── contactsStore.js          # In-memory kişi önbelleği
│   ├── provinces.js              # Türkiye il listesi
│   └── placesService.js          # Google Places entegrasyonu
│
├── lib/
│   └── supabase.js               # Supabase istemcisi (SecureStore oturum adaptörü)
│
├── navigation/
│   ├── StackNavigator.js         # React Navigation yığın navigatörü
│   └── tabOrder.js               # Kaydırma navigasyonu sırası hesaplaması
│
└── server/                       # Yerel Node.js API sunucusu
    ├── src/
    │   ├── index.js              # Express sunucusu — /vs30 ve /api/fault-distance
    │   └── data/
    │       └── gem_active_faults.geojson  # GEM küresel fay veri seti
    └── global_vs30.grd           # USGS küresel VS30 raster veri seti
```

---

## Kurulum

### Gereksinimler

- Node.js 18+
- npm
- Expo Go uygulaması (iOS / Android) veya fiziksel/sanal cihaz

### Adımlar

```bash
# Bağımlılıkları yükle
npm install

# .env dosyasını oluştur (aşağıdaki değişkenleri doldur)
cp .env.example .env   # veya manuel oluştur

# Uygulamayı başlat
npx expo start
```

Expo Go uygulamasıyla terminal veya tarayıcıda gösterilen QR kodu okutun. Uygulama ve cihazın **aynı Wi-Fi ağında** olması gerekir.

---

## Ortam Değişkenleri (.env)

`.env` dosyasını proje kökünde oluşturun:

```env
# Harita — Google Maps (isteğe bağlı, yoksa varsayılan harita kullanılır)
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# AI Güvenli Alan Analizi — OpenAI
EXPO_PUBLIC_OPENAI_API_KEY=your_openai_api_key

# Yerel VS30 / Fay sunucusu — bilgisayarınızın yerel IP adresi
# Windows: ipconfig → "IPv4 Address" değerini kullanın
EXPO_PUBLIC_VS30_API_BASE=http://192.168.1.xxx:4000
EXPO_PUBLIC_API_BASE=http://192.168.1.xxx:4000

# Supabase
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```

> **Not:** IP adresi ağ değiştiğinde değişebilir. `ipconfig` (Windows) veya `ifconfig` (Mac/Linux) ile güncel IP'yi kontrol edin ve `.env`'yi güncelleyip Expo'yu yeniden başlatın.

---

## Supabase Kurulumu

### 1. Proje Oluşturma

[supabase.com](https://supabase.com) → New Project → proje adı ve bölge seçin.

### 2. Tabloları Oluşturma

Supabase Dashboard → SQL Editor'de aşağıdaki SQL'i çalıştırın:

```sql
-- Kullanıcı profilleri
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  surname TEXT,
  age INTEGER,
  address TEXT,
  city TEXT DEFAULT 'İstanbul',
  threshold NUMERIC DEFAULT 3.0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Acil durum kişileri
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

CREATE POLICY "Kullanıcı kendi profilini yönetir" ON profiles
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "Kullanıcı kendi kişilerini yönetir" ON emergency_contacts
  FOR ALL USING (auth.uid() = user_id);
```

### 3. Anonim Kimlik Doğrulamayı Aktifleştirme

Supabase Dashboard → Authentication → Providers → **Anonymous** → Enable.

### 4. Credentials

Dashboard → Project Settings → API:
- **Project URL** → `EXPO_PUBLIC_SUPABASE_URL`
- **anon / public key** → `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

---

## VS30 / Fay Analizi Sunucusu

Harita ekranındaki zemin sınıfı ve fay uzaklığı analizleri için yerel bir Node.js sunucusu gereklidir.

### Gerekli Veri Dosyaları

| Dosya | Boyut | Kaynak |
|---|---|---|
| `server/global_vs30.grd` | ~200 MB | [USGS VS30 Veri Seti](https://earthquake.usgs.gov/data/vs30/) |
| `server/src/data/gem_active_faults.geojson` | ~10 MB | [GEM Foundation](https://github.com/GEMScienceTools/gem-global-active-faults) |

### Sunucuyu Başlatma

```bash
cd server
npm install
node src/index.js       # veya: npm run dev (nodemon ile)
```

Sunucu `http://localhost:4000` adresinde başlar.

### API Uç Noktaları

```
GET /vs30?lat=41.01&lon=28.97
→ { vs30: 360, soilClass: "C", lat: 41.01, lon: 28.97 }

GET /api/fault-distance?lat=41.01&lon=28.97
→ { distance_km: 12.4, proximity_score: 88, level: "Yüksek" }
```

> **Önemli:** Sunucu yalnızca bilgisayarınızda çalışır. Mobil cihazın sunucuya ulaşabilmesi için her ikisinin de aynı yerel ağda olması gerekir. `.env`'deki IP'nin bilgisayarınızın yerel IP'siyle eşleştiğini kontrol edin.

---

## Ekranlar ve Modüller

### Ana Ekran (`HomeScreen`)

- Son 48 saatteki depremleri USGS'den çeker (M1.2+)
- En fazla 3 olay gösterir; "Daha fazla göster" ile Deprem Geçmişi'ne yönlendirir
- Hızlı işlem butonları: Güvenli Alan Analizi, Acil Durum, Acil Durum Kişileri
- Pull-to-refresh desteği

### Deprem Geçmişi (`EarthquakeFeedScreen`)

- Şehir filtresi veya "Tüm Şehirler" seçeneği
- Son 2 günlük M1.2+ deprem listesi (USGS + Kandilli + IRIS)
- 10'ar kayıt sayfalama: "Daha Fazla Göster (X kaldı)" butonu
- Önbellek: 60 saniye TTL — gereksiz API çağrıları engellenir

### Harita Gezgini (`MapExplorerScreen`)

- `react-native-maps` ile interaktif harita (iOS/Android native, Web destekli değil)
- Haritaya **uzun basarak** zemin ve fay analizi başlatılır
- **VS30 Zemin Kartı:** Vs30 değeri (m/s), zemin sınıfı (A–E), deprem risk yorumu
- **Fay Yakınlık Kartı:** En yakın aktif faya km cinsinden mesafe ve risk seviyesi
- Konum izni verildiğinde kullanıcının konumuna odaklanır; verilmediğinde haritada manuel gezinme mümkündür

### Güvenli Alan Analizi (`SafeSpotScreen`)

- Kamera veya galeriden fotoğraf seçilir
- **OpenAI GPT-4o** ile fotoğraf analiz edilir
- Güvenli alanlar (yeşil kutu) ve riskli bölgeler (kırmızı kutu) görsel olarak işaretlenir
- Her alan için güven yüzdesi ve rehberlik metni gösterilir
- AI erişilemezse örnek tavsiyeler gösterilir

### Acil Durum (`EmergencyStatusScreen`)

- Deprem anı için 6 adımlı panik protokolü (önemli ifadeler vurgulanmış)
- "Yardıma ihtiyacım var" butonu → Alert ekranına yönlendirir

### Acil Durum Uyarısı (`AlertScreen`)

- Durum rozeti (seçilen acil durum statüsü)
- Acil hatlar: **AFAD 122**, **112 Acil**, **Alo Deprem 184** — tek dokunuşla arama
- **"Yakınlarıma bildirim gönder"** butonu → WhatsApp modülünü başlatır
- Birden fazla kişi varsa "Sıradaki kişi (2/3)" butonu ile sırayla her birine mesaj gönderilir

### Acil Durum Kişileri (`ContactsScreen`)

- Supabase'e kayıtlı kişiler listelenir
- Yeni kişi formu: Ad, İlişki, Telefon (+90 formatı), E-posta, Yakınlık derecesi
- Kişi silme desteği
- Nasıl çalışır bilgi kartı

### Profil (`ProfileScreen`)

- **Görüntüleme modu:** Ad, yaş, şehir, adres, bildirim eşiği satır satır gösterilir
- **Düzenleme modu:** "Düzenle" butonuyla aktifleşir, "Vazgeç" ile iptal edilir
- Bildirim eşiği seçimi: M1.0 / M2.0 / M3.0 / M4.0 / M5.0 chip'ler
- Profil Supabase'e kaydedilir; uygulama açıldığında otomatik yüklenir

---

## Veri Kaynakları

### USGS Real-Time Feed

Uygulama, USGS'nin her dakika güncellenen GeoJSON akışlarını kullanır:

| Akış | Eşik | URL |
|---|---|---|
| `all_week` | M1.2+ | `earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson` |
| `2.5_week` | M2.5+ | `earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_week.geojson` |
| `4.5_week` | M4.5+ | `earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_week.geojson` |

Eşik değerine göre en uygun akış otomatik seçilir.

### Kandilli Rasathanesi

`http://www.koeri.boun.edu.tr/` — Türkiye'ye özgü deprem verileri. Düz metin formatında parse edilir.

### IRIS (Incorporated Research Institutions for Seismology)

`https://service.iris.edu/fdsnws/event/1/` — FDSN standart web servisi. Küresel kapsam.

### Önbellekleme

Tüm kaynaklar 60 saniyelik TTL ile önbelleğe alınır. Aynı parametrelerle 60 saniye içinde yapılan istekler API'ye gitmez.

---

## Bildirim Sistemi

Uygulama içi push bildirimleri `expo-notifications` ile yönetilir.

- Uygulama ilk açıldığında bildirim izni istenir
- Android'de `earthquake-alerts` kanalı oluşturulur (maksimum önem, titreşim, kilit ekranında görünür)
- Deprem eşiği (profilde seçilen M değeri) aşıldığında bildirim tetiklenir
- Aynı deprem için birden fazla bildirim gönderilmez (tekilleştirme)

> **Not:** Expo Go'da remote (uzak) push bildirimleri desteklenmez. Yerel (uygulama içi) bildirimler çalışır. Tam push bildirim desteği için development build gereklidir.

---

## WhatsApp Bildirim Modülü

Acil durumda kayıtlı kişilere WhatsApp mesajı gönderilir.

### Çalışma Mantığı

1. "Yakınlarıma bildirim gönder" butonuna basılır
2. Supabase'den kayıtlı acil durum kişileri çekilir
3. Konum izni varsa mevcut GPS koordinatları alınır, yoksa "Konum izni verilmedi" yazılır
4. Her kişi için şu formatta mesaj oluşturulur:
   ```
   [Ad Soyad] [tarih/saat] saatinde acil durumda ve sizden yardım bekliyor.
   Konum: 41.01234, 28.97500 (https://maps.google.com/?q=41.01234,28.97500)
   ```
5. İlk kişi için `whatsapp://send?phone=90xxxxxxxxxx&text=...` deep link'i açılır
6. Kullanıcı WhatsApp'ta "Gönder"e basar → uygulamaya döner → "Sıradaki kişi" butonuyla devam eder

### Teknik Notlar

- WhatsApp kurulu değilse `https://api.whatsapp.com/send?...` web fallback'i kullanılır
- Telefon numaraları otomatik `905xxxxxxxxx` formatına dönüştürülür
- iOS'ta `whatsapp` scheme için `app.json`'da `LSApplicationQueriesSchemes` tanımlıdır
- Uygulama mesajı otomatik **gönderemez** — WhatsApp'ı açıp hazır getirir, kullanıcı onaylar

---

## Kimlik Doğrulama

Uygulama, oturum açma formu gerektirmeyen **anonim kimlik doğrulama** kullanır:

1. Uygulama açılırken `initAuth()` çağrılır
2. Mevcut oturum varsa kullanılır
3. Oturum yoksa Supabase `signInAnonymously()` ile yeni anonim kullanıcı oluşturulur
4. Oturum `expo-secure-store` ile cihazda şifreli olarak saklanır (AsyncStorage yerine — Expo Go uyumlu)
5. Tüm Supabase tablolarında RLS (Row Level Security) aktiftir; kullanıcılar yalnızca kendi verilerine erişebilir

---

## Notlar ve Kısıtlamalar

- **Sunucu gerekliliği:** VS30 zemin ve fay analizi için `server/` dizinindeki Node.js sunucusunun çalışıyor olması gerekir. Sunucu kapalıysa harita ekranı zaman aşımına uğrar.
- **Yerel ağ:** Mobil cihaz ve sunucu bilgisayarı aynı Wi-Fi ağında olmalıdır. Farklı ağdaysa `.env`'deki IP güncellenmeli ve Expo yeniden başlatılmalıdır.
- **Expo Go kısıtlamaları:** Remote push bildirimleri Expo Go'da çalışmaz (SDK 53+). Tam bildirim desteği için `expo run:android` veya `expo run:ios` ile development build oluşturun.
- **OpenAI API:** Güvenli alan analizi ücretli OpenAI API'sini kullanır. Anahtar yoksa veya limit doluysa örnek tavsiyeler gösterilir.
- **Deprem verileri sorumluluk reddi:** USGS, Kandilli ve IRIS verileri bilgilendirme amaçlıdır. Kritik kararlar için resmi AFAD duyurularını ve yerel yönetim bildirimlerini takip edin.
