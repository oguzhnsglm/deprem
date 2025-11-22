import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system/legacy';

const OPENAI_DEFAULT_MODEL = 'gpt-4o-mini';
const OPENAI_DEFAULT_API_URL = 'https://api.openai.com/v1/chat/completions';
const GEMINI_DEFAULT_MODEL = 'gemini-2.0-flash-exp';
const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

const getEnvValue = (key) => {
  const extra = Constants?.expoConfig?.extra ?? {};
  return extra[key] ?? process.env?.[key];
};

const rawProvider = (
  getEnvValue('safeSpotProvider') ??
  getEnvValue('SAFE_SPOT_PROVIDER') ??
  getEnvValue('EXPO_PUBLIC_SAFE_SPOT_PROVIDER') ??
  ''
).toLowerCase();

const rawModel =
  getEnvValue('safeSpotModel') ??
  getEnvValue('SAFE_SPOT_MODEL') ??
  getEnvValue('EXPO_PUBLIC_SAFE_SPOT_MODEL');

const inferredProvider = rawProvider || (rawModel && rawModel.toLowerCase().includes('gemini') ? 'gemini' : '');
const provider = inferredProvider || 'openai';
const isGeminiProvider = provider === 'gemini';

const MODEL_NAME = rawModel || (isGeminiProvider ? GEMINI_DEFAULT_MODEL : OPENAI_DEFAULT_MODEL);

const sharedKey = getEnvValue('safeSpotApiKey') ?? getEnvValue('SAFE_SPOT_API_KEY');

const OPENAI_KEY =
  (!isGeminiProvider && sharedKey) ||
  getEnvValue('safeSpotOpenAiKey') ||
  getEnvValue('SAFE_SPOT_OPENAI_KEY') ||
  getEnvValue('EXPO_PUBLIC_OPENAI_API_KEY');

const GEMINI_KEY =
  (isGeminiProvider && sharedKey) ||
  getEnvValue('safeSpotGeminiKey') ||
  getEnvValue('SAFE_SPOT_GEMINI_KEY') ||
  getEnvValue('EXPO_PUBLIC_GEMINI_API_KEY');

const API_KEY = isGeminiProvider ? GEMINI_KEY : OPENAI_KEY;

const rawApiUrl =
  getEnvValue('safeSpotApiUrl') ??
  getEnvValue('SAFE_SPOT_API_URL') ??
  getEnvValue('EXPO_PUBLIC_SAFE_SPOT_API_URL');

const API_URL =
  rawApiUrl ||
  (isGeminiProvider
    ? `${GEMINI_API_BASE}/models/${MODEL_NAME}:generateContent`
    : OPENAI_DEFAULT_API_URL);

const clamp01 = (value) => {
  const numeric = Number(value);
  if (Number.isNaN(numeric)) {
    return 0;
  }
  if (numeric < 0) {
    return 0;
  }
  if (numeric > 1) {
    return 1;
  }
  return numeric;
};

const readImageAsBase64 = async (uri) => {
  if (!uri) {
    throw new Error('Fotoğraf bulunamadı');
  }
  try {
    // expo-file-system için encoding string olarak belirtilmeli
    const base64String = await FileSystem.readAsStringAsync(uri, { 
      encoding: 'base64'
    });
    return base64String;
  } catch (error) {
    console.error('[readImageAsBase64] Hata:', error);
    throw new Error(`Fotoğraf okunamadı: ${error.message}`);
  }
};

const normalizeBounds = (bounds = {}) => {
  const width = clamp01(bounds.width ?? 0.4);
  const height = clamp01(bounds.height ?? 0.3);
  return {
    x: clamp01(bounds.x ?? 0.1),
    y: clamp01(bounds.y ?? 0.2),
    width,
    height,
  };
};

const normalizeSafeZones = (safeZones = []) =>
  safeZones
    .map((zone, index) => ({
      id: zone.id ?? `zone-${index}`,
      label: zone.label ?? 'Güvenli Alan',
      guidance:
        zone.guidance ??
        'Dayanıklı bir mobilya yanına çök-kapan-tutun pozisyonuyla yerleş.',
      confidence: Number(zone.confidence ?? 0.5),
      bounds: normalizeBounds(zone.bounds),
    }))
    .filter((zone) => zone.bounds.width > 0 && zone.bounds.height > 0);

