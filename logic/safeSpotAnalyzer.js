import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system/legacy';

const getEnvValue = (key) => {
  const extra = Constants?.expoConfig?.extra ?? {};
  return extra[key] ?? process.env?.[key];
};

const PROVIDER =
  getEnvValue('EXPO_PUBLIC_SAFE_SPOT_PROVIDER') ??
  getEnvValue('safeSpotProvider') ??
  'openai';

const MODEL_NAME =
  getEnvValue('EXPO_PUBLIC_SAFE_SPOT_MODEL') ??
  getEnvValue('safeSpotModel') ??
  (PROVIDER === 'gemini' ? 'gemini-2.0-flash-exp' : 'gpt-4o-mini');

const GEMINI_KEY =
  getEnvValue('EXPO_PUBLIC_GEMINI_API_KEY') ??
  getEnvValue('safeSpotGeminiKey');

const OPENAI_KEY =
  getEnvValue('EXPO_PUBLIC_OPENAI_API_KEY') ??
  getEnvValue('safeSpotOpenAiKey');

const API_KEY = PROVIDER === 'gemini' ? GEMINI_KEY : OPENAI_KEY;

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

// ── Yardımcılar ────────────────────────────────────────────────────────────

const readImageAsBase64 = async (uri) => {
  if (!uri) throw new Error('Fotoğraf bulunamadı');
  try {
    return await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
  } catch (error) {
    throw new Error(`Fotoğraf okunamadı: ${error.message}`);
  }
};

const clampBounds = (bounds, imgW, imgH) => {
  const x = Math.max(0, Math.min(Number(bounds.x) || 0, imgW - 10));
  const y = Math.max(0, Math.min(Number(bounds.y) || 0, imgH - 10));
  const width = Math.max(10, Math.min(Number(bounds.width) || 60, imgW - x));
  const height = Math.max(10, Math.min(Number(bounds.height) || 80, imgH - y));
  return { x, y, width, height };
};

const parseSafeZones = (safeZones = [], imgW, imgH) =>
  safeZones
    .map((zone, i) => {
      const hasBounds = zone.bounds && typeof zone.bounds === 'object';
      const bounds = hasBounds ? clampBounds(zone.bounds, imgW, imgH) : null;
      if (bounds && (bounds.width < 5 || bounds.height < 5)) return null;
      return {
        id: zone.id ?? `zone-${i}`,
        label: zone.label ?? 'Güvenli Alan',
        guidance: zone.guidance ?? 'Çök-kapan-tutun pozisyonunu uygula.',
        confidence: Math.max(0, Math.min(1, Number(zone.confidence ?? 0.5))),
        priority: Number(zone.priority ?? i + 1),
        bounds,
      };
    })
    .filter(Boolean);

const parseRisks = (risks = []) =>
  risks.map((risk, i) => ({
    id: risk.id ?? `risk-${i}`,
    label: risk.label ?? 'Riskli Bölge',
    detail: risk.detail ?? 'Bu bölgeden uzak dur.',
  }));

// ── Örnek veri (API yoksa) ─────────────────────────────────────────────────

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
    guidance: 'Alçak bir koltuk ya da kanepenin YANINA (altına değil) cenin pozisyonunda çök. Kanepe çökme boşluğu yaratır.',
    confidence: 0.3,
    priority: 2,
    bounds: null,
  },
  {
    id: 'guide-wall',
    label: 'İç Duvar Köşesi',
    guidance: 'İki iç duvarın birleştiği köşeye geç, başını ve enseni kollarınla koru. Dışa bakan duvarlardan uzak dur.',
    confidence: 0.3,
    priority: 3,
    bounds: null,
  },
];

const FALLBACK_RISKS = [
  { id: 'risk-windows', label: 'Pencere ve Cam Yüzeyler', detail: 'Depremde cam kırılır ve büyük parçalar fırlar. En az 1.5 metre uzak kal.' },
  { id: 'risk-wardrobe', label: 'Sabitlenmemiş Yüksek Mobilya', detail: 'Dolap, kitaplık ve vitrinin devrilme kuvveti bir insanı ezer. Önünde durma.' },
  { id: 'risk-lights', label: 'Tavan Armatürleri', detail: 'Avize, sarkıt lamba ve fanlar sarılarak düşer. Altında bekleme.' },
];

