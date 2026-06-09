require('dotenv').config();

const appJson = require('./app.json');

module.exports = () => ({
  ...appJson,
  expo: {
    ...appJson.expo,
    extra: {
      ...appJson.expo.extra,
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      azureTranslatorEndpoint:
        process.env.EXPO_PUBLIC_AZURE_TRANSLATOR_ENDPOINT ??
        process.env.AZURE_TRANSLATOR_ENDPOINT,
      azureTranslatorKey: process.env.EXPO_PUBLIC_AZURE_API,
      azureTranslatorRegion:
        process.env.EXPO_PUBLIC_AZURE_REGION ??
        process.env.AZURE_TRANSLATOR_REGION,
    },
  },
});
