import { getCloudinarySignatureAction } from '@/app/actions/cloudinary';

/**
 * Upload a file to Cloudinary using a server-signed request.
 * Videos go to /video/upload, images to /image/upload.
 * Uses chunked upload for files > 50MB.
 */
export async function uploadToCloudinary(file: File, folder: string = 'indico'): Promise<string> {
  const sigData = await getCloudinarySignatureAction(folder);

  if (!sigData.success || !sigData.cloudName || !sigData.apiKey) {
    throw new Error(sigData.error || 'Cloudinary configuration is missing.');
  }

  const isVideo = file.type.startsWith('video/') || /\.(mp4|webm|mov|m4v|ogg)$/i.test(file.name);
  const resourceType = isVideo ? 'video' : 'image';
  const uploadUrl = `https://api.cloudinary.com/v1_1/${sigData.cloudName}/${resourceType}/upload`;
  const totalSize = file.size;
  const CHUNK_SIZE = 50 * 1024 * 1024; // 50MB chunks

  // Single upload for files under 50MB
  if (totalSize <= CHUNK_SIZE) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', sigData.apiKey);
    formData.append('timestamp', sigData.timestamp!.toString());
    formData.append('signature', sigData.signature!);
    formData.append('folder', sigData.folder!);

    const response = await fetch(uploadUrl, { method: 'POST', body: formData });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || `Cloudinary upload failed: ${response.status}`);
    }

    return applyImageTransforms(data.secure_url, isVideo);
  }

  // Chunked upload for large files (videos > 50MB)
  const uniqueUploadId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  let finalSecureUrl = '';

  for (let start = 0; start < totalSize; start += CHUNK_SIZE) {
    const end = Math.min(start + CHUNK_SIZE, totalSize);
    const chunk = file.slice(start, end);

    const formData = new FormData();
    formData.append('file', chunk, file.name);
    formData.append('api_key', sigData.apiKey);
    formData.append('timestamp', sigData.timestamp!.toString());
    formData.append('signature', sigData.signature!);
    formData.append('folder', sigData.folder!);

    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'X-Unique-Upload-Id': uniqueUploadId,
        'Content-Range': `bytes ${start}-${end - 1}/${totalSize}`,
      },
      body: formData,
    });

    const data = await response.json();

    if (!response.ok && response.status !== 499) {
      // 499 = chunk received but upload not complete yet (normal for chunked)
      throw new Error(data.error?.message || `Cloudinary chunk upload failed at ${start}-${end}`);
    }

    if (data.secure_url) {
      finalSecureUrl = data.secure_url;
    }
  }

  if (!finalSecureUrl) {
    throw new Error('Cloudinary upload completed but no URL returned.');
  }

  return applyImageTransforms(finalSecureUrl, isVideo);
}

/** Apply f_auto,q_auto optimization for images only (not videos) */
function applyImageTransforms(url: string, isVideo: boolean): string {
  if (!isVideo && url.includes('/upload/')) {
    return url.replace('/upload/', '/upload/f_auto,q_auto/');
  }
  return url;
}
