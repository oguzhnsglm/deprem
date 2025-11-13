const RISK_ZONES = [
  {
    id: 'marmara',
    name: 'Marmara Fay Hattı',
    bounds: { latMin: 40.7, latMax: 41.3, lonMin: 28.6, lonMax: 29.4 },
    level: 'Yüksek Risk',
    score: 82,
    description: 'Kuzey Anadolu fayının Marmara koluna en yakın banttasın. Binaların güçlendirme durumu kritik.',
    advice: 'Binaların performans raporlarını kontrol et, aile buluşma planı oluştur.',
  },
  {
    id: 'ege',
    name: 'Ege Graben Bölgesi',
    bounds: { latMin: 37.5, latMax: 40.9, lonMin: 26, lonMax: 28.4 },
    level: 'Orta-Yüksek Risk',
    score: 68,
    description: 'Sık orta şiddette depremler yaşanan bir graben hattındasın.',
    advice: 'Sabitlenmemiş eşyaları duvara sabitle, acil çanta hazır bulunsun.',
  },
  {
    id: 'akdeniz',
    name: 'Doğu Akdeniz Çöküntüsü',
    bounds: { latMin: 35.8, latMax: 37.4, lonMin: 29.6, lonMax: 36.4 },
    level: 'Orta Risk',
    score: 55,
    description: 'Çoklu fay hatlarının kesiştiği bölge. Sarsıntılar yaygın ama daha düşük magnitüdde.',
    advice: 'Bölgedeki tahliye yollarını öğren, mahalle afet gönüllülerine katılmayı düşün.',
  },
];

const DEFAULT_RISK = {
  level: 'Belirleniyor',
  score: 40,
  description: 'Koordinatlar için yerel risk profili bulunamadı. AFAD duyurularını takip et.',
  advice: 'Yaşadığın binanın zemin etüdünü incele ve acil durum planını güncelle.',
};

export const getRiskForCoords = ({ latitude, longitude } = {}) => {
  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    return DEFAULT_RISK;
  }

  const zone = RISK_ZONES.find(
    ({ bounds }) =>
      latitude >= bounds.latMin &&
      latitude <= bounds.latMax &&
      longitude >= bounds.lonMin &&
      longitude <= bounds.lonMax
  );

  if (!zone) {
    return DEFAULT_RISK;
  }

  return {
    level: zone.level,
    score: zone.score,
    description: zone.description,
    advice: zone.advice,
    zoneName: zone.name,
  };
};

