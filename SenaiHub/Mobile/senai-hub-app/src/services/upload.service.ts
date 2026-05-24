import { uploadToCloudinary, type CloudinaryUploadResult } from '@/lib/cloudinary';
import { supabase } from '@/lib/supabase';

export type ArquivoTipo = 'perfil' | 'aluno' | 'chamado' | 'contrato' | 'justificativa';

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
    resourceType: 'image' | 'video' | 'raw' = 'image'
  ): Promise<{ arquivoId: string; cloudinary: CloudinaryUploadResult }> {
    const cloudinary = await uploadToCloudinary(uri, resourceType);

    const metadata: ArquivoMetadata = {
      url_segura: cloudinary.secure_url,
      public_id: cloudinary.public_id,
      tipo_arquivo: tipo,
      tamanho_bytes: cloudinary.bytes,
      enviado_por: enviadoPor,
    };

    const { data, error } = await supabase
      .schema('hub')
      .from('arquivos')
      .insert(metadata as never)
      .select('id')
      .single();

    if (error) throw error;

    return { arquivoId: (data as { id: string }).id, cloudinary };
  },
};
