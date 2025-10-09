import axiosClient from '../axiosClient';

// Frontend translate helper. Calls backend translate endpoint (preferred) or any configured
// translation service. Reads VITE_TRANSLATE_API or falls back to /translations/translate.
const TRANSLATE_API = import.meta.env.VITE_TRANSLATE_API || '/translations/translate';

function extractTranslationFromPayload(payload: any) {
  if (!payload) return '';
  if (typeof payload === 'string') return payload;

  // LibreTranslate shape example:
  // { alternatives: [...], detectedLanguage: {...}, translatedText: '...' }
  if (Array.isArray(payload.alternatives) && payload.alternatives.length > 0) {
    return payload.alternatives[0];
  }

  // Backend wrapper shape (example you provided):
  // { success: true, data: { translations: [ { to: 'ar', translated: ['...'] } ], ... } }
  if (payload && payload.data && Array.isArray(payload.data.translations)) {
    // Prefer any translation entry that contains a usable translated array.
    const tr = payload.data.translations.find((t: any) => Array.isArray(t.translated) && t.translated.length > 0);
    if (tr) return tr.translated[0];
  }

  const maybe = (p: any) => p && (p.translatedText || p.translated_text || p.translation || p.translated_text);
  return maybe(payload) || maybe(payload.data) || (payload.data && typeof payload.data === 'string' ? payload.data : '') || '';
}

export async function translate(text: string, source = 'en', target = 'ar') {
  if (!text) return '';

  try {
    // If TRANSLATE_API is an absolute URL, call it directly (e.g., LibreTranslate)
    if (typeof TRANSLATE_API === 'string' && TRANSLATE_API.match(/^https?:\/\//)) {
      const body: any = { q: text, source: source || 'auto', target, format: 'text' };
      // Allow providing an API key via VITE_TRANSLATE_KEY
      const apiKey = import.meta.env.VITE_TRANSLATE_KEY || '';
      if (apiKey) body.api_key = apiKey;
      // Request a few alternatives when supported
      body.alternatives = 3;

      const res = await fetch(TRANSLATE_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const payload = await res.json();
      return extractTranslationFromPayload(payload);
    }

    // Otherwise, call the app's backend translation endpoint via axiosClient
    const res = await axiosClient.post(TRANSLATE_API, { q: text, source, target, format: 'text' });
    return extractTranslationFromPayload(res.data);
  } catch (err) {
    console.warn('translate api error', err);
    return '';
  }
}

export default translate;
