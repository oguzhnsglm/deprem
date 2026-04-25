# Release Privacy Checklist

Bu dosya Store yayını öncesi gizlilik ve güvenlik için doldurulacak kısa listedir.

## Uygulama içi bilgiler

`logic/legalConfig.js` dosyasındaki değerleri gerçek bilgilerle değiştir:

- `developerName`: geliştirici ya da şirket adı
- `contactEmail`: KVKK/GDPR ve hesap silme talepleri için takip edilen e-posta
- `privacyPolicyUrl`: web üzerinde herkese açık gizlilik politikası URL'si
- `serverLogRetentionDays`: server log saklama süresi
- `deletionRequestDays`: hesap/veri silme talebi değerlendirme süresi
- `jurisdiction`: veri sorumlusu ülke/yetki alanı

Varsayılan saklama kararı:

- Server logları: 30 gün
- Hesap/veri silme talepleri: 30 gün içinde değerlendirilir
- Profil, acil kişiler, bildirim tercihleri: hesap aktif olduğu sürece tutulur

## Supabase Security Advisor

1. Supabase Dashboard -> SQL Editor.
2. `docs/supabase-security-hardening.sql` dosyasındaki SQL'i çalıştır.
3. Dashboard -> Authentication -> Auth Server / Password Security.
4. `Leaked password protection` seçeneğini aç.
5. Security Advisor ekranında `Rerun linter` çalıştır.

## Store gereksinimi

App Store ve Google Play için gizlilik politikası sadece uygulama içinde değil, web üzerinde de erişilebilir olmalı. `privacyPolicyUrl` bu herkese açık sayfayı göstermeli.
