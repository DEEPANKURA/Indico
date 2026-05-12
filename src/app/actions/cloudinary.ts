'use server';

import crypto from 'crypto';

export async function getCloudinarySignatureAction(folder: string = 'indico') {
  try {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      return {
        success: false,
        error: 'Cloudinary environment variables are missing. Please configure CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in your .env.local file.',
      };
    }

    const timestamp = Math.round(new Date().getTime() / 1000);

    // Parameters to sign must be sorted alphabetically
    // folder=indico&timestamp=1234567890
    const paramsToSign = `folder=${folder}&timestamp=${timestamp}`;
    
    const signature = crypto
      .createHash('sha1')
      .update(paramsToSign + apiSecret)
      .digest('hex');

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