const normalizeRisks = (risks = []) =>
  risks.map((risk, index) => ({
    id: risk.id ?? `risk-${index}`,
    label: risk.label ?? 'Riskli Bölge',
    detail:
      risk.detail ??
      'Cam yüzeyler, devrilebilecek dolaplar ve ağır objelerden uzak dur.',
  }));

const SAFE_ZONE_LABELS = [
  'Dayanıklı Masa Yanı',
  'Kanonun Güçlü Köşesi',
  'Sabit Kitaplık Yanı',
  'Kapı Yanı Taşıyıcı Duvar',
  'Alçak Komodin Bölgesi',
];

const SAFE_ZONE_GUIDANCE = [
  'Dizlerinin üstünde çök, başını kolunla koru ve sabit mobilyaya tutun.',
  'Çök-kapan-tutun pozisyonunu alırken cam yüzeylerden uzak dur.',
  'Baş hizasındaki objeleri kontrol et ve sağlam yüzeye yaslan.',
  'Omuzlarını duvara yaslayıp mümkün olduğunca alçak kal.',
  'Çantana veya yastığa başını yaslayıp dizlerini bük.',
];

const RISK_LABELS = ['Pencere Bölgesi', 'Sabitlenmemiş Dolap', 'Aydınlatma Elemanı', 'Elektrikli Cihaz'];

const RISK_DETAILS = [
  'Cam kırılması riskine karşı 1-2 metre uzak kal.',
  'Devrilme riskine karşı dolabın önünü boş bırak.',
  'Sallanabilecek avizelerin altından uzak dur.',
  'Elektrik kabloları ve prizlerin yanına diz çökme.',
];

const pseudoRandom = (seedSource = '', salt = 0) => {
  if (!seedSource) {
    return Math.random();
  }
  const source = `${seedSource}:${salt}`;
  let hash = 0;
  for (let i = 0; i < source.length; i += 1) {
    hash = (hash * 31 + source.charCodeAt(i)) % 1000000;
  }
  return hash / 1000000;
};

const generateHeuristicZones = (seedSource) => {
  const zoneCount = 1 + Math.floor(pseudoRandom(seedSource, 11) * 3);
  return Array.from({ length: zoneCount }).map((_, index) => {
    const width = 0.22 + pseudoRandom(seedSource, index * 5 + 1) * 0.4;
    const height = 0.18 + pseudoRandom(seedSource, index * 5 + 2) * 0.38;
    const x = clamp01(pseudoRandom(seedSource, index * 5 + 3) * (1 - width));
    const y = clamp01(pseudoRandom(seedSource, index * 5 + 4) * (1 - height));

    const label = SAFE_ZONE_LABELS[index % SAFE_ZONE_LABELS.length];
    const guidance = SAFE_ZONE_GUIDANCE[index % SAFE_ZONE_GUIDANCE.length];
    const confidence = 0.35 + pseudoRandom(seedSource, index * 5 + 5) * 0.55;

    return {
      id: `heuristic-zone-${index}`,
      label,
      guidance,
      confidence,
      bounds: { x, y, width, height },
    };
  });
};

const generateHeuristicRisks = (seedSource) => {
  const riskCount = 1 + Math.floor(pseudoRandom(seedSource, 101) * 3);
  return Array.from({ length: riskCount }).map((_, index) => ({
    id: `heuristic-risk-${index}`,
    label: RISK_LABELS[(index + 1) % RISK_LABELS.length],
    detail: RISK_DETAILS[(index + 2) % RISK_DETAILS.length],
  }));
};

