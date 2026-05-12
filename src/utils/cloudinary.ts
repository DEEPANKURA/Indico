import { getCloudinarySignatureAction } from '@/app/actions/cloudinary';

export async function uploadToCloudinary(file: File, folder: string = 'indico'): Promise<string> {
  const sigData = await getCloudinarySignatureAction(folder);
  
  if (!sigData.success || !sigData.cloudName || !sigData.apiKey) {
    throw new Error(sigData.error || 'Cloudinary configuration is missing.');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('api_key', sigData.apiKey);
  formData.append('timestamp', sigData.timestamp!.toString());
  formData.append('signature', sigData.signature!);
  formData.append('folder', sigData.folder!);

  // Determine resource_type based on file type. Cloudinary supports 'auto', 'image', 'video', 'raw'
  // Using 'auto' is highly recommended as it automatically handles photos, videos, and reels perfectly.
  const uploadUrl = `https://api.cloudinary.com/v1_1/${sigData.cloudName}/auto/upload`;

  const response = await fetch(uploadUrl, {
    method: 'POST',
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    console.error('Cloudinary upload error details:', data);
    throw new Error(data.error?.message || 'Failed to upload media to Cloudinary.');
  }

  const secureUrl = data.secure_url;
  // Apply premium automatic intelligent lossless/perceptual compression (f_auto,q_auto)
  // slashes file sizes by up to 70% while preserving perfect visual quality
  if (secureUrl.includes('/upload/')) {
    return secureUrl.replace('/upload/', '/upload/f_auto,q_auto/');
  }
  return secureUrl;
}
