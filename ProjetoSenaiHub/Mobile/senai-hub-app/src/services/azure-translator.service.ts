import Constants from 'expo-constants';
import { getAzureLanguageCode, type AppLanguage } from '@/stores/app.store';

type AzureTranslatorExtra = {
  azureTranslatorEndpoint?: string;
  azureTranslatorKey?: string;
  azureTranslatorRegion?: string;
};

type AzureTranslationResponse = {
  translations?: {
    text?: string;
    to?: string;
  }[];
}[];

const DEFAULT_TRANSLATOR_ENDPOINT = 'https://api.cognitive.microsofttranslator.com';
const FALLBACK_TRANSLATOR_REGIONS = ['brazilsouth'] as const;

function trimEnv(value: string | undefined): string {
  return (value ?? '').trim().replace(/^["']|["']$/g, '');
}

function normalizeRegion(value: string): string {
  const region = value.toLowerCase();
  if (region === 'brazilsouthv') return 'brazilsouth';
  return region;
}

const extra = Constants.expoConfig?.extra as AzureTranslatorExtra | undefined;

const translatorEndpoint = trimEnv(
  extra?.azureTranslatorEndpoint ??
    process.env.EXPO_PUBLIC_AZURE_TRANSLATOR_ENDPOINT ??
    process.env.AZURE_TRANSLATOR_ENDPOINT
) || DEFAULT_TRANSLATOR_ENDPOINT;

const translatorKey = trimEnv(
  extra?.azureTranslatorKey ?? process.env.EXPO_PUBLIC_AZURE_API
);

const configuredRegion = normalizeRegion(trimEnv(
  extra?.azureTranslatorRegion ??
    process.env.EXPO_PUBLIC_AZURE_REGION ??
    process.env.AZURE_TRANSLATOR_REGION
));

let cachedWorkingRegion = '';

export const isAzureTranslatorConfigured = Boolean(translatorKey);

function getTranslatorUrl(targetLanguage: string) {
  const endpoint = translatorEndpoint.replace(/\/+$/, '');
  const params = new URLSearchParams({
    'api-version': '3.0',
    from: 'pt',
    to: targetLanguage,
  });

  return `${endpoint}/translate?${params.toString()}`;
}

function getRegionCandidates() {
  const candidates = [
    configuredRegion,
    cachedWorkingRegion,
    '',
    ...FALLBACK_TRANSLATOR_REGIONS,
  ];

  return candidates.filter((region, index) => candidates.indexOf(region) === index);
}

function buildHeaders(region: string) {
  const headers: Record<string, string> = {
    'Ocp-Apim-Subscription-Key': translatorKey,
    'Content-Type': 'application/json; charset=UTF-8',
  };

  if (region) {
    headers['Ocp-Apim-Subscription-Region'] = region;
  }

  return headers;
}

export async function translateTextsWithAzure(
  texts: string[],
  language: AppLanguage
): Promise<Record<string, string>> {
  const targetLanguage = getAzureLanguageCode(language);
  const uniqueTexts = Array.from(new Set(texts.map((text) => text.trim()).filter(Boolean)));

  if (!targetLanguage || !translatorKey || uniqueTexts.length === 0) {
    return {};
  }

  let lastError: Error | null = null;

  for (const region of getRegionCandidates()) {
    const response = await fetch(getTranslatorUrl(targetLanguage), {
      method: 'POST',
      headers: buildHeaders(region),
      body: JSON.stringify(uniqueTexts.map((Text) => ({ Text }))),
    });

    if (!response.ok) {
      const details = await response.text().catch(() => '');
      lastError = new Error(
        `Azure Translator retornou ${response.status}.${details ? ` ${details}` : ''}`
      );

      if (response.status === 401) {
        continue;
      }

      throw lastError;
    }

    if (region) {
      cachedWorkingRegion = region;
    }

    const data = (await response.json()) as AzureTranslationResponse;

    return uniqueTexts.reduce<Record<string, string>>((translations, sourceText, index) => {
      const translatedText = data[index]?.translations?.[0]?.text?.trim();
      if (translatedText) {
        translations[sourceText] = translatedText;
      }
      return translations;
    }, {});
  }

  throw lastError ?? new Error('Nao foi possivel autenticar no Azure Translator.');
}
