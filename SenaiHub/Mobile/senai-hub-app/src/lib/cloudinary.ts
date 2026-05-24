const cloudName = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME ?? '';
const uploadPreset = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET ?? '';

export const cloudinaryConfig = {
  cloudName,
  uploadPreset,
};

export const isCloudinaryConfigured = Boolean(cloudName && uploadPreset);

export interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
  resource_type: string;
  format: string;
  bytes: number;
}

export async function uploadToCloudinary(
  uri: string,
  resourceType: 'image' | 'video' | 'raw' = 'image'
): Promise<CloudinaryUploadResult> {
  if (!isCloudinaryConfigured) {
    throw new Error('Cloudinary não configurado. Verifique o arquivo .env');
  }

  const formData = new FormData();
  const filename = uri.split('/').pop() ?? 'upload';

  formData.append('file', {
    uri,
    type: resourceType === 'raw' ? 'application/pdf' : 'image/jpeg',
    name: filename,
  } as unknown as Blob);
  formData.append('upload_preset', uploadPreset);

  const endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;
  const response = await fetch(endpoint, { method: 'POST', body: formData });

  if (!response.ok) {
    throw new Error('Falha ao enviar arquivo para o Cloudinary');
  }

  return response.json();
}