const fallbackAnalysis = (reason) => ({
  summary: 'Gerçek zamanlı analiz yapılamadı. En yakın sağlam masanın altına gir; yoksa alçak bir koltuk yanına cenin pozisyonunda çök. Pencerelerden ve yüksek mobilyalardan uzak dur.',
  notice:
    reason === 'missing-key'
      ? 'Yapay zeka anahtarı tanımlı olmadığı için analiz yapılamadı. Aşağıda genel deprem güvenliği rehberi gösteriliyor.'
      : 'Fotoğraf analiz edilirken hata oluştu. Genel rehber gösteriliyor.',
  safeZones: FALLBACK_ZONES,
  risks: FALLBACK_RISKS,
  source: reason === 'missing-key' ? 'fallback-missing-key' : 'fallback-error',
  provider: null,
  imageWidth: null,
  imageHeight: null,
});

// ── Prompt ─────────────────────────────────────────────────────────────────

const buildPrompt = (imageWidth, imageHeight) => `
You are an earthquake safety expert. Analyze this room photo and identify the safest spots to apply "Drop, Cover, and Hold On" technique.

IMAGE SIZE: ${imageWidth} × ${imageHeight} pixels.
COORDINATE SYSTEM: Origin (0,0) is TOP-LEFT. x increases RIGHT, y increases DOWN. All values are in PIXELS.

═══ SAFE SPOT PRIORITY (use this exact order) ═══

PRIORITY 1 — Under a sturdy table or desk (BEST)
  Person crouches UNDER the table, holds one leg firmly.
  The table top shields from falling debris (ceiling plaster, light fixtures, small objects).
  Look for: dining tables, coffee tables, desks, heavy side tables with solid tops.
  bounds = the floor space UNDER the table where a person's body fits (~60×80 cm).

PRIORITY 2 — Beside a heavy, low sofa or armchair (GOOD)
  Person crouches in fetal position NEXT TO (not under) the sofa, ideally between sofa and an interior wall.
  The sofa mass creates a survival void if the ceiling partially collapses.
  Important: must be LOW enough that person is beside it, not under a raised sofa frame.
  bounds = the floor area immediately beside the sofa where the person would crouch.

PRIORITY 3 — Corner of two interior walls (ACCEPTABLE)
  Person crouches facing the corner, arms over head and neck.
  Interior walls (not exterior-facing) provide the most structural integrity.
  Only use if no furniture options exist AND no shelves/windows are nearby.
  bounds = the corner floor area (~60×60 cm).

PRIORITY 4 — Beside a structural column (LAST RESORT)
  Only if none of the above are available in the visible space.

═══ NEVER RECOMMEND THESE LOCATIONS ═══
- Within 1.5m of any window or glass door (glass shatters with force)
- Near tall unsecured furniture: wardrobes, bookshelves, display cases (topple and crush)
- Under or near ceiling fixtures: chandeliers, pendant lights, ceiling fans (fall risk)
- Near exterior walls (first structural elements to fail)
- Kitchen/pantry areas (shelves violently empty)
- Near large mirrors or heavy framed art (glass and impact)
- Near televisions, monitors on stands (topple and screen shatter)
- Near fireplaces (chimney collapse)

═══ RULES FOR bounds ═══
- bounds is where the PERSON CROUCHES — their body footprint on the floor (~60-100px wide, ~80-120px tall at this image scale)
- NOT the whole furniture piece. Just where the human body goes.
- Estimate pixel positions carefully from what you actually see.
- If you are not confident about a zone's position, set confidence below 0.6 and still try.
- Do NOT invent zones for furniture you cannot clearly see.

Respond ONLY with valid JSON, no extra text:
{
  "summary": "Turkish: 1-2 sentences describing the room and your single strongest recommendation",
  "safeZones": [
    {
      "id": "zone-1",
      "label": "Turkish label referencing the specific furniture (e.g. 'Ahşap Masanın Altı')",
      "priority": 1,
      "guidance": "Turkish: Exactly what to do — reference a visible landmark so the person knows where to go",
      "confidence": 0.85,
      "bounds": { "x": 120, "y": 300, "width": 90, "height": 110 }
    }
  ],
  "risks": [
    {
      "id": "risk-1",
      "label": "Turkish risk label",
      "detail": "Turkish: Why this specific visible element is dangerous"
    }
  ]
}

Return 1 to 3 safe zones maximum. Fewer precise zones are better than many imprecise ones.
`;

// ── Gemini API ─────────────────────────────────────────────────────────────

