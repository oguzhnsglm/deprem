import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system';

const OPENAI_DEFAULT_MODEL = 'gpt-4o-mini-high';
const OPENAI_DEFAULT_API_URL = 'https://api.openai.com/v1/chat/completions';
const GEMINI_DEFAULT_MODEL = 'gemini-1.5-pro';
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
  return FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
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
You are an earthquake preparedness assistant. Analyse the photo and identify SAFE zones where the "drop, cover, hold on"
technique can be realistically performed. Also find dangerous spots. Respond ONLY with JSON using:
{
  "summary": "one paragraph in Turkish describing the room and safest options",
  "safeZones": [
    {
      "id": "stable-table",
      "label": "Masa Yanı",
      "confidence": 0.88,
      "guidance": "Brief Turkish guidance",
      "bounds": { "x": 0.21, "y": 0.35, "width": 0.32, "height": 0.28 }
    }
  ],
  "risks": [
    { "id": "window-area", "label": "Cam", "detail": "Short Turkish warning" }
  ]
}
Bounds MUST be between 0 and 1 and describe relative box coordinates.
`;

const buildOpenAiRequestBody = (base64Image) => ({
  model: MODEL_NAME,
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
    responseMimeType: 'application/json',
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
      throw new Error(`Yapay zeka iste?i ba?ar?s?z: ${response.status} ${message}`);
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

export default analyzeSafeSpotPhoto;
