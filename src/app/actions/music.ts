'use server';

const JAMENDO_CLIENT_ID = '34946938';
const TEST_CLIENT_ID = '709fa152';

export async function searchMusicAction(query: string) {
  try {
    const url = `https://api.jamendo.com/v3.0/tracks?client_id=${JAMENDO_CLIENT_ID}&format=json&limit=20&search=${encodeURIComponent(query)}&audioformat=mp32`;
    let res = await fetch(url);
    let data = await res.json();
    
    if ((!data.results || data.results.length === 0) && JAMENDO_CLIENT_ID !== TEST_CLIENT_ID) {
      const fallbackUrl = `https://api.jamendo.com/v3.0/tracks?client_id=${TEST_CLIENT_ID}&format=json&limit=20&search=${encodeURIComponent(query)}&audioformat=mp32`;
      res = await fetch(fallbackUrl);
      data = await res.json();
    }

    return { success: true, results: data.results || [] };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getFeaturedMusicAction() {
  try {
    const url = `https://api.jamendo.com/v3.0/tracks?client_id=${JAMENDO_CLIENT_ID}&format=json&limit=10&order=boostratio_month&audioformat=mp32`;
    let res = await fetch(url);
    let data = await res.json();

    if ((!data.results || data.results.length === 0) && JAMENDO_CLIENT_ID !== TEST_CLIENT_ID) {
      const fallbackUrl = `https://api.jamendo.com/v3.0/tracks?client_id=${TEST_CLIENT_ID}&format=json&limit=10&order=boostratio_month&audioformat=mp32`;
      res = await fetch(fallbackUrl);
      data = await res.json();
    }

    return { success: true, results: data.results || [] };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
