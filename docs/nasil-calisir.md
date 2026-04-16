# Uygulama NasÄ±l Ã‡alÄ±ÅŸÄ±r?

Bu belge uygulamanÄ±n deprem tehlike hesaplama mekanizmasÄ±nÄ± aÃ§Ä±klar.

---

## 1. Sismik Risk Skoru Nedir?

Haritada bir noktaya uzun bastÄ±ÄŸÄ±nda uygulama 0â€“100 arasÄ± bir **Sismik Risk Skoru** hesaplar.

Bu skor iki bileÅŸenden oluÅŸur:

| BileÅŸen | AÄŸÄ±rlÄ±k | AÃ§Ä±klama |
|---|---|---|
| Fay Skoru | %50 | En yakÄ±n aktif faya mesafe + kayma hÄ±zÄ± |
| BÃ¶lgesel Tehlike Skoru | %50 | GEM kÃ¼resel PGA haritasÄ±ndan renk okuma |

Ä°kisi birlikte olmak Ã¼zere:
```
Sismik Risk = faultScore Ã— 0.5 + tileScore Ã— 0.5
```

BÃ¶lgesel tehlike verisi okunamazsa skor yalnÄ±zca fay bileÅŸenine dayanÄ±r.

---

## 2. Fay BileÅŸeni NasÄ±l HesaplanÄ±r?

### Veri kaynaÄŸÄ±
**GEM Global Active Faults** veritabanÄ± â€” 2023 gÃ¼ncel, ~15.000 segment, 118 Ã¼lke.
YalnÄ±zca son 2,6 milyon yÄ±lda hareket etmiÅŸ (Kuaterner aktif) faylar dahil.

### FormÃ¼l (PSHA-proxy)
Bilimsel temel: **yÄ±llÄ±k sismik moment oranÄ± âˆ kayma hÄ±zÄ±**.
Yani kayma hÄ±zÄ± ne kadar yÃ¼ksekse, o fay o kadar sÄ±k deprem Ã¼retiyor.

```
activityRate = min(1.0,  slipRate / 23)        # NAF (23 mm/yÄ±l) = 1.0 referans
decayKm      = 30 + 30 Ã— activityRate          # 30 km (pasif) â†’ 60 km (NAF)
distAtten    = exp(âˆ’distance / decayKm)        # mesafe zayÄ±flamasÄ±
hazardProxy  = activityRate Ã— distAtten

faultScore   = 100 Ã— (1 âˆ’ exp(âˆ’hazardProxy Ã— 4))
             = minimum 3 (taban deÄŸer)
```

### Ã–rnek deÄŸerler

| Konum | Kayma (mm/yÄ±l) | Mesafe (km) | Fay Skoru |
|---|---|---|---|
| Ä°stanbul (NAF) | 23 | 20 | ~94 |
| Dinar fayÄ± | 3.7 | 1.7 | ~42 |
| Pasif yerel fay | 0.1 | 0.5 | ~3 |
| Konya (uzak, yavaÅŸ) | 0.5 | 40 | ~3 |

### Kayma hÄ±zÄ± bilinmiyorsa
VeritabanÄ±nda kayma hÄ±zÄ± bulunmayan segmentler iÃ§in varsayÄ±lan **1.0 mm/yÄ±l** kullanÄ±lÄ±r.
Bu global aktif fay medyanÄ±nÄ±n alt sÄ±nÄ±rÄ±dÄ±r â€” muhafazakÃ¢r ama makul bir tahmin.

---

## 3. BÃ¶lgesel Tehlike Skoru Nedir?

### Veri kaynaÄŸÄ±
**GEM Global Seismic Hazard Map 2023.1** â€” tam PSHA analizi.
- DÃ¶nÃ¼ÅŸ periyodu: **475 yÄ±l** (50 yÄ±lda %10 aÅŸÄ±lma olasÄ±lÄ±ÄŸÄ± â€” uluslararasÄ± yapÄ± kodu standardÄ±)
- GÃ¶sterge: **PGA** (Peak Ground Acceleration â€” tepe zemin ivmesi), referans kaya zeminde
- Renk skalasÄ±: aÃ§Ä±k mavi (dÃ¼ÅŸÃ¼k) â†’ sarÄ± â†’ turuncu â†’ kÄ±rmÄ±zÄ± (Ã§ok yÃ¼ksek)

### NasÄ±l okunuyor?
Ä°ndirilen tile PNG'lerinden ilgili pikselin RGB deÄŸeri okunur, renk â†’ skor dÃ¶nÃ¼ÅŸÃ¼mÃ¼ yapÄ±lÄ±r:

| Renk | Hue aralÄ±ÄŸÄ± | Skor |
|---|---|---|
| AÃ§Ä±k mavi | 190â€“260Â° | 3â€“20 |
| Teal/cyan | 150â€“190Â° | 8â€“25 |
| YeÅŸil | 80â€“150Â° | 12â€“30 |
| SarÄ±-yeÅŸil | 55â€“80Â° | 28â€“50 |
| SarÄ±-turuncu | 35â€“55Â° | 48â€“70 |
| Turuncu | 15â€“35Â° | 65â€“85 |
| KÄ±rmÄ±zÄ± | <15Â° veya >330Â° | 78â€“100 |

