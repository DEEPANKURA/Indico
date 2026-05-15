'use server';

export async function getCloudinarySignatureAction(folder: string = 'indico') {
  try {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME || 'dm6nsathe';
    const apiKey = process.env.CLOUDINARY_API_KEY || '441661358918689';
    const apiSecret = process.env.CLOUDINARY_API_SECRET || 'EWj8w2BB4-eJd-9jVgJ9ohe9uEs';

    if (!cloudName || !apiKey || !apiSecret) {
      return {
        success: false,
        error: 'Cloudinary configuration is missing.',
      };
    }

    const timestamp = Math.round(new Date().getTime() / 1000);
    const paramsToSign = `folder=${folder}&timestamp=${timestamp}`;
    
    // Use Web Crypto API (SubtleCrypto) for Cloudflare Edge compatibility
    const data = new TextEncoder().encode(paramsToSign + apiSecret);
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const signature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    return {
      success: true,
      timestamp,
      signature,
      cloudName,
      apiKey,
      folder,
    };
  } catch (error: any) {
    console.error('Error generating Cloudinary signature:', error);
    return { success: false, error: error.message };
  }
}
