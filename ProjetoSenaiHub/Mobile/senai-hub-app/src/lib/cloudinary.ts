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

function getDataUriMimeType(uri: string) {
  const match = uri.match(/^data:([^;,]+)[;,]/);
  return match?.[1]?.toLowerCase();
}

function getExtensionForMimeType(mimeType: string | undefined, resourceType: 'image' | 'video' | 'raw') {
  const byMime: Record<string, string> = {
    'image/gif': 'gif',
    'image/heic': 'heic',
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'video/mp4': 'mp4',
    'application/pdf': 'pdf',
  };

  if (mimeType && byMime[mimeType]) return byMime[mimeType];
  if (resourceType === 'image') return 'jpg';
  if (resourceType === 'video') return 'mp4';
  return 'bin';
}

function getFileName(uri: string, resourceType: 'image' | 'video' | 'raw') {
  const fallback = `upload.${getExtensionForMimeType(undefined, resourceType)}`;
  if (uri.startsWith('data:')) {
    return `upload.${getExtensionForMimeType(getDataUriMimeType(uri), resourceType)}`;
  }

  const cleanUri = uri.split('?')[0]?.split('#')[0] ?? '';
  const lastSegment = cleanUri.split('/').pop()?.trim();
  const decoded = lastSegment ? decodeURIComponent(lastSegment) : fallback;
  return decoded.includes('.') ? decoded : fallback;
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
    if (uri.startsWith('data:')) {
      formData.append('file', uri);
      return;
    }

    const blobResponse = await fetch(uri);
    if (!blobResponse.ok) {
      throw new Error('Nao foi possivel ler o arquivo selecionado antes do envio.');
    }

    const blob = await blobResponse.blob();
    if (blob.size === 0) {
      throw new Error('O arquivo selecionado esta vazio ou nao pode ser lido pelo navegador.');
    }

    const fileExtension = getExtensionForMimeType(blob.type, resourceType);
    const safeFilename = filename.includes('.') ? filename : `upload.${fileExtension}`;
    const file = new File([blob], safeFilename, { type: blob.type || getMimeType(safeFilename, resourceType) });
    formData.append('file', file);
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
