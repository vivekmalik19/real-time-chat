import crypto from 'crypto';
import CommentTranslationCache from '../models/CommentTranslationCache.js';

export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'Hindi (हिन्दी)' },
  { code: 'es', name: 'Spanish (Español)' },
  { code: 'fr', name: 'French (Français)' },
  { code: 'de', name: 'German (Deutsch)' },
  { code: 'ja', name: 'Japanese (日本語)' },
  { code: 'zh', name: 'Chinese (中文)' },
  { code: 'ar', name: 'Arabic (العربية)' },
  { code: 'ru', name: 'Russian (Русский)' },
  { code: 'pt', name: 'Portuguese (Português)' },
];

/**
 * Calculates a SHA256 hash of the content string
 */
export function hashText(text) {
  return crypto.createHash('sha256').update(text.trim()).digest('hex');
}

/**
 * Translates text into targetLanguage using the configured translation provider
 * Handles caching, credential checks, network timeouts, and graceful error handling.
 */
export async function translateComment({
  commentId,
  text,
  sourceLang = 'auto',
  targetLanguage = 'en',
}) {
  if (!text || !text.trim()) {
    throw new Error('Text to translate cannot be empty');
  }

  const normalizedTarget = (targetLanguage || 'en').toLowerCase().trim();
  const sourceHash = hashText(text);

  // 1. Check Translation Cache in MongoDB
  if (commentId) {
    try {
      const cached = await CommentTranslationCache.findOne({
        commentId,
        targetLanguage: normalizedTarget,
        sourceHash,
      });

      if (cached && cached.translatedText) {
        return {
          translatedText: cached.translatedText,
          detectedLanguage: cached.detectedLanguage || sourceLang,
          sourceLanguage: cached.sourceLanguage || sourceLang,
          targetLanguage: normalizedTarget,
          provider: cached.provider,
          cached: true,
        };
      }
    } catch (cacheErr) {
      console.warn('[Translator] Cache check warning:', cacheErr.message);
    }
  }

  // 2. Identify Translation Provider
  const provider = (process.env.TRANSLATION_PROVIDER || 'mymemory').toLowerCase();

  // Check required credentials for enterprise providers
  if (provider === 'google' && !process.env.GOOGLE_TRANSLATION_API_KEY) {
    const err = new Error(
      'Google Cloud Translation credentials missing. Set GOOGLE_TRANSLATION_API_KEY.'
    );
    err.code = 'TRANSLATION_CREDENTIALS_MISSING';
    err.provider = 'google';
    throw err;
  }

  if (provider === 'deepl' && !process.env.DEEPL_API_KEY) {
    const err = new Error('DeepL API credentials missing. Set DEEPL_API_KEY.');
    err.code = 'TRANSLATION_CREDENTIALS_MISSING';
    err.provider = 'deepl';
    throw err;
  }

  let translatedText = null;
  let detectedLanguage = sourceLang;

  // 3. Provider Execution
  if (provider === 'mymemory') {
    const langPair = sourceLang && sourceLang !== 'auto'
      ? `${sourceLang}|${normalizedTarget}`
      : `autodetect|${normalizedTarget}`;

    const endpoint = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${langPair}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout

    try {
      const resp = await fetch(endpoint, {
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!resp.ok) {
        const err = new Error(`Translation provider returned HTTP ${resp.status}`);
        err.code = 'PROVIDER_HTTP_ERROR';
        err.statusCode = resp.status;
        throw err;
      }

      const json = await resp.json();

      if (json.responseStatus !== 200 || !json.responseData?.translatedText) {
        // MyMemory sometimes returns 403 when daily IP quota exceeded
        const err = new Error(
          json.responseDetails || 'MyMemory translation service failed to translate the text.'
        );
        err.code = json.responseStatus === 403 ? 'PROVIDER_QUOTA_EXCEEDED' : 'PROVIDER_ERROR';
        throw err;
      }

      translatedText = json.responseData.translatedText;
      if (json.responseData.detectedLanguage) {
        detectedLanguage = json.responseData.detectedLanguage;
      }
    } catch (fetchErr) {
      clearTimeout(timeoutId);
      if (fetchErr.name === 'AbortError') {
        const err = new Error('Translation request timed out after 6 seconds.');
        err.code = 'PROVIDER_TIMEOUT';
        throw err;
      }
      throw fetchErr;
    }
  } else if (provider === 'mock_test') {
    // Verified test mode for deterministic offline testing
    translatedText = `[Translated to ${normalizedTarget.toUpperCase()}]: ${text}`;
    detectedLanguage = 'en';
  } else {
    const err = new Error(`Unsupported translation provider: ${provider}`);
    err.code = 'UNSUPPORTED_PROVIDER';
    throw err;
  }

  // 4. Cache valid translation
  if (commentId && translatedText) {
    try {
      await CommentTranslationCache.findOneAndUpdate(
        { commentId, targetLanguage: normalizedTarget, sourceHash },
        {
          commentId,
          sourceHash,
          sourceLanguage: sourceLang,
          targetLanguage: normalizedTarget,
          translatedText,
          detectedLanguage,
          provider,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    } catch (saveErr) {
      console.warn('[Translator] Failed to cache translation in DB:', saveErr.message);
    }
  }

  return {
    translatedText,
    detectedLanguage,
    sourceLanguage: sourceLang,
    targetLanguage: normalizedTarget,
    provider,
    cached: false,
  };
}
