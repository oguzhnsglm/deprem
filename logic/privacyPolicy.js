import { LEGAL_CONFIG } from './legalConfig';

export const PRIVACY_POLICY_UPDATED_AT = '17 Nisan 2026';

export const PRIVACY_POLICY_SECTIONS = {
  tr: [
    {
      title: 'Topladığımız veriler',
      body: [
        'Profil bilgileri: ad, soyad, yaş, adres, ülke, şehir/eyalet, dil tercihi ve deprem bildirim eşiği.',
        'Hesap ve oturum bilgileri: Supabase Authentication tarafından yönetilen kullanıcı kimliği ve oturum bilgileri.',
        'Acil durum kişileri: kullanıcının eklediği kişi adı, yakınlık derecesi, telefon ve e-posta bilgileri.',
        'Acil durum kayıtları: kullanıcının oluşturduğu durum bildirimi, bildirim logları ve ilgili zaman bilgileri.',
        'Konum bilgisi: haritada mevcut konumu göstermek, nokta bazlı zemin/fay analizi yapmak ve acil durum paylaşım metni hazırlamak için kullanılır.',
        'Kamera/galeri içeriği: Güvenli Alan Analizi için kullanıcının seçtiği veya çektiği fotoğraf işlenir.',
        'Teknik veriler: server istek kayıtları, hata durumları, istek zamanı, endpoint ve performans bilgileri.',
      ],
    },
    {
      title: 'Verileri nasıl kullanıyoruz',
      body: [
        'Deprem geçmişini kullanıcının seçtiği ülke ve şehir/eyalet tercihine göre göstermek.',
        'Haritada Vs30 zemin bilgisi, fay mesafesi ve sismik risk analizini hesaplamak.',
        'Kullanıcının bildirim eşiği ve konum tercihlerine göre uyarı deneyimini kişiselleştirmek.',
        'Acil durumda kullanıcının seçtiği kişilere gönderilecek mesaj taslaklarını hazırlamak.',
        'Güvenli Alan Analizi özelliğinde fotoğraf üzerinden güvenli/riskli bölgeleri önermek.',
        'Hata ayıklama, güvenlik, kötüye kullanım önleme, performans ve servis sürekliliği sağlamak.',
      ],
    },
    {
      title: 'Üçüncü taraf servisler',
      body: [
        'Supabase: kullanıcı hesabı, profil, acil kişi, bildirim ve ilgili uygulama verilerini saklamak için kullanılır.',
        'OpenAI: Güvenli Alan Analizi sırasında fotoğraf, yalnızca server üzerinden OpenAI API’ye iletilir. OpenAI API anahtarı uygulama içinde tutulmaz.',
        'Deprem ve harita veri kaynakları: USGS, Kandilli, INGV, JMA/P2PQuake, GeoNet, BMKG, GEM/OpenQuake ve Vs30/fay veri setleri doğrudan client’tan çağrılmaz; uygulamaya kendi server/cache katmanımız üzerinden aktarılır.',
        'Harici uygulamalar: WhatsApp, SMS veya telefon uygulaması açıldığında paylaşım kullanıcının cihazında ve onayıyla tamamlanır.',
      ],
    },
    {
      title: 'OpenAI ve fotoğraf analizi',
      body: [
        'Güvenli Alan Analizi için seçilen fotoğraf uygulama server’ına gönderilir, server da analizi üretmek için OpenAI API’ye iletir.',
        'Fotoğraf analizi; oda içindeki güvenli/riskli alanları tahmin etmek için kullanılır. Bu çıktı resmi afet güvenliği değerlendirmesi veya mühendislik raporu değildir.',
        'Uygulama içinde OpenAI API anahtarı bulunmaz. API anahtarı yalnızca server tarafında saklanır.',
      ],
    },
    {
      title: 'Saklama ve silme',
      body: [
        'Profil, acil kişi, bildirim ve kullanıcı tercihleri hesap aktif olduğu sürece saklanabilir.',
        'Kullanıcı, profil ve acil kişi bilgilerini uygulama içinden güncelleyebilir veya silebilir.',
        `Server logları güvenlik, hata ayıklama ve servis sürekliliği amacıyla en fazla ${LEGAL_CONFIG.serverLogRetentionDays} gün tutulur.`,
        `Hesap ve veri silme talepleri ${LEGAL_CONFIG.contactEmail} adresine iletilebilir. Talepler en geç ${LEGAL_CONFIG.deletionRequestDays} gün içinde değerlendirilir.`,
      ],
    },
    {
      title: 'Güvenlik',
      body: [
        'Hassas API anahtarları client uygulamasında tutulmaz; OpenAI anahtarı server tarafındadır.',
        'Supabase tablolarında kullanıcı verilerinin sadece ilgili kullanıcı tarafından okunup değiştirilebilmesi için Row Level Security politikaları kullanılır.',
        'Server, veri kaynaklarına yapılan istekleri cache/rate limit katmanından geçirerek servis sürekliliğini ve kaynak kullanımını korur.',
      ],
    },
    {
      title: 'Kullanıcı hakları',
      body: [
        'Kullanıcılar profil, acil kişi ve uygulama tercihlerini görüntüleyebilir, güncelleyebilir veya silebilir.',
        `KVKK/GDPR kapsamındaki erişim, düzeltme, silme, itiraz ve veri taşınabilirliği talepleri ${LEGAL_CONFIG.contactEmail} adresine iletilebilir.`,
        'Konum, kamera ve galeri izinleri cihaz ayarlarından geri alınabilir. İzin kaldırıldığında ilgili özellikler sınırlı çalışabilir.',
      ],
    },
    {
      title: 'Çocuklar',
      body: [
        'Uygulama çocuklara özel olarak tasarlanmamıştır. Ebeveyn veya yasal vasi onayı olmadan çocuklardan kişisel veri toplanması amaçlanmaz.',
      ],
    },
    {
      title: 'Değişiklikler ve iletişim',
      body: [
        'Bu politika uygulamadaki veri işleme akışları değiştikçe güncellenebilir.',
        `Veri sorumlusu/geliştirici: ${LEGAL_CONFIG.developerName}. Yetki alanı: ${LEGAL_CONFIG.jurisdiction}. İletişim: ${LEGAL_CONFIG.contactEmail}. Web gizlilik politikası: ${LEGAL_CONFIG.privacyPolicyUrl}.`,
      ],
    },
  ],
  en: [
    {
      title: 'Data we collect',
      body: [
        'Profile data: first name, last name, age, address, country, city/state, language preference, and earthquake notification threshold.',
        'Account and session data: user identity and session information managed by Supabase Authentication.',
        'Emergency contacts: contact name, relationship, phone number, and email address entered by the user.',
        'Emergency records: user-created status alerts, notification logs, and related timestamps.',
        'Location data: used to show current location on the map, calculate point-based soil/fault analysis, and prepare emergency sharing text.',
        'Camera/gallery content: photos selected or captured by the user are processed for Safe Spot Analysis.',
        'Technical data: server request logs, errors, request timestamps, endpoint names, and performance information.',
      ],
    },
    {
      title: 'How we use data',
      body: [
        'Show earthquake history based on the selected country and city/state preference.',
        'Calculate Vs30 soil data, fault distance, and seismic risk analysis on the map.',
        'Personalize alert behavior based on notification threshold and location preferences.',
        'Prepare emergency message drafts for the contacts selected by the user.',
        'Suggest safer and riskier areas from a photo in the Safe Spot Analysis feature.',
        'Support debugging, security, abuse prevention, performance, and service reliability.',
      ],
    },
    {
      title: 'Third-party services',
      body: [
        'Supabase: used for user accounts, profiles, emergency contacts, notifications, and related app data.',
        'OpenAI: during Safe Spot Analysis, the photo is sent to the OpenAI API only through the server. The OpenAI API key is not stored in the app.',
        'Earthquake and map data sources: USGS, Kandilli, INGV, JMA/P2PQuake, GeoNet, BMKG, GEM/OpenQuake, and Vs30/fault datasets are not called directly from the client; they are served through our own server/cache layer.',
        'External apps: when WhatsApp, SMS, or the phone app is opened, sharing is completed on the user device and with user action.',
      ],
    },
    {
      title: 'OpenAI and photo analysis',
      body: [
        'The photo selected for Safe Spot Analysis is sent to the app server, which forwards it to the OpenAI API to generate the analysis.',
        'Photo analysis is used to estimate safer and riskier areas in a room. It is not an official disaster safety assessment or engineering report.',
        'The OpenAI API key is not included in the mobile app and is stored only on the server.',
      ],
    },
    {
      title: 'Retention and deletion',
      body: [
        'Profile, emergency contact, notification, and preference data may be kept while the account remains active.',
        'Users can update or delete profile and emergency contact information in the app.',
        `Server logs are retained for up to ${LEGAL_CONFIG.serverLogRetentionDays} days for security, debugging, and service reliability.`,
        `Account and data deletion requests can be sent to ${LEGAL_CONFIG.contactEmail}. Requests are reviewed within ${LEGAL_CONFIG.deletionRequestDays} days.`,
      ],
    },
    {
      title: 'Security',
      body: [
        'Sensitive API keys are not stored in the client app; the OpenAI key is kept on the server.',
        'Supabase Row Level Security policies are used so user data can only be read or changed by the relevant user.',
        'The server uses cache/rate limit layers for upstream data requests to support reliability and responsible source usage.',
      ],
    },
    {
      title: 'User rights',
      body: [
        'Users can view, update, or delete profile, emergency contact, and app preference data.',
        `KVKK/GDPR access, correction, deletion, objection, and data portability requests can be sent to ${LEGAL_CONFIG.contactEmail}.`,
        'Location, camera, and gallery permissions can be revoked from device settings. Related features may become limited when permissions are revoked.',
      ],
    },
    {
      title: 'Children',
      body: [
        'The app is not specifically designed for children and does not intend to collect personal data from children without parent or legal guardian consent.',
      ],
    },
    {
      title: 'Changes and contact',
      body: [
        'This policy may be updated when data processing flows in the app change.',
        `Developer/controller: ${LEGAL_CONFIG.developerName}. Jurisdiction: ${LEGAL_CONFIG.jurisdiction}. Contact: ${LEGAL_CONFIG.contactEmail}. Public privacy policy: ${LEGAL_CONFIG.privacyPolicyUrl}.`,
      ],
    },
  ],
};
