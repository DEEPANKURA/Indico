import { getCloudinarySignatureAction } from '@/app/actions/cloudinary';

export async function uploadToCloudinary(file: File, folder: string = 'indico'): Promise<string> {
  const sigData = await getCloudinarySignatureAction(folder);
  
  if (!sigData.success || !sigData.cloudName || !sigData.apiKey) {
    throw new Error(sigData.error || 'Cloudinary configuration is missing.');
  }

  // Use universal /auto/upload routing endpoint so Cloudinary dynamically detects container structures
  const isVideo = file.type.startsWith('video/') || file.name?.match(/\.(mp4|webm|mov|ogg)$/i);
  const uploadUrl = `https://api.cloudinary.com/v1_1/${sigData.cloudName}/auto/upload`;
  const totalSize = file.size;
  
  // Standard single upload payload threshold: 100MB natively supported on standard Cloudinary tiers
  const singleUploadLimit = 100 * 1024 * 1024; 

  let finalSecureUrl = '';

  // Route files up to 100MB through native foolproof standard POST upload to prevent chunk range rejections
  if (totalSize <= singleUploadLimit) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', sigData.apiKey);
    formData.append('timestamp', sigData.timestamp!.toString());
    formData.append('signature', sigData.signature!);
    formData.append('folder', sigData.folder!);

    const response = await fetch(uploadUrl, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Cloudinary upload error details:', data);
      throw new Error(data.error?.message || 'Failed to upload media to Cloudinary.');
    }

    finalSecureUrl = data.secure_url;
  } else {
    // Fallback chunked streaming for files exceeding 100MB single payload caps
    const chunkSize = 10 * 1024 * 1024;
    const uniqueUploadId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    for (let start = 0; start < totalSize; start += chunkSize) {
      const end = Math.min(start + chunkSize, totalSize);
      const chunk = file.slice(start, end);

      const formData = new FormData();
      formData.append('file', chunk, file.name || 'blob');
      formData.append('api_key', sigData.apiKey);
      formData.append('timestamp', sigData.timestamp!.toString());
      formData.append('signature', sigData.signature!);
      formData.append('folder', sigData.folder!);

      const headers = {
        'X-Unique-Upload-Id': uniqueUploadId,
        'Content-Range': `bytes ${start}-${end - 1}/${totalSize}`,
      };

      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers,
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        console.error(`Cloudinary chunk upload error at range ${start}-${end - 1}:`, data);
        throw new Error(data.error?.message || 'Failed to upload large media chunk to Cloudinary.');
      }

      if (data.secure_url) {
        finalSecureUrl = data.secure_url;
      }
    }
  }

  if (!finalSecureUrl) {
    throw new Error('Upload completed but no secure URL was returned from Cloudinary.');
  }

  // Apply premium automatic intelligent lossless/perceptual compression (f_auto,q_auto)
  // slashes file sizes by up to 70% while preserving perfect visual quality
  if (finalSecureUrl.includes('/upload/') && !isVideo) {
    return finalSecureUrl.replace('/upload/', '/upload/f_auto,q_auto/');
  }
  
  return finalSecureUrl;
}