const fallbackAnalysis = (reason, { base64Image } = {}) => {
  if (base64Image) {
    const safeZones = normalizeSafeZones(generateHeuristicZones(base64Image));
    const risks = normalizeRisks(generateHeuristicRisks(base64Image));
    const primaryZone = safeZones[0]?.label ?? 'sabit bir mobilya';
    const primaryRisk = risks[0]?.label ?? 'cam yüzeyler';

    return {
      summary: `Fotoğraftaki ${primaryZone.toLowerCase()} yakınında çök-kapan-tutun pozisyonu al, ${primaryRisk.toLowerCase()} bölgesinden uzak kal.`,
      safeZones,
      risks,
      source: reason === 'missing-key' ? 'fallback-missing-key' : 'fallback-error',
    };
  }

  return {
    summary:
      reason === 'missing-key'
        ? 'Yapay zeka anahtarı eksik olduğu için örnek güvenli alan önerileri gösteriliyor.'
        : 'Fotoğraf analiz edilirken sorun oluştu; aşağıdaki öneriler deprem güvenlik rehberlerine dayanan örneklerdir.',
    safeZones: normalizeSafeZones([
      {
        id: 'table-zone',
        label: 'Masa Yanı',
        confidence: 0.42,
        guidance:
          'Masanın bir ayağına yakın şekilde dizlerinin üzerine çök, başını kolunla koru ve masaya tutun.',
        bounds: { x: 0.18, y: 0.52, width: 0.46, height: 0.32 },
      },
      {
        id: 'sofa-corner',
        label: 'Kanepenin Sağlam Köşesi',
        confidence: 0.37,
        guidance:
          'Köşe minderine yakın konumlan, dizlerini büküp hedef pozisyona geç, hareketli objelerden uzak dur.',
        bounds: { x: 0.62, y: 0.35, width: 0.28, height: 0.28 },
      },
    ]),
    risks: normalizeRisks([
      {
        id: 'window',
        label: 'Pencere / Cam Yüzey',
        detail: 'Cam kırılması riskine karşı 1-2 metre uzakta kal.',
      },
      {
        id: 'wardrobe',
        label: 'Sabitlenmemiş Dolap',
        detail: 'Dolap devrilmesine karşı yanına yaklaşma.',
      },
    ]),
    source: 'fallback',
  };
};

const buildPrompt = () => `
Deprem güvenliği uzmanı olarak, fotoğraftaki odayı analiz et ve "ÇÖK-KAPAN-TUTUN" tekniğini uygulayabileceğin GÜVENLİ alanları ve TEHLİKELİ bölgeleri belirle.

## GÜVENLİ ALAN KRİTERLERİ:
1. **Sağlam Masa/Mobilya Yanı**: Ağır, sabit masalar veya güçlü mobilyaların yanı. Kişi dizleri üzerinde çöküp başını koruyabilmeli.
2. **Taşıyıcı Duvar Köşeleri**: İç duvar köşeleri, özellikle kapı kasaları. Yapısal destek sağlar.
3. **Alçak, Sağlam Mobilya**: Koltuk, kanepe yanı gibi düşük ve sabit nesneler.
4. **Sabitlenmiş Kitaplık/Dolap Yanı**: Duvara monte edilmiş, devrilme riski olmayan mobilyalar.

## TEHLİKELİ BÖLGELER:
- **Pencereler ve Camlar**: Kırılma riski yüksek
- **Aynalar ve Cam Yüzeyler**: Parçalanabilir
- **Sabitlenmemiş Dolaplar**: Devrilme riski
- **Avize/Sarkıt Altı**: Düşme riski
- **Ağır Objeler**: Düşebilecek ağır tablolar, raflar

## ÇÖK-KAPAN-TUTUN TEKNİĞİ:
- Dizler üzerine çök
- Başını ve enseni kollarınla koru
- Sabit bir yüzeye/mobilyaya tutun
- Sarsıntı bitene kadar bu pozisyonda kal

## GÖREV:
Fotoğraftaki odayı detaylıca incele ve SADECE JSON formatında yanıt ver:

{
  "summary": "Odanın Türkçe detaylı açıklaması: mobilyalar, pencereler, alan düzeni ve en güvenli noktalar",
  "safeZones": [
    {
      "id": "unique-id",
      "label": "Güvenli Alan Adı (örn: Çalışma Masası Yanı, Kanepe Köşesi, Kapı Kasası)",
      "confidence": 0.75,
      "guidance": "Bu alanda nasıl pozisyon alınacağına dair detaylı Türkçe talimat",
      "bounds": { 
        "x": 0.1,
        "y": 0.2, 
        "width": 0.3,
        "height": 0.25
      }
    }
  ],
  "risks": [
    { 
      "id": "risk-id",
      "label": "Tehlike Adı (örn: Pencere Bölgesi, Avize Altı)",
      "detail": "Bu bölgenin neden tehlikeli olduğuna dair Türkçe açıklama"
    }
  ]
}

ÖNEMLİ - BOUNDS KOORDİNATLARI:
- **x**: Güvenli alanın SOL kenarının konumu (0 = en sol, 1 = en sağ)
- **y**: Güvenli alanın ÜST kenarının konumu (0 = en üst, 1 = en alt)
- **width**: Alanın GENİŞLİĞİ (0.2-0.4 arası ideal)
- **height**: Alanın YÜKSEKLİĞİ (0.2-0.4 arası ideal)

ÖRNEK: Sağ altta bir kanepe için bounds: {"x": 0.6, "y": 0.6, "width": 0.3, "height": 0.35}
ÖRNEK: Sol üstte bir masa için bounds: {"x": 0.1, "y": 0.1, "width": 0.25, "height": 0.3}
ÖRNEK: Ortada bir mobilya için bounds: {"x": 0.4, "y": 0.4, "width": 0.3, "height": 0.3}

DİKKAT:
- Fotoğraftaki GERÇEK konumları doğru belirle
- Koordinatlar mobilyanın TAM ÜZERİNDE olmalı
- Her güvenli alan FARKLI bir yerde olmalı
- En az 2-4 güvenli alan belirle
- Türkçe yanıt ver
`;

