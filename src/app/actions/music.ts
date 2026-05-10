'use server';

const JAMENDO_CLIENT_ID = '34946938';
const JAMENDO_CLIENT_SECRET = '42090c6e57df5edde3db58c49c0204fd';

export async function searchMusicAction(query: string) {
  try {
    const res = await fetch(`https://api.jamendo.com/v3.0/tracks/?client_id=${JAMENDO_CLIENT_ID}&format=jsonpretty&limit=20&search=${encodeURIComponent(query)}&include=musicinfo&audioformat=mp32`);
    const data = await res.json();
    return { success: true, results: data.results || [] };
  } catch (error: any) {
    console.error('Jamendo search error:', error);
    return { success: false, error: error.message };
  }
}

export async function getFeaturedMusicAction() {
  try {
    const res = await fetch(`https://api.jamendo.com/v3.0/tracks/?client_id=${JAMENDO_CLIENT_ID}&format=jsonpretty&limit=10&order=boostratio_month&audioformat=mp32`);
    const data = await res.json();
    return { success: true, results: data.results || [] };
  } catch (error: any) {
    console.error('Jamendo featured error:', error);
    return { success: false, error: error.message };
  }
}
