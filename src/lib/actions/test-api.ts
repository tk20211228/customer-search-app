"use server";

export async function testAPIConfiguration() {
  const config = {
    googleSearch: {
      enabled: !!(process.env.GOOGLE_SEARCH_API_KEY && process.env.GOOGLE_SEARCH_ENGINE_ID),
      apiKey: !!process.env.GOOGLE_SEARCH_API_KEY,
      engineId: !!process.env.GOOGLE_SEARCH_ENGINE_ID,
    },
    serper: {
      enabled: !!process.env.SERPER_API_KEY,
      apiKey: !!process.env.SERPER_API_KEY,
    },
    duckduckgo: {
      enabled: true, // Always available
    }
  };

  return {
    configuration: config,
    hasValidApi: config.googleSearch.enabled || config.serper.enabled,
    primaryApi: config.googleSearch.enabled 
      ? 'Google Custom Search' 
      : config.serper.enabled 
        ? 'Serper' 
        : 'DuckDuckGo (Limited)',
  };
}