const callGemini = async (base64Image, apiKey, imgW, imgH) => {
  const url = `${GEMINI_API_BASE}/${MODEL_NAME}:generateContent?key=${apiKey}`;
  const body = {
    contents: [{
      parts: [
        { text: buildPrompt(imgW, imgH) },
        { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
      ],
    }],
    generationConfig: {
      temperature: 0.1,
      responseMimeType: 'application/json',
    },
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Gemini API hatası ${response.status}: ${text.slice(0, 200)}`);
  }

  const data = await response.json();
  const content = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!content) throw new Error('Gemini yanıtı boş döndü.');

  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error('Gemini yanıtı JSON formatında değil.');
  }

  return {
    summary: parsed.summary ?? 'En yakın sağlam mobilyanın yanına çök-kapan-tutun pozisyonunu uygula.',
    safeZones: parseSafeZones(parsed.safeZones ?? [], imgW, imgH),
    risks: parseRisks(parsed.risks ?? []),
    source: 'ai',
    provider: `Gemini ${MODEL_NAME}`,
    imageWidth: imgW,
    imageHeight: imgH,
  };
};

// ── OpenAI API ─────────────────────────────────────────────────────────────

const callOpenAI = async (base64Image, apiKey, imgW, imgH) => {
  const openAiModel = MODEL_NAME.startsWith('gemini') ? 'gpt-4o-mini' : MODEL_NAME;
  const body = {
    model: openAiModel,
    messages: [
      {
        role: 'system',
        content: 'You are an earthquake safety expert. Analyze room photos and identify precise safe spots. Always respond with valid JSON only.',
      },
      {
        role: 'user',
        content: [
          { type: 'text', text: buildPrompt(imgW, imgH) },
          { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64Image}`, detail: 'high' } },
        ],
      },
    ],
    temperature: 0.1,
    response_format: { type: 'json_object' },
  };

  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    let msg = text;
    try {
      const err = JSON.parse(text);
      msg = response.status === 401
        ? 'OpenAI API anahtarı geçersiz.'
        : (err.error?.message ?? text);
    } catch { /* ignore */ }
    throw new Error(`OpenAI API hatası: ${msg}`);
  }

  const data = await response.json();
  const choice = data?.choices?.[0];
  const rawContent = typeof choice?.message?.content === 'string'
    ? choice.message.content
    : choice?.message?.content?.find?.((p) => p.type === 'text')?.text;

  if (!rawContent) throw new Error('OpenAI yanıtı boş döndü.');

  let parsed;
  try {
    parsed = JSON.parse(rawContent);
  } catch {
    throw new Error('OpenAI yanıtı JSON formatında değil.');
  }

  return {
    summary: parsed.summary ?? 'En yakın sağlam mobilyanın yanına çök-kapan-tutun pozisyonunu uygula.',
    safeZones: parseSafeZones(parsed.safeZones ?? [], imgW, imgH),
    risks: parseRisks(parsed.risks ?? []),
    source: 'ai',
    provider: `OpenAI ${openAiModel}`,
    imageWidth: imgW,
    imageHeight: imgH,
  };
};

// ── Ana export ─────────────────────────────────────────────────────────────

// imageDimensions: { width, height } — fotoğrafın orijinal piksel boyutu
export const analyzeSafeSpotPhoto = async (photoUri, imageDimensions) => {
  const imgW = imageDimensions?.width || 1080;
  const imgH = imageDimensions?.height || 1440;

  if (!API_KEY) {
    return fallbackAnalysis('missing-key');
  }

  let base64Image;
  try {
    base64Image = await readImageAsBase64(photoUri);
  } catch (error) {
    console.warn('[safeSpot] Fotoğraf okunamadı:', error.message);
    return fallbackAnalysis('error');
  }

  try {
    if (PROVIDER === 'gemini') {
      return await callGemini(base64Image, API_KEY, imgW, imgH);
    }
    return await callOpenAI(base64Image, API_KEY, imgW, imgH);
  } catch (primaryError) {
    console.warn(`[safeSpot] ${PROVIDER} başarısız:`, primaryError.message);

    if (PROVIDER === 'gemini' && OPENAI_KEY) {
      try {
        return await callOpenAI(base64Image, OPENAI_KEY, imgW, imgH);
      } catch (fallbackError) {
        console.warn('[safeSpot] OpenAI fallback da başarısız:', fallbackError.message);
      }
    }

    return { ...fallbackAnalysis('error'), error: primaryError.message };
  }
};

export default analyzeSafeSpotPhoto;
