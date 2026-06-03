import { Platform } from 'react-native';

function trimEnv(value: string | undefined): string {
  return (value ?? '').trim().replace(/^["']|["']$/g, '');
}

const cloudName = trimEnv(process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME);
const uploadPreset = trimEnv(process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET);

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

function getFileName(uri: string, resourceType: 'image' | 'video' | 'raw') {
  const fallback = resourceType === 'image' ? 'upload.jpg' : resourceType === 'video' ? 'upload.mp4' : 'upload.pdf';
  if (uri.startsWith('data:')) return fallback;

  const cleanUri = uri.split('?')[0]?.split('#')[0] ?? '';
  const lastSegment = cleanUri.split('/').pop()?.trim();
  return lastSegment ? decodeURIComponent(lastSegment) : fallback;
}

function getMimeType(filename: string, resourceType: 'image' | 'video' | 'raw') {
  const extension = filename.split('.').pop()?.toLowerCase();
  const byExtension: Record<string, string> = {
    gif: 'image/gif',
    heic: 'image/heic',
    jpeg: 'image/jpeg',
    jpg: 'image/jpeg',
    mp4: 'video/mp4',
    pdf: 'application/pdf',
    png: 'image/png',
    webp: 'image/webp',
  };

  if (extension && byExtension[extension]) return byExtension[extension];
  if (resourceType === 'image') return 'image/jpeg';
  if (resourceType === 'video') return 'video/mp4';
  return 'application/octet-stream';
}

async function appendUploadFile(
  formData: FormData,
  uri: string,
  resourceType: 'image' | 'video' | 'raw'
) {
  const filename = getFileName(uri, resourceType);

  if (Platform.OS === 'web') {
    const blobResponse = await fetch(uri);
    if (!blobResponse.ok) {
      throw new Error('Nao foi possivel ler o arquivo selecionado antes do envio.');
    }

    const blob = await blobResponse.blob();
    formData.append('file', blob, filename);
    return;
  }

  formData.append('file', {
    uri,
    type: getMimeType(filename, resourceType),
    name: filename,
  } as unknown as Blob);
}

async function getCloudinaryError(response: Response) {
  const fallback = `Falha ao enviar arquivo para o Cloudinary (${response.status}).`;
  const body = await response.text().catch(() => '');

  if (!body) return fallback;

  try {
    const parsed = JSON.parse(body) as {
      error?: { message?: string } | string;
      message?: string;
    };
    const message =
      typeof parsed.error === 'string'
        ? parsed.error
        : parsed.error?.message ?? parsed.message;

    return message ? `${fallback} ${message}` : fallback;
  } catch {
    return `${fallback} ${body}`;
  }
}

export async function uploadToCloudinary(
  uri: string,
  resourceType: 'image' | 'video' | 'raw' = 'image'
): Promise<CloudinaryUploadResult> {
  if (!isCloudinaryConfigured) {
    throw new Error('Cloudinary não configurado. Verifique o arquivo .env');
  }

  const formData = new FormData();
  await appendUploadFile(formData, uri, resourceType);
  formData.append('upload_preset', uploadPreset);

  const endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;
  const response = await fetch(endpoint, { method: 'POST', body: formData });

  if (!response.ok) {
    throw new Error(await getCloudinaryError(response));
  }

  return response.json();
}