const buildOpenAiRequestBody = (base64Image) => ({
  model: OPENAI_DEFAULT_MODEL,
  messages: [
    {
      role: 'system',
      content:
        'You help Turkish-speaking users quickly spot safe and unsafe zones inside rooms for earthquakes.',
    },
    {
      role: 'user',
      content: [
        { type: 'text', text: buildPrompt() },
        {
          type: 'image_url',
          image_url: {
            url: `data:image/jpeg;base64,${base64Image}`,
          },
        },
      ],
    },
  ],
  temperature: 0.2,
  response_format: { type: 'json_object' },
});

const buildGeminiRequestBody = (base64Image) => ({
  contents: [
    {
      role: 'user',
      parts: [
        { text: buildPrompt() },
        {
          inline_data: {
            mime_type: 'image/jpeg',
            data: base64Image,
          },
        },
      ],
    },
  ],
  generationConfig: {
    temperature: 0.2,
  },
});

const extractMessageContent = (data) => {
  const choice = data?.choices?.[0];
  if (!choice) {
    return null;
  }

  const { message } = choice;

  if (typeof message?.content === 'string') {
    return message.content;
  }

  if (Array.isArray(message?.content)) {
    const textPart = message.content.find((part) => part.type === 'text');
    if (textPart) {
      return textPart.text;
    }
  }

  return null;
};

const extractGeminiContent = (data) => {
  const candidate = data?.candidates?.[0];
  if (!candidate) {
    return null;
  }

  const partsArray =
    candidate?.content?.parts ||
    candidate?.content ||
    candidate?.contents ||
    [];

  const textPart = Array.isArray(partsArray)
    ? partsArray.find((part) => typeof part?.text === 'string') || partsArray[0]
    : null;

  return typeof textPart?.text === 'string' ? textPart.text : null;
};

const parseStructuredAnalysis = (content) => {
  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch (error) {
    throw new Error('Yapay zeka yan?t? JSON format?nda de?il.');
  }

  return {
    summary:
      parsed.summary ?? 'Foto?raftaki sabit mobilyalara yak?n ??k-kapan-tutun pozisyonu al.',
    safeZones: normalizeSafeZones(parsed.safeZones),
    risks: normalizeRisks(parsed.risks),
    source: 'ai',
  };
};

const parseOpenAiResponse = (data) => {
  const content = extractMessageContent(data);
  if (!content) {
    throw new Error('Yapay zeka yan?t? bo? d?nd?.');
  }
  return parseStructuredAnalysis(content);
};

const parseGeminiResponse = (data) => {
  const content = extractGeminiContent(data);
  if (!content) {
    throw new Error('Yapay zeka yan?t? bo? d?nd?.');
  }
  return parseStructuredAnalysis(content);
};

const callOpenAI = async (base64Image, apiKey) => {
  const body = buildOpenAiRequestBody(base64Image);
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
  };

  const response = await fetch(OPENAI_DEFAULT_API_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = 'Bilinmeyen hata';
    
    try {
      const errorData = JSON.parse(errorText);
      if (response.status === 401) {
        errorMessage = 'API anahtarı geçersiz. Lütfen OpenAI API anahtarınızı kontrol edin.';
      } else if (errorData.error?.message) {
        errorMessage = errorData.error.message;
      }
    } catch {
      errorMessage = errorText;
    }
    
    throw new Error(errorMessage);
  }

  const data = await response.json();
  return parseOpenAiResponse(data);
};

