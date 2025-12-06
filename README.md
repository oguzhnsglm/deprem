# Deprem Destek Prototipi

Bu Expo ve React Native uygulamasi, deprem aninda guvenli alan farkindaligi ve durum paylasimini simule eder. Tamamen prototip amacli oldugu icin gercek acil yardim veya konum garantisi vermez.

## Ozellikler
- Guvenli alan analizi adimi ile temel risk hatirlatmalari
- Durum bildirimi akisi (iyiyim / yardim lazim)
- Yakindaki kisilere ait mock rehber listesi
- AFAD/Kandilli/USGS/EMSC/IRIS entegrasyonlu deprem geçmişi (otomatik, mock yedekli)
- Google Places destekli harita ekrani ile toplanma alanlari / hastaneler ve risk skoru

## Kurulum
Projeyi yerel ortamda calistirmak icin terminalde asagidaki adimlari uygulayin:

```bash
npm install
npx expo start
```

### Vs30 zemin servisi

Harita uzerinde uzun basilinca zeminin Vs30 degerini gormek icin repo kokundeki `server/` klasorunu calistirin:

```bash
cd server
npm install
npm run dev
```

Uygulama tarafinda `.env` dosyasina yerel IP adresinizi iceren `EXPO_PUBLIC_VS30_API_BASE` degiskenini girin (ornegin `http://192.168.1.42:4000`).

### Fay yaknlık servisi

`server/src/data/faults.geojson/faults.geojson` fay verisini kullanarak secilen noktanin en yakin aktif faya uzakligini hesaplayan yeni bir endpoint bulunuyor:

```
GET /api/fault-distance?lat=<LAT>&lon=<LON>
```

- JSON yaniti mesafe (km), 0-100 arasi skor ve seviye bilgisini doner.
- Mobil taraf `.env` icinde `EXPO_PUBLIC_API_BASE` degiskenini okur; genellikle Vs30 servisi ile ayni URL kullanilir (ornegin `http://192.168.1.42:4000`).
- Telefon/simulator ile sunucu ayni yerel agda olmali; aksi halde istekler `Network request failed` hatasina duser.

## Notlar
- Kamera, konum ve bildirim fonksiyonlari su anda yalnizca mock olarak yer aliyor.
- Uygulama icerigi aile odakli bir yonlendirme senaryosunu temsil eder.
- Deprem geçmişi ekranlari resmi AFAD/Kandilli ve uluslararasi USGS/EMSC/IRIS kataloglarindan 30-60 gunluk verileri toplar; servisler ulasilamazsa liste bos kalir ve kullaniciya bilgi verilir.
- Harita ekraninda Google Places verisi kullanmak icin `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` cevresel degiskenini calistirma aninda ayarlamalisiniz. Anahtar yoksa uygulama Istanbul icin yerel mock veriye geri duser.
- `.grd` raster dosyasi yuklenemezse GDAL ile `gdal_translate global_vs30.grd global_vs30.tif` komutunu calistirip API'yi `.tif` uzerinden kullanabilirsiniz.
