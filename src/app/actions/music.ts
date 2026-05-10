'use server';

const JAMENDO_CLIENT_ID = '34946938';
const TEST_CLIENT_ID = '709fa152';

export async function searchMusicAction(query: string) {
  try {
    const url = `https://api.jamendo.com/v3.0/tracks?client_id=${JAMENDO_CLIENT_ID}&format=json&limit=20&search=${encodeURIComponent(query)}&audioformat=mp32`;
    let res = await fetch(url);
    let data = await res.json();
    
    // Check if the primary request failed or returned no results
    const needsFallback = !data.results || data.results.length === 0 || (data.headers && data.headers.status === 'failed');

    if (needsFallback && JAMENDO_CLIENT_ID !== TEST_CLIENT_ID) {
      const fallbackUrl = `https://api.jamendo.com/v3.0/tracks?client_id=${TEST_CLIENT_ID}&format=json&limit=20&search=${encodeURIComponent(query)}&audioformat=mp32`;
      res = await fetch(fallbackUrl);
      data = await res.json();
    }

    return { 
      success: true, 
      results: data.results || [],
      usingFallback: (data.headers && data.headers.status === 'success' && data.results && data.results.length > 0 && res.url.includes(TEST_CLIENT_ID))
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getFeaturedMusicAction() {
  try {
    const url = `https://api.jamendo.com/v3.0/tracks?client_id=${JAMENDO_CLIENT_ID}&format=json&limit=10&order=boostratio_month&audioformat=mp32`;
    let res = await fetch(url);
    let data = await res.json();

    // Check if the primary request failed or returned no results
    const needsFallback = !data.results || data.results.length === 0 || (data.headers && data.headers.status === 'failed');

    if (needsFallback && JAMENDO_CLIENT_ID !== TEST_CLIENT_ID) {
      const fallbackUrl = `https://api.jamendo.com/v3.0/tracks?client_id=${TEST_CLIENT_ID}&format=json&limit=10&order=boostratio_month&audioformat=mp32`;
      res = await fetch(fallbackUrl);
      data = await res.json();
    }

    return { 
      success: true, 
      results: data.results || [],
      usingFallback: (data.headers && data.headers.status === 'success' && data.results && data.results.length > 0 && res.url.includes(TEST_CLIENT_ID))
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
