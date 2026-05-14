import crypto from 'crypto';

export async function deleteCloudinaryMedia(mediaUrl: string) {
  try {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME || 'dm6nsathe';
    const apiKey = process.env.CLOUDINARY_API_KEY || '441661358918689';
    const apiSecret = process.env.CLOUDINARY_API_SECRET || 'EWj8w2BB4-eJd-9jVgJ9ohe9uEs';

    if (!cloudName || !apiKey || !apiSecret) {
      console.warn('Cloudinary credentials missing, skipping deletion');
      return { success: false, error: 'Credentials missing' };
    }

    // Extract public_id from URL
    // https://res.cloudinary.com/cloud_name/image/upload/v1234567890/folder/public_id.jpg
    const urlParts = mediaUrl.split('/');
    const uploadIndex = urlParts.indexOf('upload');
    if (uploadIndex === -1) return { success: false, error: 'Invalid Cloudinary URL' };

    // The public_id starts after the version (v123...) or directly after 'upload'
    let publicIdWithExt = '';
    if (urlParts[uploadIndex + 1].startsWith('v')) {
      publicIdWithExt = urlParts.slice(uploadIndex + 2).join('/');
    } else {
      publicIdWithExt = urlParts.slice(uploadIndex + 1).join('/');
    }

    const publicId = publicIdWithExt.split('.')[0];
    const timestamp = Math.round(new Date().getTime() / 1000);
    const paramsToSign = `public_id=${publicId}&timestamp=${timestamp}`;
    
    const signature = crypto
      .createHash('sha1')
      .update(paramsToSign + apiSecret)
      .digest('hex');

    const formData = new FormData();
    formData.append('public_id', publicId);
    formData.append('timestamp', timestamp.toString());
    formData.append('api_key', apiKey);
    formData.append('signature', signature);

    const resp = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, {
      method: 'POST',
      body: formData,
    });

    const result = await resp.json();
    console.log('[Cloudinary] Deletion result:', result);
    
    return { success: result.result === 'ok', result };
  } catch (error: any) {
    console.error('[Cloudinary] Error deleting media:', error);
    return { success: false, error: error.message };
  }
}
