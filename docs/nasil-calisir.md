# Uygulama Nasıl Çalışır?

Bu belge uygulamanın deprem tehlike hesaplama mekanizmasını açıklar.

---

## 1. Sismik Risk Skoru Nedir?

Haritada bir noktaya uzun bastığında uygulama 0–100 arası bir **Sismik Risk Skoru** hesaplar.

Bu skor iki bileşenden oluşur:

| Bileşen | Ağırlık | Açıklama |
|---|---|---|
| Fay Skoru | %50 | En yakın aktif faya mesafe + kayma hızı |
| Bölgesel Tehlike Skoru | %50 | GEM küresel PGA haritasından renk okuma |

İkisi birlikte olmak üzere:
```
Sismik Risk = faultScore × 0.5 + tileScore × 0.5
```

Bölgesel tehlike verisi okunamazsa skor yalnızca fay bileşenine dayanır.

---

## 2. Fay Bileşeni Nasıl Hesaplanır?

### Veri kaynağı
**GEM Global Active Faults** veritabanı — 2023 güncel, ~15.000 segment, 118 ülke.
Yalnızca son 2,6 milyon yılda hareket etmiş (Kuaterner aktif) faylar dahil.

### Formül (PSHA-proxy)
Bilimsel temel: **yıllık sismik moment oranı ∝ kayma hızı**.
Yani kayma hızı ne kadar yüksekse, o fay o kadar sık deprem üretiyor.

```
activityRate = min(1.0,  slipRate / 23)        # NAF (23 mm/yıl) = 1.0 referans
decayKm      = 30 + 30 × activityRate          # 30 km (pasif) → 60 km (NAF)
distAtten    = exp(−distance / decayKm)        # mesafe zayıflaması
hazardProxy  = activityRate × distAtten

faultScore   = 100 × (1 − exp(−hazardProxy × 4))
             = minimum 3 (taban değer)
```

### Örnek değerler

| Konum | Kayma (mm/yıl) | Mesafe (km) | Fay Skoru |
|---|---|---|---|
| İstanbul (NAF) | 23 | 20 | ~94 |
| Dinar fayı | 3.7 | 1.7 | ~42 |
| Pasif yerel fay | 0.1 | 0.5 | ~3 |
| Konya (uzak, yavaş) | 0.5 | 40 | ~3 |

### Kayma hızı bilinmiyorsa
Veritabanında kayma hızı bulunmayan segmentler için varsayılan **1.0 mm/yıl** kullanılır.
Bu global aktif fay medyanının alt sınırıdır — muhafazakâr ama makul bir tahmin.

---

## 3. Bölgesel Tehlike Skoru Nedir?

### Veri kaynağı
**GEM Global Seismic Hazard Map 2023.1** — tam PSHA analizi.
- Dönüş periyodu: **475 yıl** (50 yılda %10 aşılma olasılığı — uluslararası yapı kodu standardı)
- Gösterge: **PGA** (Peak Ground Acceleration — tepe zemin ivmesi), referans kaya zeminde
- Renk skalası: açık mavi (düşük) → sarı → turuncu → kırmızı (çok yüksek)

### Nasıl okunuyor?
İndirilen tile PNG'lerinden ilgili pikselin RGB değeri okunur, renk → skor dönüşümü yapılır:

| Renk | Hue aralığı | Skor |
|---|---|---|
| Açık mavi | 190–260° | 3–20 |
| Teal/cyan | 150–190° | 8–25 |
| Yeşil | 80–150° | 12–30 |
| Sarı-yeşil | 55–80° | 28–50 |
| Sarı-turuncu | 35–55° | 48–70 |
| Turuncu | 15–35° | 65–85 |
| Kırmızı | <15° veya >330° | 78–100 |

Tile verisi yerel olarak `server/static/tiles/hazard/` klasöründen okunur — internet bağlantısı gerekmez.

---

## 4. Zemin Sertliği (Vs30) Nedir?

**Vs30**: Zeminin üst 30 metresindeki ortalama kayma dalgası hızı (m/s).

Deprem dalgaları yumuşak zeminlerde **büyür** — bu yüzden aynı deprem sert kayada az, alüvyon dolguda çok hasar yapabilir.

| Sınıf | Vs30 (m/s) | Zemin Tipi | Risk |
|---|---|---|---|
| A | ≥ 1500 | Çok sert kaya | Çok Düşük |
| B | 760–1500 | Sert kaya | Düşük |
| C | 360–760 | Orta sertlikte kaya | Orta |
| D | 180–360 | Yumuşak zemin | Yüksek |
| E | < 180 | Çok yumuşak/gevşek | Çok Yüksek |

**Kaynak:** USGS Global Vs30 grid (~2017), 1 km çözünürlük, topoğrafya bazlı tahmin.

---

## 5. Güvenli Alan Analizi (SafeSpot) Nasıl Çalışır?

Bir oda fotoğrafı çekilir → yapay zeka modeli (Gemini veya GPT-4o) görüntüyü analiz eder.

Model şu bilim temelli öncelik sırasını kullanır:
1. **Sağlam masa/tezgah altı** — dökülen molozdan korur
2. **Alçak koltuk/kanepe yanı** — çökme boşluğu yaratır
3. **İki iç duvar köşesi** — yapısal bütünlük
4. **Yapısal kolon yanı** — son çare

Model tehlikeli bölgeleri de işaretler: pencereler, sabitlenmemiş mobilyalar, tavan armatürleri, dış duvarlar.

Her önerilen bölge için piksel koordinatı döner → fotoğrafın üzerine kutucuk çizilir.

---

## 6. Veri Kaynakları Özeti

| Veri | Kaynak | Yıl | Lisans |
|---|---|---|---|
| Aktif fay geometrisi + kayma hızı | GEM Global Active Faults | 2023 | CC BY-SA 4.0 |
| Bölgesel PGA tehlike tile'ları | GEM Global Seismic Hazard Map | 2023 | CC BY-NC-SA 4.0 |
| Zemin sertliği (Vs30) | USGS Global Vs30 | ~2017 | Kamu domain |
| Deprem akışı | USGS, EMSC, AFAD, JMA ve diğerleri | Gerçek zamanlı | Açık API |
| Yapay zeka analizi | Google Gemini / OpenAI GPT-4o | — | Ticari API |

---

## 7. Kısıtlar ve Uyarılar

- Bu uygulama **bilgilendirme amaçlıdır**, resmi yapı kodu veya sigorta değerlendirmesi değildir.
- Kayma hızı ölçümleri bölgeye göre **±50% belirsizlik** taşıyabilir.
- Vs30 değerleri topoğrafya bazlı tahminden üretilmiştir — sondaj verisi değildir.
- Fay veritabanı bilinmeyen veya haritalanmamış fayları içermez.
- GEM tehlike haritası 2023 tarihlidir; güncel araştırmalarla farklılık gösterebilir.