Tile verisi yerel olarak `server/static/tiles/hazard/` klasÃ¶rÃ¼nden okunur â€” internet baÄŸlantÄ±sÄ± gerekmez.

---

## 4. Zemin SertliÄŸi (Vs30) Nedir?

**Vs30**: Zeminin Ã¼st 30 metresindeki ortalama kayma dalgasÄ± hÄ±zÄ± (m/s).

Deprem dalgalarÄ± yumuÅŸak zeminlerde **bÃ¼yÃ¼r** â€” bu yÃ¼zden aynÄ± deprem sert kayada az, alÃ¼vyon dolguda Ã§ok hasar yapabilir.

| SÄ±nÄ±f | Vs30 (m/s) | Zemin Tipi | Risk |
|---|---|---|---|
| A | â‰¥ 1500 | Ã‡ok sert kaya | Ã‡ok DÃ¼ÅŸÃ¼k |
| B | 760â€“1500 | Sert kaya | DÃ¼ÅŸÃ¼k |
| C | 360â€“760 | Orta sertlikte kaya | Orta |
| D | 180â€“360 | YumuÅŸak zemin | YÃ¼ksek |
| E | < 180 | Ã‡ok yumuÅŸak/gevÅŸek | Ã‡ok YÃ¼ksek |

**Kaynak:** USGS Global Vs30 grid (~2017), 1 km Ã§Ã¶zÃ¼nÃ¼rlÃ¼k, topoÄŸrafya bazlÄ± tahmin.

---

## 5. GÃ¼venli Alan Analizi (SafeSpot) NasÄ±l Ã‡alÄ±ÅŸÄ±r?

Bir oda fotoÄŸrafÄ± Ã§ekilir â†’ yapay zeka modeli (OpenAI GPT modeli) gÃ¶rÃ¼ntÃ¼yÃ¼ analiz eder.

Model ÅŸu bilim temelli Ã¶ncelik sÄ±rasÄ±nÄ± kullanÄ±r:
1. **SaÄŸlam masa/tezgah altÄ±** â€” dÃ¶kÃ¼len molozdan korur
2. **AlÃ§ak koltuk/kanepe yanÄ±** â€” Ã§Ã¶kme boÅŸluÄŸu yaratÄ±r
3. **Ä°ki iÃ§ duvar kÃ¶ÅŸesi** â€” yapÄ±sal bÃ¼tÃ¼nlÃ¼k
4. **YapÄ±sal kolon yanÄ±** â€” son Ã§are

Model tehlikeli bÃ¶lgeleri de iÅŸaretler: pencereler, sabitlenmemiÅŸ mobilyalar, tavan armatÃ¼rleri, dÄ±ÅŸ duvarlar.

Her Ã¶nerilen bÃ¶lge iÃ§in piksel koordinatÄ± dÃ¶ner â†’ fotoÄŸrafÄ±n Ã¼zerine kutucuk Ã§izilir.

---

## 6. Veri KaynaklarÄ± Ã–zeti

| Veri | Kaynak | YÄ±l | Lisans |
|---|---|---|---|
| Aktif fay geometrisi + kayma hÄ±zÄ± | GEM Global Active Faults | 2023 | CC BY-SA 4.0 |
| BÃ¶lgesel PGA tehlike tile'larÄ± | GEM Global Seismic Hazard Map | 2023 | CC BY-NC-SA 4.0 |
| Zemin sertliÄŸi (Vs30) | USGS Global Vs30 | ~2017 | Kamu domain |
| Deprem akÄ±ÅŸÄ± | USGS, EMSC, AFAD, JMA ve diÄŸerleri | GerÃ§ek zamanlÄ± | AÃ§Ä±k API |
| Yapay zeka analizi | OpenAI GPT | â€” | Ticari API |

---

## 7. KÄ±sÄ±tlar ve UyarÄ±lar

- Bu uygulama **bilgilendirme amaÃ§lÄ±dÄ±r**, resmi yapÄ± kodu veya sigorta deÄŸerlendirmesi deÄŸildir.
- Kayma hÄ±zÄ± Ã¶lÃ§Ã¼mleri bÃ¶lgeye gÃ¶re **Â±50% belirsizlik** taÅŸÄ±yabilir.
- Vs30 deÄŸerleri topoÄŸrafya bazlÄ± tahminden Ã¼retilmiÅŸtir â€” sondaj verisi deÄŸildir.
- Fay veritabanÄ± bilinmeyen veya haritalanmamÄ±ÅŸ faylarÄ± iÃ§ermez.
- GEM tehlike haritasÄ± 2023 tarihlidir; gÃ¼ncel araÅŸtÄ±rmalarla farklÄ±lÄ±k gÃ¶sterebilir.

