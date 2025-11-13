# Deprem Destek Prototipi

Bu Expo ve React Native uygulamasi, deprem aninda guvenli alan farkindaligi ve durum paylasimini simule eder. Tamamen prototip amacli oldugu icin gercek acil yardim veya konum garantisi vermez.

## Ozellikler
- Guvenli alan analizi adimi ile temel risk hatirlatmalari
- Durum bildirimi akisi (iyiyim / yardim lazim)
- Yakindaki kisilere ait mock rehber listesi
- Google Places destekli harita ekrani ile toplanma alanlari / hastaneler ve risk skoru

## Kurulum
Projeyi yerel ortamda calistirmak icin terminalde asagidaki adimlari uygulayin:

```bash
npm install
npx expo start
```

## Notlar
- Kamera, konum ve bildirim fonksiyonlari su anda yalnizca mock olarak yer aliyor.
- Uygulama icerigi aile odakli bir yonlendirme senaryosunu temsil eder.
- Harita ekraninda Google Places verisi kullanmak icin `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` cevresel degiskenini calistirma aninda ayarlamalisiniz. Anahtar yoksa uygulama Istanbul icin yerel mock veriye geri duser.
