# Sismik Risk Hesaplama Yaklaşımı

## Genel Mimari

İki bağımsız veri kaynağı birleştirilerek sismik risk skoru üretilir:

1. **GEM Küresel Tehlike Haritası** (ana kaynak)
2. **Aktif Fay Kataloğu** (destekleyici, GEM skorunu ayarlar)

---

## 1. GEM Skoru (Temel)

**Kaynak:** GEM (Global Earthquake Model) GeoTIFF — 475 yıl dönüş periyodunda kaya zemini üzerinde beklenen tepe yer ivmesi (PGA, g cinsinden).

**Normalizasyon:**
```
gemScore = 100 × ln(1 + pga) / ln(1.8)
```
- PGA = 0 → skor = 0
- PGA = 0.8g → skor ≈ 100

**Not:** GEM skoru referans kaya zemini (Vs30 ≈ 760 m/s) baz alır; yerel zemin amplifikasyonunu içermez. Zemin sertliği (Vs30) ayrıca değerlendirilmelidir.

---

## 2. Fay Bileşeni

### Fay Seçimi

150 km yarıçap içindeki tüm aktif faylar taranır. Kayma hızı verisi olmayan faylar atlanır. En yüksek tehlike proxy değerine sahip fay seçilir:

```
decay_seçim = 20 + 20 × (slipRate / 23)
proxy        = (slipRate / 23) × exp(−dist / decay_seçim)
```

En yüksek `proxy` değerini veren fay, o konumun "baskın fayı" olarak belirlenir.

### Fay Skoru

Seçilen fay için bağımsız bir tehlike skoru hesaplanır:

```
decay      = 20 + slipRate          (km — kayma hızı büyükse etki alanı genişler)
faultProxy = (slipRate / 23) × exp(−dist / decay)
faultScore = 100 × (1 − exp(−faultProxy × 2))
```

| slipRate | dist  | decay | faultScore (yaklaşık) |
|----------|-------|-------|----------------------|
| 1 mm/yr  | 10 km | 21 km | 8                    |
| 10 mm/yr | 10 km | 30 km | 56                   |
| 23 mm/yr | 10 km | 43 km | 79                   |
| 35 mm/yr | 10 km | 55 km | 88                   |
| 23 mm/yr | 50 km | 43 km | 23                   |

---

## 3. Birleşik Sismik Risk Skoru

GEM skoru temel alınır; fay bileşeni, mesafe ve kayma hızına göre asimetrik biçimde ayarlar:

```
faultAdj = faultScore >= 50
  ? min(+12, (faultScore − 50) × 0.24)   // yüksek kayma hızı: max +12 puan
  : max(−20, (faultScore − 50) × 0.40)   // düşük kayma hızı:  max −20 puan

seismicRiskScore = clamp(0, 100, gemScore + faultAdj)
```

**Etki aralığı:**
- Yakın + güçlü fay (faultScore=100): **+12 puan**
- Uzak + zayıf fay (faultScore=0): **−20 puan**
- Nötr (faultScore=50): **0 puan** (GEM skoru değişmez)

**GEM verisi yoksa:** `seismicRiskScore = faultScore` (salt fay tabanlı)

---

## 4. Zemin Sertliği Kartı

Ham GEM skoru (`regional_hazard_score`) ayrıca zemin sertliği (Vs30) kartında gösterilir. Bu değer hiçbir ayarlama yapılmadan GeoTIFF'ten okunan ham değerdir.

---

## Skor Seviyeleri

| Skor    | Seviye      |
|---------|-------------|
| ≥ 80    | Çok Yüksek  |
| 60–79   | Yüksek      |
| 35–59   | Orta        |
| 15–34   | Düşük       |
| < 15    | Çok Düşük   |
