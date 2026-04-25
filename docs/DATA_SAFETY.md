# Data Safety & Privacy Labels — QuakeGuide

Bu dosya Google Play Console **Data Safety** formu ve Apple App Store Connect **Privacy Nutrition Labels** için hazırlanmış cevapları içerir. Form doldurulurken sırayla kullanın.

---

## GOOGLE PLAY — Data Safety

### Genel sorular
| Soru | Cevap |
|---|---|
| Does your app collect or share any of the required user data types? | **Yes** |
| Is all of the user data collected by your app encrypted in transit? | **Yes** (HTTPS server tarafında aktif) |
| Do you provide a way for users to request that their data is deleted? | **Yes** (`quakeguide.support@gmail.com` + uygulama içi silme) |

### Data types — toplanan veriler

#### 1. **Location → Approximate location**
- **Collected:** Yes
- **Shared:** No
- **Processing:** Processed ephemerally *(cihazda ve server'da canlı analiz için kullanılır, kalıcı kayıt yoktur)*
- **Optional / Required:** Optional
- **Purposes:** App functionality, Personalization
- **Why:** Haritada mevcut konumu göstermek, yakındaki depremleri listelemek.

#### 2. **Location → Precise location**
- **Collected:** Yes
- **Shared:** No
- **Processing:** Processed ephemerally
- **Optional / Required:** Optional
- **Purposes:** App functionality
- **Why:** Nokta bazlı Vs30 / fay / sismik risk analizi ve acil durum paylaşım metni.

#### 3. **Personal info → Name**
- **Collected:** Yes
- **Shared:** No
- **Optional / Required:** Optional
- **Purposes:** Account management
- **Why:** Profil ekranındaki ad-soyad alanı, acil mesaj taslağında imza.

#### 4. **Personal info → Email address**
- **Collected:** Yes
- **Shared:** No
- **Optional / Required:** Required *(hesap için)*
- **Purposes:** Account management
- **Why:** Supabase Authentication hesap tanımlayıcısı.

#### 5. **Personal info → Address**
- **Collected:** Yes
- **Shared:** No
- **Optional / Required:** Optional
- **Purposes:** Personalization
- **Why:** Kullanıcının tercih ettiği şehir/ülke deprem feed filtresi.

#### 6. **Personal info → Other info (age)**
- **Collected:** Yes
- **Shared:** No
- **Optional / Required:** Optional
- **Purposes:** Personalization

#### 7. **Contacts → Contacts**
- **Collected:** Yes *(yalnızca kullanıcının elle eklediği acil durum kişileri)*
- **Shared:** No
- **Optional / Required:** Optional
- **Purposes:** App functionality
- **Why:** Acil durum paylaşımı için kullanıcının eklediği isim/telefon/e-posta.

#### 8. **Photos and videos → Photos**
- **Collected:** Yes
- **Shared:** Yes → OpenAI API (Safe Spot analizi için)
- **Processing:** Processed ephemerally (OpenAI'e iletilir, kalıcı saklanmaz)
- **Optional / Required:** Optional
- **Purposes:** App functionality
- **Why:** Güvenli Alan Analizi AI modelinin odayı görmesi için.

#### 9. **App info and performance → Crash logs / Diagnostics**
- **Collected:** Yes
- **Shared:** No
- **Optional / Required:** Required
- **Purposes:** Analytics, Developer communications
- **Why:** Server hata ayıklama, güvenlik.

#### 10. **App activity → App interactions**
- **Collected:** No *(uygulama içi davranış tracking yok)*

#### 11. **Financial / Health / Messages / Files / Audio / Web browsing / Device IDs**
- **Collected:** No

### Data types **SHARED** with third parties
| Third party | What | Why |
|---|---|---|
| OpenAI | Photos (room photo) | Safe Spot AI analysis (server-side call, ephemeral) |
| Supabase | Profile, emergency contacts | Storage (RLS enforced) |

---

## APPLE — Privacy Nutrition Labels

Apple formu kategorilere göre ayrılmıştır. Aşağıda her kategori için cevaplar.

### Data Used to Track You
**None.** (Uygulama tracking yapmaz, third-party ad network yoktur.)

### Data Linked to You

#### Contact Info
- ✅ **Name** — App Functionality
- ✅ **Email Address** — App Functionality
- ✅ **Physical Address** — App Functionality, Personalization
- ❌ Phone Number *(kullanıcı kendi acil kişilerini girer ama uygulama sahibi kendi telefonunu saklamaz)*

#### User Content
- ✅ **Photos or Videos** — App Functionality (Safe Spot analizi)
- ❌ Audio / Gameplay / Other User Content

#### Identifiers
- ✅ **User ID** — App Functionality (Supabase)
- ❌ Device ID

#### Contacts
- ✅ **Contacts** — App Functionality (acil durum kişileri; kullanıcı elle ekler)

#### Location
- ✅ **Precise Location** — App Functionality
- ✅ **Coarse Location** — App Functionality

#### Diagnostics
- ✅ **Crash Data** — App Functionality
- ✅ **Performance Data** — App Functionality
- ❌ Other Diagnostic Data

### Data Not Linked to You
None additional.

### Data Not Collected
- Health & Fitness
- Financial Info
- Browsing History
- Search History
- Purchases
- Sensitive Info
- Audio
- Gameplay Content
- Customer Support
- Other User Content
- Advertising Data

---

## Özet tablosu (hızlı referans)

| Veri türü | Toplanır mı? | Paylaşılır mı? | Neden |
|---|---|---|---|
| Konum (precise + approximate) | Evet | Hayır | Harita, zemin/fay analizi |
| Ad, e-posta, adres | Evet | Hayır | Hesap, kişiselleştirme |
| Acil kişiler | Evet | Hayır | Acil paylaşım |
| Oda fotoğrafı | Evet | **Evet (OpenAI)** | Safe Spot analizi |
| Kullanıcı kimliği | Evet | Hayır | Supabase auth |
| Crash/diagnostik | Evet | Hayır | Hata ayıklama |
| Reklam verisi | **Hayır** | — | — |
| Cihaz ID / tracking | **Hayır** | — | — |