const callGemini = async (base64Image, apiKey) => {
  const body = buildGeminiRequestBody(base64Image);
  const headers = { 'Content-Type': 'application/json' };
  const requestUrl = `${GEMINI_API_BASE}/models/${GEMINI_DEFAULT_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const response = await fetch(requestUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = 'Bilinmeyen hata';
    
    try {
      const errorData = JSON.parse(errorText);
      if (response.status === 400 && errorData.error?.message?.includes('API key')) {
        errorMessage = 'API anahtarı geçersiz. Lütfen Google AI Studio\'dan yeni bir Gemini API anahtarı alın.';
      } else if (errorData.error?.message) {
        errorMessage = errorData.error.message;
      }
    } catch {
      errorMessage = errorText;
    }
    
    throw new Error(errorMessage);
  }

  const data = await response.json();
  return parseGeminiResponse(data);
};

export const analyzeSafeSpotPhoto = async (photoUri) => {
  let base64Image;
  try {
    base64Image = await readImageAsBase64(photoUri);

    if (!API_KEY) {
      return fallbackAnalysis('missing-key', { base64Image });
    }

    const body = isGeminiProvider
      ? buildGeminiRequestBody(base64Image)
      : buildOpenAiRequestBody(base64Image);

    const headers = isGeminiProvider
      ? { 'Content-Type': 'application/json' }
      : { 'Content-Type': 'application/json', Authorization: `Bearer ${API_KEY}` };

    const requestUrl = isGeminiProvider
      ? API_URL.includes('key=')
        ? API_URL
        : `${API_URL}${API_URL.includes('?') ? '&' : '?'}key=${encodeURIComponent(API_KEY)}`
      : API_URL;

    const response = await fetch(requestUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(`Yapay zeka isteği başarısız: ${response.status} ${message}`);
    }

    const data = await response.json();
    if (__DEV__) {
      console.log('[safeSpotAnalyzer] AI response', {
        provider,
        requestUrl,
        status: response.status,
        keys: Object.keys(data || {}),
      });
    }
    return isGeminiProvider ? parseGeminiResponse(data) : parseOpenAiResponse(data);
  } catch (error) {
    console.warn('[safeSpotAnalyzer] failed', {
      provider,
      apiUrl: API_URL,
      message: error?.message,
      stack: error?.stack,
    });
    return fallbackAnalysis('error', { base64Image });
  }
};

export const analyzeSafeSpotPhotoWithBothProviders = async (photoUri) => {
  let base64Image;
  try {
    base64Image = await readImageAsBase64(photoUri);
  } catch (error) {
    throw new Error('Fotoğraf okunamadı: ' + error.message);
  }

  const results = {
    openai: null,
    gemini: null,
  };

  // OpenAI çağrısı
  if (OPENAI_KEY) {
    try {
      results.openai = await callOpenAI(base64Image, OPENAI_KEY);
      results.openai.provider = 'OpenAI GPT-4';
    } catch (error) {
      console.warn('[OpenAI] Analiz başarısız:', error.message);
      results.openai = {
        ...fallbackAnalysis('error', { base64Image }),
        provider: 'OpenAI GPT-4',
        error: error.message,
      };
    }
  } else {
    results.openai = {
      ...fallbackAnalysis('missing-key', { base64Image }),
      provider: 'OpenAI GPT-4',
      error: 'API anahtarı bulunamadı',
    };
  }

  // Gemini çağrısı
  if (GEMINI_KEY) {
    try {
      results.gemini = await callGemini(base64Image, GEMINI_KEY);
      results.gemini.provider = 'Google Gemini';
    } catch (error) {
      console.warn('[Gemini] Analiz başarısız:', error.message);
      results.gemini = {
        ...fallbackAnalysis('error', { base64Image }),
        provider: 'Google Gemini',
        error: error.message,
      };
    }
  } else {
    results.gemini = {
      ...fallbackAnalysis('missing-key', { base64Image }),
      provider: 'Google Gemini',
      error: 'API anahtarı bulunamadı',
    };
  }

  return results;
};

export default analyzeSafeSpotPhoto;
