import { uploadToCloudinary, type CloudinaryUploadResult } from '@/lib/cloudinary';
import { supabase } from '@/lib/supabase';
import { updateUserPhoto } from '@/services/hub.service';

export type ArquivoTipo = 'perfil' | 'aluno' | 'chamado' | 'contrato' | 'justificativa' | 'evidencia_conclusao';

export interface ArquivoMetadata {
  url_segura: string;
  public_id: string;
  tipo_arquivo: string;
  tamanho_bytes: number;
  enviado_por: string;
  relacionamento_tipo?: string;
  relacionamento_id?: string;
}

export const uploadService = {
  async uploadAndSave(
    uri: string,
    enviadoPor: string,
    tipo: ArquivoTipo,
    resourceType: 'image' | 'video' | 'raw' = 'image',
    relacionamento?: { tipo?: string; id?: string }
  ): Promise<{ arquivoId: string; cloudinary: CloudinaryUploadResult }> {
    const cloudinary = await uploadToCloudinary(uri, resourceType);

    const metadata = {
      url_segura: cloudinary.secure_url,
      public_id: cloudinary.public_id,
      tipo_arquivo: tipo,
      tamanho_bytes: cloudinary.bytes,
      enviado_por: enviadoPor,
      relacionamento_tipo: relacionamento?.tipo,
      relacionamento_id: relacionamento?.id,
    } satisfies ArquivoMetadata;
    const payload = Object.fromEntries(
      Object.entries(metadata).filter(([, value]) => value !== undefined)
    );

    const { data, error } = await supabase
      .schema('hub')
      .from('arquivos')
      .insert(payload as never)
      .select('id')
      .single();

    if (error) throw error;

    return { arquivoId: (data as { id: string }).id, cloudinary };
  },

  async uploadProfilePhoto(uri: string, usuarioId: string) {
    const result = await uploadService.uploadAndSave(uri, usuarioId, 'perfil', 'image', {
      tipo: 'usuario',
      id: usuarioId,
    });

    await updateUserPhoto(usuarioId, result.arquivoId, result.cloudinary.secure_url);

    return result;
  },
};
