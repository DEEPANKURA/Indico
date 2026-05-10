'use server';

const JAMENDO_CLIENT_ID = '34946938';

export async function searchMusicAction(query: string) {
  try {
    const url = `https://api.jamendo.com/v3.0/tracks?client_id=${JAMENDO_CLIENT_ID}&format=json&limit=20&search=${encodeURIComponent(query)}&audioformat=mp32`;
    const res = await fetch(url);
    const data = await res.json();
    
    if (data.headers && data.headers.status === 'failed') {
      console.error('Jamendo API Error:', data.headers.error_message);
      return { success: false, error: data.headers.error_message };
    }

    return { 
      success: true, 
      results: data.results || []
    };
  } catch (error: any) {
    console.error('Music Search Exception:', error);
    return { success: false, error: error.message };
  }
}

export async function getFeaturedMusicAction() {
  try {
    const url = `https://api.jamendo.com/v3.0/tracks?client_id=${JAMENDO_CLIENT_ID}&format=json&limit=10&order=boostratio_month&audioformat=mp32`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.headers && data.headers.status === 'failed') {
      console.error('Jamendo API Error:', data.headers.error_message);
      return { success: false, error: data.headers.error_message };
    }

    return { 
      success: true, 
      results: data.results || []
    };
  } catch (error: any) {
    console.error('Music Featured Exception:', error);
    return { success: false, error: error.message };
  }
}
