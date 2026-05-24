import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  const apiSecret = Deno.env.get('CLOUDINARY_API_SECRET');
  const apiKey = Deno.env.get('CLOUDINARY_API_KEY');
  const cloudName = Deno.env.get('CLOUDINARY_CLOUD_NAME');

  if (!apiSecret || !apiKey || !cloudName) {
    return new Response(JSON.stringify({ error: 'Cloudinary não configurado' }), { status: 500 });
  }

  // TODO: gerar assinatura SHA-1 para upload seguro
  return new Response(
    JSON.stringify({ cloudName, apiKey, signature: 'stub', timestamp: Date.now() }),
    { headers: { 'Content-Type': 'application/json' } }
  );
});
