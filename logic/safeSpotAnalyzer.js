import * as FileSystem from 'expo-file-system/legacy';

const normalizeApiBase = (rawBase = '') => {
  let cleaned = String(rawBase || '').trim().replace(/\/+$/, '');
  if (!cleaned) return '';
  cleaned = cleaned.replace('http://localhost', 'http://10.0.2.2');
  cleaned = cleaned.replace('http://127.0.0.1', 'http://10.0.2.2');
  return cleaned;
};

const SAFE_SPOT_API_BASE = normalizeApiBase(process.env.EXPO_PUBLIC_API_BASE || '');

const readImageAsBase64 = async (uri) => {
  if (!uri) throw new Error('Fotoğraf bulunamadı');
  try {
    return await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
  } catch (error) {
    throw new Error(`Fotoğraf okunamadı: ${error.message}`);
  }
};

const clampBounds = (bounds, imgW, imgH) => {
  const x = Math.max(0, Math.min(Number(bounds?.x) || 0, imgW - 10));
  const y = Math.max(0, Math.min(Number(bounds?.y) || 0, imgH - 10));
  const width = Math.max(10, Math.min(Number(bounds?.width) || 60, imgW - x));
  const height = Math.max(10, Math.min(Number(bounds?.height) || 80, imgH - y));
  return { x, y, width, height };
};

const parseSafeZones = (safeZones = [], imgW, imgH) =>
  safeZones
    .map((zone, index) => ({
      id: zone?.id ?? `zone-${index}`,
      label: zone?.label ?? 'Güvenli Alan',
      guidance: zone?.guidance ?? 'Çök-kapan-tutun pozisyonunu uygula.',
      confidence: Math.max(0, Math.min(1, Number(zone?.confidence ?? 0.5))),
      priority: Number(zone?.priority ?? index + 1),
      bounds: zone?.bounds ? clampBounds(zone.bounds, imgW, imgH) : null,
    }))
    .filter(Boolean);

const parseRisks = (risks = []) =>
  risks.map((risk, index) => ({
    id: risk?.id ?? `risk-${index}`,
    label: risk?.label ?? 'Riskli Bölge',
    detail: risk?.detail ?? 'Bu bölgeden uzak dur.',
  }));

const FALLBACK_ZONES = [
  {
    id: 'guide-table',
    label: 'Sağlam Masa veya Tezgah Altı',
    guidance: 'Varsa sağlam bir masanın altına gir, bir ayağını tut. Masa seni dökülen molozdan korur.',
    confidence: 0.3,
    priority: 1,
    bounds: null,
  },
  {
    id: 'guide-sofa',
    label: 'Alçak Koltuk veya Kanepe Yanı',
    guidance: 'Alçak bir koltuk ya da kanepenin yanına cenin pozisyonunda çök. Kanepe çökme boşluğu yaratabilir.',
    confidence: 0.3,
    priority: 2,
    bounds: null,
  },
  {
    id: 'guide-wall',
    label: 'İç Duvar Köşesi',
    guidance: 'İki iç duvarın birleştiği köşeye geç, başını ve enseni kollarınla koru.',
    confidence: 0.3,
    priority: 3,
    bounds: null,
  },
];

const FALLBACK_RISKS = [
  { id: 'risk-windows', label: 'Pencere ve Cam Yüzeyler', detail: 'Depremde cam kırılabilir. En az 1.5 metre uzak kal.' },
  { id: 'risk-wardrobe', label: 'Sabitlenmemiş Yüksek Mobilya', detail: 'Dolap, kitaplık ve vitrinler devrilme riski taşır.' },
  { id: 'risk-lights', label: 'Tavan Armatürleri', detail: 'Avize, sarkıt lamba ve fanların altında bekleme.' },
];

const fallbackAnalysis = (reason, error) => ({
  summary: 'Gerçek zamanlı analiz yapılamadı. En yakın sağlam masanın altına gir; yoksa alçak bir koltuk yanına cenin pozisyonunda çök.',
  notice:
    reason === 'missing-server'
      ? 'Güvenli alan analizi için server bağlantısı yapılandırılmadı. Genel deprem güvenliği rehberi gösteriliyor.'
      : 'Fotoğraf analiz edilirken hata oluştu. Genel rehber gösteriliyor.',
  safeZones: FALLBACK_ZONES,
  risks: FALLBACK_RISKS,
  source: reason === 'missing-server' ? 'fallback-missing-server' : 'fallback-error',
  provider: null,
  imageWidth: null,
  imageHeight: null,
  error,
});

const analyzePhotoOnServer = async ({ base64Image, imageDimensions }) => {
  if (!SAFE_SPOT_API_BASE) {
    throw new Error('EXPO_PUBLIC_API_BASE yapılandırılmadı.');
  }

  const response = await fetch(`${SAFE_SPOT_API_BASE}/api/safe-spot/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      imageBase64: base64Image,
      imageWidth: imageDimensions?.width || 1080,
      imageHeight: imageDimensions?.height || 1440,
      mimeType: 'image/jpeg',
    }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.error || `Safe spot server error ${response.status}`);
  }
  return payload;
};

export const analyzeSafeSpotPhoto = async (photoUri, imageDimensions) => {
  if (!SAFE_SPOT_API_BASE) {
    return fallbackAnalysis('missing-server');
  }

  let base64Image;
  try {
    base64Image = await readImageAsBase64(photoUri);
  } catch (error) {
    console.warn('[safeSpot] Fotoğraf okunamadı:', error.message);
    return fallbackAnalysis('error', error.message);
  }

  try {
    const result = await analyzePhotoOnServer({ base64Image, imageDimensions });
    const imgW = result?.imageWidth || imageDimensions?.width || 1080;
    const imgH = result?.imageHeight || imageDimensions?.height || 1440;
    return {
      summary: result?.summary ?? 'En yakın sağlam mobilyanın yanına çök-kapan-tutun pozisyonunu uygula.',
      safeZones: parseSafeZones(result?.safeZones ?? [], imgW, imgH),
      risks: parseRisks(result?.risks ?? []),
      source: result?.source ?? 'ai',
      provider: result?.provider ?? 'server',
      imageWidth: imgW,
      imageHeight: imgH,
    };
  } catch (error) {
    console.warn('[safeSpot] Server analizi başarısız:', error.message);
    return fallbackAnalysis('error', error.message);
  }
};

export default analyzeSafeSpotPhoto;
